from datetime import datetime

class ListaProveedor:
    def to_dict(self, lista_data, proveedor_nombre=None):
        return {
            'id': str(lista_data['_id']),
            'proveedor_id': str(lista_data.get('proveedor_id')),
            'proveedor_nombre': proveedor_nombre,
            'codigo': lista_data.get('codigo'),
            'descripcion': lista_data.get('descripcion'),
            'laboratorio': lista_data.get('laboratorio'),
            'precio': lista_data.get('precio'),
            'precio_descuento': lista_data.get('precio_descuento'),
            'precio_final': lista_data.get('precio_descuento') if lista_data.get('precio_descuento') else lista_data.get('precio'),
            'disponible': lista_data.get('disponible', True),
            'fecha_actualizacion': lista_data.get('fecha_actualizacion').isoformat() if lista_data.get('fecha_actualizacion') else None
        }

