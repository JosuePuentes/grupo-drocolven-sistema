from src.main import app
from src.models.user import db, User
from src.models.farmacia import Farmacia
from src.models.inventario import Inventario
from src.models.cliente import Cliente
from src.models.venta import Venta
from src.models.proveedor import Proveedor
from werkzeug.security import generate_password_hash

with app.app_context():
    # Crear todas las tablas
    db.create_all()
    
    # Verificar si ya existe el admin
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
        print("Usuario administrador creado exitosamente")
        print("Usuario: admin")
        print("Contraseña: admin123")
    else:
        print("El usuario administrador ya existe")

