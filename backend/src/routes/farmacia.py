from flask import Blueprint, request, jsonify
from src.db import mongo
from bson.objectid import ObjectId
from src.models.farmacia import Farmacia
from datetime import datetime

farmacia_bp = Blueprint('farmacia', __name__)
farmacia_model = Farmacia()

@farmacia_bp.route('/farmacias', methods=['GET'])
def get_farmacias():
    try:
        farmacias = mongo.db.farmacias.find()
        return jsonify([farmacia_model.to_dict(farmacia) for farmacia in farmacias])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias', methods=['POST'])
def create_farmacia():
    try:
        data = request.get_json()
        
        if not data or 'nombre' not in data:
            return jsonify({'error': 'Nombre es requerido'}), 400
        
        new_farmacia_data = {
            'nombre': data['nombre'],
            'direccion': data.get('direccion'),
            'telefono': data.get('telefono'),
            'email': data.get('email')
        }
        
        result = mongo.db.farmacias.insert_one(new_farmacia_data)
        new_farmacia = mongo.db.farmacias.find_one({'_id': result.inserted_id})

        return jsonify(farmacia_model.to_dict(new_farmacia)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias/<farmacia_id>', methods=['GET'])
def get_farmacia(farmacia_id):
    try:
        farmacia = mongo.db.farmacias.find_one_or_404({'_id': ObjectId(farmacia_id)})
        return jsonify(farmacia_model.to_dict(farmacia))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias/<farmacia_id>', methods=['PUT'])
def update_farmacia(farmacia_id):
    try:
        data = request.get_json()
        
        if not data or 'nombre' not in data:
            return jsonify({'error': 'Nombre es requerido'}), 400
        
        update_fields = {'nombre': data['nombre']}
        if 'direccion' in data: update_fields['direccion'] = data['direccion']
        if 'telefono' in data: update_fields['telefono'] = data['telefono']
        if 'email' in data: update_fields['email'] = data['email']
        
        mongo.db.farmacias.update_one({'_id': ObjectId(farmacia_id)}, {'$set': update_fields})
        updated_farmacia = mongo.db.farmacias.find_one({'_id': ObjectId(farmacia_id)})

        return jsonify(farmacia_model.to_dict(updated_farmacia))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias/<farmacia_id>', methods=['DELETE'])
def delete_farmacia(farmacia_id):
    try:
        result = mongo.db.farmacias.delete_one({'_id': ObjectId(farmacia_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Farmacia no encontrada'}), 404

        return jsonify({'message': 'Farmacia eliminada exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias/<farmacia_id>/discount', methods=['PUT'])
def apply_daily_discount(farmacia_id):
    try:
        data = request.get_json()
        descuento_porcentaje = data.get('descuento_diario_porcentaje')
        descuento_fecha_str = data.get('descuento_diario_fecha')

        if descuento_porcentaje is None or not isinstance(descuento_porcentaje, (int, float)) or not (0 <= descuento_porcentaje <= 100):
            return jsonify({'error': 'Porcentaje de descuento diario inválido. Debe ser un número entre 0 y 100.'}), 400

        update_fields = {'descuento_diario_porcentaje': float(descuento_porcentaje)}
        if descuento_fecha_str:
            try:
                # Assuming date format 'YYYY-MM-DD'
                descuento_fecha = datetime.strptime(descuento_fecha_str, '%Y-%m-%d')
                update_fields['descuento_diario_fecha'] = descuento_fecha.isoformat()
            except ValueError:
                return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD.'}), 400
        else:
            update_fields['descuento_diario_fecha'] = datetime.now().isoformat()

        mongo.db.farmacias.update_one({'_id': ObjectId(farmacia_id)}, {'$set': update_fields})
        updated_farmacia = mongo.db.farmacias.find_one({'_id': ObjectId(farmacia_id)})

        return jsonify(farmacia_model.to_dict(updated_farmacia))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

