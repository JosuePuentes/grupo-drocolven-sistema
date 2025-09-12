from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from src.models.user import db, User

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        return jsonify([{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'rol': user.rol
        } for user in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password', 'rol']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} es requerido'}), 400
        
        # Verificar si el usuario ya existe
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'error': 'El nombre de usuario ya existe'}), 400
        
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        # Crear nuevo usuario
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=generate_password_hash(data['password']),
            rol=data['rol']
        )
        
        # Establecer permisos personalizados si se proporcionan
        if 'permisos' in data:
            new_user.set_permisos(data['permisos'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'rol': new_user.rol,
            'permisos': new_user.get_permisos(),
            'permisos_efectivos': new_user.get_permisos_efectivos(),
            'message': 'Usuario creado exitosamente'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        data = request.get_json()
        
        # Actualizar campos si están presentes
        if 'username' in data:
            # Verificar que el username no esté en uso por otro usuario
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({'error': 'El nombre de usuario ya existe'}), 400
            user.username = data['username']
        
        if 'email' in data:
            # Verificar que el email no esté en uso por otro usuario
            existing_email = User.query.filter_by(email=data['email']).first()
            if existing_email and existing_email.id != user_id:
                return jsonify({'error': 'El email ya está registrado'}), 400
            user.email = data['email']
        
        if 'password' in data and data['password']:
            user.password = generate_password_hash(data['password'])
        
        if 'rol' in data:
            user.rol = data['rol']
        
        # Actualizar permisos personalizados si se proporcionan
        if 'permisos' in data:
            user.set_permisos(data['permisos'])
        
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'rol': user.rol,
            'permisos': user.get_permisos(),
            'permisos_efectivos': user.get_permisos_efectivos(),
            'message': 'Usuario actualizado exitosamente'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Usuario eliminado exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>/change-password', methods=['PUT'])
def change_user_password(user_id):
    try:
        data = request.get_json()
        
        required_fields = ['current_password', 'new_password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} es requerido'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Verificar contraseña actual
        if not check_password_hash(user.password, data['current_password']):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 400
        
        # Validar nueva contraseña
        if len(data['new_password']) < 6:
            return jsonify({'error': 'La nueva contraseña debe tener al menos 6 caracteres'}), 400
        
        # Actualizar contraseña
        user.password = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Contraseña actualizada exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
def reset_user_password(user_id):
    try:
        data = request.get_json()
        
        if 'new_password' not in data:
            return jsonify({'error': 'new_password es requerido'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Validar nueva contraseña
        if len(data['new_password']) < 6:
            return jsonify({'error': 'La nueva contraseña debe tener al menos 6 caracteres'}), 400
        
        # Resetear contraseña (solo para administradores)
        user.password = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Contraseña reseteada exitosamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if 'username' not in data or 'password' not in data:
            return jsonify({'error': 'Usuario y contraseña son requeridos'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'rol': user.rol,
            'message': 'Login exitoso'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/permisos/disponibles', methods=['GET'])
def get_permisos_disponibles():
    """Obtiene la lista de todos los permisos disponibles en el sistema"""
    try:
        permisos_disponibles = {
            'farmacias': {
                'label': 'Farmacias',
                'acciones': {
                    'ver': 'Ver farmacias',
                    'crear': 'Crear farmacias',
                    'editar': 'Editar farmacias',
                    'eliminar': 'Eliminar farmacias'
                }
            },
            'inventarios': {
                'label': 'Inventarios',
                'acciones': {
                    'ver': 'Ver inventarios',
                    'crear': 'Crear/Subir inventarios',
                    'editar': 'Editar inventarios',
                    'eliminar': 'Eliminar inventarios'
                }
            },
            'busqueda': {
                'label': 'Búsqueda',
                'acciones': {
                    'ver': 'Acceder al módulo',
                    'usar': 'Buscar medicamentos'
                }
            },
            'usuarios': {
                'label': 'Usuarios',
                'acciones': {
                    'ver': 'Ver usuarios',
                    'crear': 'Crear usuarios',
                    'editar': 'Editar usuarios',
                    'eliminar': 'Eliminar usuarios',
                    'cambiar_password': 'Cambiar contraseñas'
                }
            },
            'ventas': {
                'label': 'Ventas',
                'acciones': {
                    'ver': 'Ver ventas',
                    'crear': 'Procesar ventas',
                    'editar': 'Editar ventas',
                    'eliminar': 'Anular ventas'
                }
            },
            'proveedores': {
                'label': 'Proveedores',
                'acciones': {
                    'ver': 'Ver proveedores',
                    'crear': 'Crear proveedores',
                    'editar': 'Editar proveedores',
                    'eliminar': 'Eliminar proveedores'
                }
            },
            'reportes': {
                'label': 'Reportes',
                'acciones': {
                    'ver': 'Ver reportes',
                    'generar': 'Generar reportes',
                    'exportar': 'Exportar reportes'
                }
            }
        }
        
        return jsonify(permisos_disponibles)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/permisos/rol/<rol>', methods=['GET'])
def get_permisos_por_rol(rol):
    """Obtiene los permisos predefinidos para un rol específico"""
    try:
        # Crear un usuario temporal para obtener los permisos del rol
        temp_user = User(rol=rol)
        permisos_rol = temp_user.get_permisos_por_rol()
        
        return jsonify(permisos_rol)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

