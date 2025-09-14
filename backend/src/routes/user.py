from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from src.db import mongo
from src.models.user import User
from bson.objectid import ObjectId

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    try:
        users = mongo.db.users.find()
        result = []
        for user in users:
            user['id'] = str(user['_id'])
            del user['_id']
            del user['password'] # No exponer password hash
            result.append(user)
        return jsonify(result)
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
        
        if mongo.db.users.find_one({'username': data['username']}):
            return jsonify({'error': 'El nombre de usuario ya existe'}), 400
        if mongo.db.users.find_one({'email': data['email']}):
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        new_user_data = {
            'username': data['username'],
            'email': data['email'],
            'password': generate_password_hash(data['password']),
            'rol': data['rol'],
            'permisos': data.get('permisos', {})
        }

        if data['rol'] == 'proveedor':
            if 'proveedor_id' not in data:
                return jsonify({'error': 'proveedor_id es requerido para el rol de proveedor'}), 400
            new_user_data['proveedor_id'] = ObjectId(data['proveedor_id'])
        
        result = mongo.db.users.insert_one(new_user_data)
        new_user_data['_id'] = result.inserted_id

        user_obj = User(new_user_data)
        
        return jsonify({
            'id': str(new_user_data['_id']),
            'username': new_user_data['username'],
            'email': new_user_data['email'],
            'rol': new_user_data['rol'],
            'permisos': user_obj.get_permisos(),
            'permisos_efectivos': user_obj.get_permisos_efectivos(),
            'message': 'Usuario creado exitosamente'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.get_json()
        update_data = {}

        if 'username' in data:
            if mongo.db.users.find_one({'username': data['username'], '_id': {'$ne': ObjectId(user_id)}}):
                return jsonify({'error': 'El nombre de usuario ya existe'}), 400
            update_data['username'] = data['username']
        
        if 'email' in data:
            if mongo.db.users.find_one({'email': data['email'], '_id': {'$ne': ObjectId(user_id)}}):
                return jsonify({'error': 'El email ya está registrado'}), 400
            update_data['email'] = data['email']
        
        if 'password' in data and data['password']:
            update_data['password'] = generate_password_hash(data['password'])
        
        if 'rol' in data:
            update_data['rol'] = data['rol']
        
        if 'permisos' in data:
            update_data['permisos'] = data['permisos']

        if 'proveedor_id' in data:
            update_data['proveedor_id'] = ObjectId(data['proveedor_id'])
        
        if update_data:
            mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': update_data})
        
        updated_user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        user_obj = User(updated_user_data)

        return jsonify(user_obj.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = mongo.db.users.find_one({'username': data['username']})
        
        if not user or not check_password_hash(user.get('password'), data['password']):
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        user_data_to_return = {
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'rol': user['rol'],
            'message': 'Login exitoso'
        }
        if 'proveedor_id' in user:
            user_data_to_return['proveedor_id'] = str(user['proveedor_id'])

        return jsonify(user_data_to_return)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

