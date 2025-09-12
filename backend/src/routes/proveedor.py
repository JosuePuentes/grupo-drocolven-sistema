from flask import Blueprint, request, jsonify
from src.models.proveedor import Proveedor
from src.models.user import db

proveedor_bp = Blueprint('proveedor', __name__)

@proveedor_bp.route('/proveedores', methods=['GET'])
def get_proveedores():
    """Obtener todos los proveedores"""
    try:
        proveedores = Proveedor.query.filter_by(activo=True).all()
        return jsonify([proveedor.to_dict() for proveedor in proveedores])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<int:proveedor_id>', methods=['GET'])
def get_proveedor(proveedor_id):
    """Obtener un proveedor específico"""
    try:
        proveedor = Proveedor.query.get(proveedor_id)
        if not proveedor:
            return jsonify({'error': 'Proveedor no encontrado'}), 404
        return jsonify(proveedor.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores', methods=['POST'])
def create_proveedor():
    """Crear un nuevo proveedor"""
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre del proveedor es requerido'}), 400
        
        # Verificar si ya existe un proveedor con el mismo nombre
        proveedor_existente = Proveedor.query.filter_by(nombre=data['nombre']).first()
        if proveedor_existente:
            return jsonify({'error': 'Ya existe un proveedor con ese nombre'}), 400
        
        # Crear nuevo proveedor
        nuevo_proveedor = Proveedor(
            nombre=data['nombre'],
            contacto=data.get('contacto', ''),
            telefono=data.get('telefono', ''),
            email=data.get('email', ''),
            direccion=data.get('direccion', ''),
            dias_credito=int(data.get('dias_credito', 0)),
            descuento_comercial=float(data.get('descuento_comercial', 0.0)),
            descuento_pronto_pago=float(data.get('descuento_pronto_pago', 0.0))
        )
        
        db.session.add(nuevo_proveedor)
        db.session.commit()
        
        return jsonify({
            'message': 'Proveedor creado exitosamente',
            'proveedor': nuevo_proveedor.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<int:proveedor_id>', methods=['PUT'])
def update_proveedor(proveedor_id):
    """Actualizar un proveedor existente"""
    try:
        proveedor = Proveedor.query.get(proveedor_id)
        if not proveedor:
            return jsonify({'error': 'Proveedor no encontrado'}), 404
        
        data = request.get_json()
        
        # Validar nombre único (excluyendo el proveedor actual)
        if data.get('nombre') and data['nombre'] != proveedor.nombre:
            proveedor_existente = Proveedor.query.filter_by(nombre=data['nombre']).first()
            if proveedor_existente:
                return jsonify({'error': 'Ya existe un proveedor con ese nombre'}), 400
        
        # Actualizar campos
        if 'nombre' in data:
            proveedor.nombre = data['nombre']
        if 'contacto' in data:
            proveedor.contacto = data['contacto']
        if 'telefono' in data:
            proveedor.telefono = data['telefono']
        if 'email' in data:
            proveedor.email = data['email']
        if 'direccion' in data:
            proveedor.direccion = data['direccion']
        if 'dias_credito' in data:
            proveedor.dias_credito = int(data['dias_credito'])
        if 'descuento_comercial' in data:
            proveedor.descuento_comercial = float(data['descuento_comercial'])
        if 'descuento_pronto_pago' in data:
            proveedor.descuento_pronto_pago = float(data['descuento_pronto_pago'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Proveedor actualizado exitosamente',
            'proveedor': proveedor.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<int:proveedor_id>', methods=['DELETE'])
def delete_proveedor(proveedor_id):
    """Eliminar un proveedor (soft delete)"""
    try:
        proveedor = Proveedor.query.get(proveedor_id)
        if not proveedor:
            return jsonify({'error': 'Proveedor no encontrado'}), 404
        
        # Soft delete - marcar como inactivo
        proveedor.activo = False
        db.session.commit()
        
        return jsonify({'message': 'Proveedor eliminado exitosamente'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/<int:proveedor_id>/activar', methods=['PUT'])
def activar_proveedor(proveedor_id):
    """Reactivar un proveedor"""
    try:
        proveedor = Proveedor.query.get(proveedor_id)
        if not proveedor:
            return jsonify({'error': 'Proveedor no encontrado'}), 404
        
        proveedor.activo = True
        db.session.commit()
        
        return jsonify({
            'message': 'Proveedor reactivado exitosamente',
            'proveedor': proveedor.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@proveedor_bp.route('/proveedores/estadisticas', methods=['GET'])
def get_estadisticas_proveedores():
    """Obtener estadísticas de proveedores"""
    try:
        total_proveedores = Proveedor.query.filter_by(activo=True).count()
        proveedores_con_credito = Proveedor.query.filter(
            Proveedor.activo == True,
            Proveedor.dias_credito > 0
        ).count()
        
        promedio_dias_credito = db.session.query(
            db.func.avg(Proveedor.dias_credito)
        ).filter(Proveedor.activo == True).scalar() or 0
        
        promedio_descuento_comercial = db.session.query(
            db.func.avg(Proveedor.descuento_comercial)
        ).filter(Proveedor.activo == True).scalar() or 0
        
        return jsonify({
            'total_proveedores': total_proveedores,
            'proveedores_con_credito': proveedores_con_credito,
            'promedio_dias_credito': round(promedio_dias_credito, 1),
            'promedio_descuento_comercial': round(promedio_descuento_comercial, 2)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

