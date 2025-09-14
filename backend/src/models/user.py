import json

class User:
    def __init__(self, user_data):
        self.user_data = user_data

    def get_permisos(self):
        """Obtiene los permisos del usuario como diccionario"""
        return self.user_data.get('permisos', {})

    def set_permisos(self, permisos_dict):
        """Establece los permisos del usuario desde un diccionario"""
        self.user_data['permisos'] = permisos_dict

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
        return permisos_roles.get(self.user_data.get('rol'), permisos_roles['vendedor'])

    def get_permisos_efectivos(self):
        """Obtiene los permisos efectivos (rol + permisos personalizados)"""
        permisos_rol = self.get_permisos_por_rol()
        permisos_custom = self.get_permisos()
        
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
            'id': str(self.user_data.get('_id')),
            'username': self.user_data.get('username'),
            'email': self.user_data.get('email'),
            'rol': self.user_data.get('rol'),
            'permisos': self.get_permisos(),
            'permisos_efectivos': self.get_permisos_efectivos()
        }
