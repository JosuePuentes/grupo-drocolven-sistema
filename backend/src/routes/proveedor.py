from flask import Blueprint, request, jsonify
from src.db import mongo
from bson.objectid import ObjectId
from src.models.proveedor import Proveedor
from datetime import datetime

proveedor_bp = Blueprint('proveedor', __name__)
proveedor_model = Proveedor()

@proveedor_bp.route('/proveedores', methods=['GET'])
def get_proveedores():
    """Obtener todos los proveedores"""
    try:
        proveedores = mongo.db.proveedores.find({'activo': True})
        return jsonify([proveedor_model.to_dict(p) for p in proveedores])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<proveedor_id>', methods=['GET'])
def get_proveedor(proveedor_id):
    """Obtener un proveedor específico"""
    try:
        proveedor = mongo.db.proveedores.find_one_or_404({'_id': ObjectId(proveedor_id)})
        return jsonify(proveedor_model.to_dict(proveedor))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores', methods=['POST'])
def create_proveedor():
    """Crear un nuevo proveedor"""
    try:
        data = request.get_json()
        
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre del proveedor es requerido'}), 400
        
        proveedor_existente = mongo.db.proveedores.find_one({'nombre': data['nombre']})
        if proveedor_existente:
            return jsonify({'error': 'Ya existe un proveedor con ese nombre'}), 400
        
        nuevo_proveedor_data = {
            'nombre': data['nombre'],
            'contacto': data.get('contacto', ''),
            'telefono': data.get('telefono', ''),
            'email': data.get('email', ''),
            'direccion': data.get('direccion', ''),
            'dias_credito': int(data.get('dias_credito', 0)),
            'descuento_comercial': float(data.get('descuento_comercial', 0.0)),
            'descuento_pronto_pago': float(data.get('descuento_pronto_pago', 0.0)),
            'fecha_creacion': datetime.utcnow(),
            'activo': True
        }
        
        result = mongo.db.proveedores.insert_one(nuevo_proveedor_data)
        nuevo_proveedor_data['_id'] = result.inserted_id

        return jsonify({
            'message': 'Proveedor creado exitosamente',
            'proveedor': proveedor_model.to_dict(nuevo_proveedor_data)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<proveedor_id>', methods=['PUT'])
def update_proveedor(proveedor_id):
    """Actualizar un proveedor existente"""
    try:
        data = request.get_json()
        update_data = {}

        if data.get('nombre'):
            proveedor_existente = mongo.db.proveedores.find_one({'nombre': data['nombre']})
            if proveedor_existente and str(proveedor_existente['_id']) != proveedor_id:
                return jsonify({'error': 'Ya existe un proveedor con ese nombre'}), 400
            update_data['nombre'] = data['nombre']

        for field in ['contacto', 'telefono', 'email', 'direccion']:
            if field in data:
                update_data[field] = data[field]
        
        for field in ['dias_credito', 'descuento_comercial', 'descuento_pronto_pago']:
            if field in data:
                update_data[field] = float(data[field])

        if update_data:
            mongo.db.proveedores.update_one({'_id': ObjectId(proveedor_id)}, {'$set': update_data})
        
        updated_proveedor = mongo.db.proveedores.find_one({'_id': ObjectId(proveedor_id)})

        return jsonify({
            'message': 'Proveedor actualizado exitosamente',
            'proveedor': proveedor_model.to_dict(updated_proveedor)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<proveedor_id>', methods=['DELETE'])
def delete_proveedor(proveedor_id):
    """Eliminar un proveedor (soft delete)"""
    try:
        mongo.db.proveedores.update_one({'_id': ObjectId(proveedor_id)}, {'$set': {'activo': False}})
        return jsonify({'message': 'Proveedor eliminado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<proveedor_id>/activar', methods=['PUT'])
def activar_proveedor(proveedor_id):
    """Reactivar un proveedor"""
    try:
        mongo.db.proveedores.update_one({'_id': ObjectId(proveedor_id)}, {'$set': {'activo': True}})
        updated_proveedor = mongo.db.proveedores.find_one({'_id': ObjectId(proveedor_id)})
        return jsonify({
            'message': 'Proveedor reactivado exitosamente',
            'proveedor': proveedor_model.to_dict(updated_proveedor)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/estadisticas', methods=['GET'])
def get_estadisticas_proveedores():
    """Obtener estadísticas de proveedores"""
    try:
        total_proveedores = mongo.db.proveedores.count_documents({'activo': True})
        proveedores_con_credito = mongo.db.proveedores.count_documents({'activo': True, 'dias_credito': {'$gt': 0}})

        pipeline = [
            {'$match': {'activo': True}},
            {'$group': {
                '_id': None,
                'avg_dias_credito': {'$avg': '$dias_credito'},
                'avg_descuento_comercial': {'$avg': '$descuento_comercial'}
            }}
        ]
        stats = list(mongo.db.proveedores.aggregate(pipeline))
        
        promedio_dias_credito = stats[0]['avg_dias_credito'] if stats and 'avg_dias_credito' in stats[0] else 0
        promedio_descuento_comercial = stats[0]['avg_descuento_comercial'] if stats and 'avg_descuento_comercial' in stats[0] else 0

        return jsonify({
            'total_proveedores': total_proveedores,
            'proveedores_con_credito': proveedores_con_credito,
            'promedio_dias_credito': round(promedio_dias_credito, 1),
            'promedio_descuento_comercial': round(promedio_descuento_comercial, 2)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<proveedor_id>/precios', methods=['POST'])
def add_update_proveedor_precio(proveedor_id):
    """Añadir o actualizar el precio de un producto para un proveedor."""
    try:
        data = request.get_json()
        if not all(k in data for k in ['codigo_producto', 'descripcion', 'precio']):
            return jsonify({'error': 'Código de producto, descripción y precio son requeridos'}), 400

        # Check if proveedor exists
        proveedor = mongo.db.proveedores.find_one({'_id': ObjectId(proveedor_id)})
        if not proveedor:
            return jsonify({'error': 'Proveedor no encontrado'}), 404

        update_data = {
            'proveedor_id': ObjectId(proveedor_id),
            'codigo_producto': data['codigo_producto'],
            'descripcion': data['descripcion'],
            'precio': float(data['precio']),
            'fecha_actualizacion': datetime.utcnow()
        }

        # Upsert: update if exists, insert if not
        mongo.db.lista_precios_proveedores.update_one(
            {'proveedor_id': ObjectId(proveedor_id), 'codigo_producto': data['codigo_producto']},
            {'$set': update_data},
            upsert=True
        )

        return jsonify({'message': 'Precio de producto actualizado exitosamente para el proveedor'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<proveedor_id>/precios', methods=['GET'])
def get_proveedor_precios(proveedor_id):
    """Obtener todos los precios de productos de un proveedor."""
    try:
        precios = mongo.db.lista_precios_proveedores.find({'proveedor_id': ObjectId(proveedor_id)})
        return jsonify([{
            'id': str(p['_id']),
            'proveedor_id': str(p['proveedor_id']),
            'codigo_producto': p['codigo_producto'],
            'descripcion': p['descripcion'],
            'precio': p['precio'],
            'fecha_actualizacion': p['fecha_actualizacion'].isoformat()
        } for p in precios])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/precios/producto/<codigo_producto>', methods=['GET'])
def get_product_prices_from_all_suppliers(codigo_producto):
    """Obtener precios de un producto específico de todos los proveedores."""
    try:
        pipeline = [
            {'$match': {'codigo_producto': codigo_producto}},
            {
                '$lookup': {
                    'from': 'proveedores',
                    'localField': 'proveedor_id',
                    'foreignField': '_id',
                    'as': 'proveedor_info'
                }
            },
            {'$unwind': '$proveedor_info'},
            {'$project': {
                '_id': 0,
                'proveedor_id': '$proveedor_id',
                'proveedor_nombre': '$proveedor_info.nombre',
                'precio': '$precio',
                'fecha_actualizacion': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$fecha_actualizacion'}}
            }}
        ]
        prices = list(mongo.db.lista_precios_proveedores.aggregate(pipeline))
        return jsonify(prices)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

