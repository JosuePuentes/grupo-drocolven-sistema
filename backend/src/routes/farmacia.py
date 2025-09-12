from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.farmacia import Farmacia

farmacia_bp = Blueprint('farmacia', __name__)

@farmacia_bp.route('/farmacias', methods=['GET'])
def get_farmacias():
    try:
        farmacias = Farmacia.query.all()
        return jsonify([farmacia.to_dict() for farmacia in farmacias])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias', methods=['POST'])
def create_farmacia():
    try:
        data = request.get_json()
        
        if not data or 'nombre' not in data:
            return jsonify({'error': 'Nombre es requerido'}), 400
        
        farmacia = Farmacia(nombre=data['nombre'])
        db.session.add(farmacia)
        db.session.commit()
        
        return jsonify(farmacia.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias/<int:farmacia_id>', methods=['GET'])
def get_farmacia(farmacia_id):
    try:
        farmacia = Farmacia.query.get_or_404(farmacia_id)
        return jsonify(farmacia.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias/<int:farmacia_id>', methods=['PUT'])
def update_farmacia(farmacia_id):
    try:
        farmacia = Farmacia.query.get_or_404(farmacia_id)
        data = request.get_json()
        
        if not data or 'nombre' not in data:
            return jsonify({'error': 'Nombre es requerido'}), 400
        
        farmacia.nombre = data['nombre']
        db.session.commit()
        
        return jsonify(farmacia.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@farmacia_bp.route('/farmacias/<int:farmacia_id>', methods=['DELETE'])
def delete_farmacia(farmacia_id):
    try:
        farmacia = Farmacia.query.get_or_404(farmacia_id)
        db.session.delete(farmacia)
        db.session.commit()
        
        return jsonify({'message': 'Farmacia eliminada exitosamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

