from flask_sqlalchemy import SQLAlchemy
import json

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(50), default='vendedor')  # administrador, gerente, farmaceutico, vendedor
    permisos = db.Column(db.Text, default='{}')  # JSON con permisos específicos

    def __repr__(self):
        return f'<User {self.username}>'

    def get_permisos(self):
        """Obtiene los permisos del usuario como diccionario"""
        try:
            return json.loads(self.permisos) if self.permisos else {}
        except:
            return {}

    def set_permisos(self, permisos_dict):
        """Establece los permisos del usuario desde un diccionario"""
        self.permisos = json.dumps(permisos_dict)

    def get_permisos_por_rol(self):
        """Obtiene permisos predefinidos según el rol"""
        permisos_roles = {
            'admin': {
                'farmacias': {'ver': True, 'crear': True, 'editar': True, 'eliminar': True},
                'inventarios': {'ver': True, 'crear': True, 'editar': True, 'eliminar': True},
                'busqueda': {'ver': True, 'usar': True},
                'usuarios': {'ver': True, 'crear': True, 'editar': True, 'eliminar': True, 'cambiar_password': True},
                'ventas': {'ver': True, 'crear': True, 'editar': True, 'eliminar': True},
                'proveedores': {'ver': True, 'crear': True, 'editar': True, 'eliminar': True},
                'reportes': {'ver': True, 'generar': True, 'exportar': True}
            },
            'gerente': {
                'farmacias': {'ver': True, 'crear': True, 'editar': True, 'eliminar': False},
                'inventarios': {'ver': True, 'crear': True, 'editar': True, 'eliminar': False},
                'busqueda': {'ver': True, 'usar': True},
                'usuarios': {'ver': True, 'crear': True, 'editar': True, 'eliminar': False, 'cambiar_password': False},
                'ventas': {'ver': True, 'crear': True, 'editar': True, 'eliminar': False},
                'proveedores': {'ver': True, 'crear': True, 'editar': True, 'eliminar': False},
                'reportes': {'ver': True, 'generar': True, 'exportar': True}
            },
            'farmaceutico': {
                'farmacias': {'ver': True, 'crear': False, 'editar': False, 'eliminar': False},
                'inventarios': {'ver': True, 'crear': True, 'editar': True, 'eliminar': False},
                'busqueda': {'ver': True, 'usar': True},
                'usuarios': {'ver': False, 'crear': False, 'editar': False, 'eliminar': False, 'cambiar_password': False},
                'ventas': {'ver': True, 'crear': True, 'editar': True, 'eliminar': False},
                'proveedores': {'ver': True, 'crear': False, 'editar': False, 'eliminar': False},
                'reportes': {'ver': True, 'generar': False, 'exportar': False}
            },
            'vendedor': {
                'farmacias': {'ver': True, 'crear': False, 'editar': False, 'eliminar': False},
                'inventarios': {'ver': True, 'crear': False, 'editar': False, 'eliminar': False},
                'busqueda': {'ver': True, 'usar': True},
                'usuarios': {'ver': False, 'crear': False, 'editar': False, 'eliminar': False, 'cambiar_password': False},
                'ventas': {'ver': True, 'crear': True, 'editar': False, 'eliminar': False},
                'proveedores': {'ver': False, 'crear': False, 'editar': False, 'eliminar': False},
                'reportes': {'ver': False, 'generar': False, 'exportar': False}
            }
        }
        return permisos_roles.get(self.rol, permisos_roles['vendedor'])

    def get_permisos_efectivos(self):
        """Obtiene los permisos efectivos (rol + permisos personalizados)"""
        permisos_rol = self.get_permisos_por_rol()
        permisos_custom = self.get_permisos()
        
        # Combinar permisos del rol con permisos personalizados
        permisos_efectivos = permisos_rol.copy()
        for modulo, acciones in permisos_custom.items():
            if modulo in permisos_efectivos:
                permisos_efectivos[modulo].update(acciones)
            else:
                permisos_efectivos[modulo] = acciones
        
        return permisos_efectivos

    def tiene_permiso(self, modulo, accion):
        """Verifica si el usuario tiene un permiso específico"""
        permisos = self.get_permisos_efectivos()
        return permisos.get(modulo, {}).get(accion, False)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'rol': self.rol,
            'permisos': self.get_permisos(),
            'permisos_efectivos': self.get_permisos_efectivos()
        }
