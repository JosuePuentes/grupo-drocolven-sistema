from flask import Blueprint, request, jsonify
from src.db import mongo
from bson.objectid import ObjectId

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/reportes/productos-falla', methods=['GET'])
def get_productos_falla():
    try:
        farmacia_id = request.args.get('farmacia_id')
        limite_stock = int(request.args.get('limite_stock', 5))

        pipeline = []
        if farmacia_id:
            pipeline.append({'$match': {'farmacia_id': ObjectId(farmacia_id)}})

        pipeline.extend([
            {
                '$lookup': {
                    'from': 'farmacias',
                    'localField': 'farmacia_id',
                    'foreignField': '_id',
                    'as': 'farmacia_info'
                }
            },
            {'$unwind': '$farmacia_info'},
            {
                '$match': {
                    '$or': [
                        {'pedido': 0},
                        {'pedido': {'$lte': limite_stock}}
                    ]
                }
            },
            {
                '$group': {
                    '_id': '$codigo',
                    'descripcion': {'$first': '$descripcion'},
                    'laboratorio': {'$first': '$laboratorio'},
                    'precio_referencia': {'$first': '$precio_neto'},
                    'farmacias_afectadas': {
                        '$push': {
                            'farmacia_id': '$farmacia_id',
                            'farmacia_nombre': '$farmacia_info.nombre',
                            'stock_actual': '$pedido'
                        }
                    },
                    'stock_total': {'$sum': '$pedido'}
                }
            },
            {
                '$lookup': {
                    'from': 'lista_precios_proveedores',
                    'localField': '_id',
                    'foreignField': 'codigo_producto',
                    'as': 'precios_proveedores'
                }
            },
            {
                '$addFields': {
                    'mejor_precio_proveedor': {
                        '$minElement': {
                            'input': '$precios_proveedores',
                            'sortBy': {'precio': 1}
                        }
                    }
                }
            },
            {
                '$lookup': {
                    'from': 'proveedores',
                    'localField': 'mejor_precio_proveedor.proveedor_id',
                    'foreignField': '_id',
                    'as': 'mejor_proveedor_info'
                }
            },
            {
                '$unwind': {
                    'path': '$mejor_proveedor_info',
                    'preserveNullAndEmptyArrays': True
                }
            }
        ])

        productos_falla = list(mongo.db.inventarios.aggregate(pipeline))
        resultado = []
        for producto in productos_falla:
            stock_minimo = max(15, limite_stock * 3)
            sugerencia_total = 0
            farmacias_sin_stock = 0
            farmacias_afectadas_detalles = []

            for farmacia in producto['farmacias_afectadas']:
                sugerencia_farmacia = max(0, stock_minimo - farmacia['stock_actual'])
                sugerencia_total += sugerencia_farmacia
                if farmacia['stock_actual'] == 0:
                    farmacias_sin_stock += 1
                farmacia['sugerencia_compra'] = sugerencia_farmacia
                farmacia['valor_estimado'] = sugerencia_farmacia * producto['precio_referencia']
                farmacias_afectadas_detalles.append(farmacia)

            producto['farmacias_afectadas'] = sorted(farmacias_afectadas_detalles, key=lambda x: x['sugerencia_compra'], reverse=True)
            producto['cantidad_total_sugerida'] = sugerencia_total
            producto['valor_total_estimado'] = sugerencia_total * producto['precio_referencia']
            producto['farmacias_sin_stock'] = farmacias_sin_stock
            producto['total_farmacias_afectadas'] = len(producto['farmacias_afectadas'])

            # Add best price supplier info
            if 'mejor_precio_proveedor' in producto and producto['mejor_precio_proveedor']:
                producto['sugerencia_proveedor'] = producto['mejor_proveedor_info']['nombre'] if 'mejor_proveedor_info' in producto else 'Desconocido'
                producto['precio_sugerido'] = producto['mejor_precio_proveedor']['precio']
            else:
                producto['sugerencia_proveedor'] = 'N/A'
                producto['precio_sugerido'] = 'N/A'

            porcentaje_sin_stock = farmacias_sin_stock / len(producto['farmacias_afectadas']) if len(producto['farmacias_afectadas']) > 0 else 0
            if porcentaje_sin_stock >= 0.7:
                prioridad = 'Alta'
            elif porcentaje_sin_stock >= 0.3:
                prioridad = 'Media'
            else:
                prioridad = 'Baja'
            producto['prioridad'] = prioridad
            resultado.append(producto)

        prioridad_orden = {'Alta': 3, 'Media': 2, 'Baja': 1}
        resultado.sort(key=lambda x: (prioridad_orden[x['prioridad']], x['cantidad_total_sugerida']), reverse=True)

        return jsonify(resultado)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reportes_bp.route('/reportes/estadisticas-fallas', methods=['GET'])
