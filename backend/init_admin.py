import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from werkzeug.security import generate_password_hash
from flask import Flask

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    # Verificar si ya existe un admin
    admin_exists = User.query.filter_by(username='admin').first()
    
    if not admin_exists:
        # Crear usuario administrador
        admin_user = User(
            username='admin',
            email='admin@farmacia.com',
            password=generate_password_hash('admin123'),
            rol='admin'
        )
        
        db.session.add(admin_user)
        db.session.commit()
        print("Usuario administrador creado exitosamente:")
        print("Usuario: admin")
        print("Contraseña: admin123")
        print("Rol: admin")
    else:
        print("El usuario administrador ya existe")
