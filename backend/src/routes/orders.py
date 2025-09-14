from flask import Blueprint, request, jsonify
from src.db import mongo
from bson.objectid import ObjectId
from datetime import datetime
from itertools import groupby

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/orders', methods=['POST'])
def create_order():
    """Crea órdenes a partir de un carrito, agrupadas por proveedor."""
    try:
        cart_items = request.get_json()
        if not cart_items:
            return jsonify({'error': 'El carrito está vacío'}), 400

        items_by_supplier = {k: list(v) for k, v in groupby(sorted(cart_items, key=lambda x: x['proveedor_id']), key=lambda x: x['proveedor_id'])}
        
        created_orders_ids = []
        for supplier_id, items in items_by_supplier.items():
            total_order_price = sum(item['quantity'] * item['price'] for item in items)
            pharmacy_id = "60d5f1f3b4f3f3f3f3f3f3f3" # Placeholder - Reemplazar con ID de farmacia del usuario autenticado

            new_order = {
                'pharmacy_id': ObjectId(pharmacy_id),
                'supplier_id': ObjectId(supplier_id),
                'total': total_order_price,
                'status': 'pending',
                'order_date': datetime.utcnow(),
                'items': [{'codigo': i['codigo'], 'descripcion': i['descripcion'], 'quantity': i['quantity'], 'price': i['price']} for i in items]
            }
            result = mongo.db.orders.insert_one(new_order)
            created_orders_ids.append(str(result.inserted_id))

        return jsonify({'message': f'{len(created_orders_ids)} orden(es) creada(s) exitosamente.', 'order_ids': created_orders_ids}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/orders/pharmacy/<pharmacy_id>', methods=['GET'])
def get_pharmacy_orders(pharmacy_id):
    """Obtiene todas las órdenes para una farmacia específica."""
    try:
        orders = mongo.db.orders.find({'pharmacy_id': ObjectId(pharmacy_id)}).sort('order_date', -1)
        result = []
        for order in orders:
            order['_id'] = str(order['_id'])
            order['supplier_id'] = str(order['supplier_id'])
            order['pharmacy_id'] = str(order['pharmacy_id'])
            result.append(order)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/orders/supplier/<supplier_id>', methods=['GET'])
def get_supplier_orders(supplier_id):
    """Obtiene todas las órdenes para un proveedor específico."""
    try:
        orders = mongo.db.orders.find({'supplier_id': ObjectId(supplier_id)}).sort('order_date', -1)
        result = []
        for order in orders:
            order['_id'] = str(order['_id'])
            order['supplier_id'] = str(order['supplier_id'])
            order['pharmacy_id'] = str(order['pharmacy_id'])
            result.append(order)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/orders/<order_id>/receive', methods=['POST'])
def receive_order(order_id):
    """Marca una orden como recibida y adjunta una foto."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No se encontró archivo de foto'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó archivo'}), 400

        # Guardar archivo
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        # En una app real, subirías esto a un bucket (S3, GCS) y guardarías la URL.
        # Por ahora, guardaremos la ruta local.

        update_data = {
            'status': 'received',
            'received_date': datetime.utcnow(),
            'delivery_photo_url': filepath 
        }

        result = mongo.db.orders.update_one(
            {'_id': ObjectId(order_id)},
            {'$set': update_data}
        )

        if result.matched_count == 0:
            os.remove(filepath) # Clean up file if order not found
            return jsonify({'error': 'Orden no encontrada'}), 404

        # Record purchase history for each item in the order
        order = mongo.db.orders.find_one({'_id': ObjectId(order_id)})
        if order:
            for item in order['items']:
                purchase_record = {
                    'order_id': ObjectId(order_id),
                    'pharmacy_id': order['pharmacy_id'],
                    'supplier_id': order['supplier_id'],
                    'codigo_producto': item['codigo'],
                    'descripcion': item['descripcion'],
                    'cantidad': item['quantity'],
                    'precio_unitario': item['price'],
                    'fecha_compra': datetime.utcnow()
                }
                mongo.db.purchase_history.insert_one(purchase_record)

        return jsonify({'message': 'Orden marcada como recibida exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@orders_bp.route('/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Actualiza el estado de una orden (ej: a 'in-transit')."""
    try:
        data = request.get_json()
        new_status = data.get('status')

        if not new_status:
            return jsonify({'error': 'El estado es requerido'}), 400

        result = mongo.db.orders.update_one(
            {'_id': ObjectId(order_id)},
            {'$set': {'status': new_status}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Orden no encontrada'}), 404

        return jsonify({'message': 'Estado de la orden actualizado exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/orders/<order_id>/items', methods=['PUT'])
def update_order_items(order_id):
    """Permite a un proveedor modificar los ítems de una orden pendiente."""
    try:
        data = request.get_json()
        if not data or 'items' not in data or not isinstance(data['items'], list):
            return jsonify({'error': 'Se requiere una lista de ítems para actualizar la orden'}), 400

        order = mongo.db.orders.find_one({'_id': ObjectId(order_id)})
        if not order:
            return jsonify({'error': 'Orden no encontrada'}), 404

        if order['status'] != 'pending':
            return jsonify({'error': 'Solo se pueden modificar órdenes con estado pendiente'}), 400

        updated_items = []
        new_total = 0
        for item_data in data['items']:
            codigo = item_data.get('codigo')
            quantity = item_data.get('quantity')
            price = item_data.get('price') # Assuming price is sent with item for recalculation
            descripcion = item_data.get('descripcion') # Assuming description is sent

            if not all([codigo, quantity, price, descripcion]) or not isinstance(quantity, int) or quantity <= 0:
                return jsonify({'error': 'Cada ítem debe tener código, descripción, cantidad y precio válidos'}), 400
            
            updated_items.append({
                'codigo': codigo,
                'descripcion': descripcion,
                'quantity': quantity,
                'price': price
            })
            new_total += quantity * price
        
        # Remove items with quantity 0 or less
        updated_items = [item for item in updated_items if item['quantity'] > 0]

        result = mongo.db.orders.update_one(
            {'_id': ObjectId(order_id)},
            {'$set': {'items': updated_items, 'total': new_total}}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Orden no encontrada o no se pudo actualizar'}), 404

        updated_order = mongo.db.orders.find_one({'_id': ObjectId(order_id)})
        updated_order['_id'] = str(updated_order['_id'])
        updated_order['supplier_id'] = str(updated_order['supplier_id'])
        updated_order['pharmacy_id'] = str(updated_order['pharmacy_id'])

        return jsonify({'message': 'Ítems de la orden actualizados exitosamente', 'order': updated_order}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