def get_estadisticas_fallas():
    try:
        limite_stock = int(request.args.get('limite_stock', 5))

        productos_sin_stock = mongo.db.inventarios.count_documents({'pedido': 0})
        productos_stock_bajo = mongo.db.inventarios.count_documents({'pedido': {'$gt': 0, '$lte': limite_stock}})
        total_productos_falla = productos_sin_stock + productos_stock_bajo

        pipeline = [
            {'$match': {'pedido': {'$lte': limite_stock}}},
            {'$group': {'_id': '$farmacia_id', 'productos_falla': {'$sum': 1}}},
            {'$sort': {'productos_falla': -1}},
            {'$limit': 5},
            {'$lookup': {'from': 'farmacias', 'localField': '_id', 'foreignField': '_id', 'as': 'farmacia_info'}},
            {'$unwind': '$farmacia_info'},
            {'$project': {'nombre': '$farmacia_info.nombre', 'productos_falla': 1, '_id': 0}}
        ]
        farmacias_afectadas = list(mongo.db.inventarios.aggregate(pipeline))

        return jsonify({
            'total_productos_falla': total_productos_falla,
            'productos_sin_stock': productos_sin_stock,
            'productos_stock_bajo': productos_stock_bajo,
            'farmacias_mas_afectadas': farmacias_afectadas
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reportes_bp.route('/reportes/productos-sobrestock', methods=['GET'])
def get_productos_sobrestock():
    try:
        farmacia_id = request.args.get('farmacia_id')
        limite_stock_alto = int(request.args.get('limite_stock_alto', 50)) # Default to 50 units for overstock

        pipeline = []
        if farmacia_id:
            pipeline.append({'$match': {'farmacia_id': ObjectId(farmacia_id)}})

        pipeline.extend([
            {
                '$lookup': {
                    'from': 'farmacias',
                    'localField': 'farmacia_id',
                    'foreignField': '_id',
                    'as': 'farmacia_info'
                }
            },
            {'$unwind': '$farmacia_info'},
            {
                '$match': {
                    'total': {'$gt': limite_stock_alto}
                }
            },
            {
                '$group': {
                    '_id': '$codigo',
                    'descripcion': {'$first': '$descripcion'},
                    'laboratorio': {'$first': '$laboratorio'},
                    'stock_total': {'$sum': '$total'},
                    'farmacias_con_sobrestock': {
                        '$push': {
                            'farmacia_id': '$farmacia_id',
                            'farmacia_nombre': '$farmacia_info.nombre',
                            'stock_actual': '$total'
                        }
                    }
                }
            },
            {'$sort': {'stock_total': -1}}
        ])

        productos_sobrestock = list(mongo.db.inventarios.aggregate(pipeline))
        return jsonify(productos_sobrestock)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reportes_bp.route('/reportes/last-purchase-price/<codigo_producto>', methods=['GET'])
def get_last_purchase_price(codigo_producto):
    """Obtener el último precio de compra de un producto."""
    try:
        last_purchase = mongo.db.purchase_history.find(
            {'codigo_producto': codigo_producto}
        ).sort('fecha_compra', -1).limit(1)

        result = list(last_purchase)
        if result:
            return jsonify({
                'codigo_producto': result[0]['codigo_producto'],
                'precio_unitario': result[0]['precio_unitario'],
                'fecha_compra': result[0]['fecha_compra'].isoformat()
            })
        else:
            return jsonify({'message': 'No se encontró historial de compra para este producto'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

