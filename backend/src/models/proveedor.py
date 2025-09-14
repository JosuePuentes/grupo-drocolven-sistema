from datetime import datetime

class Proveedor:
    def to_dict(self, proveedor_data):
        return {
            'id': str(proveedor_data['_id']),
            'nombre': proveedor_data.get('nombre'),
            'contacto': proveedor_data.get('contacto'),
            'telefono': proveedor_data.get('telefono'),
            'email': proveedor_data.get('email'),
            'direccion': proveedor_data.get('direccion'),
            'dias_credito': proveedor_data.get('dias_credito'),
            'descuento_comercial': proveedor_data.get('descuento_comercial'),
            'descuento_pronto_pago': proveedor_data.get('descuento_pronto_pago'),
            'fecha_creacion': proveedor_data.get('fecha_creacion').isoformat() if proveedor_data.get('fecha_creacion') else None,
            'activo': proveedor_data.get('activo')
        }

class ListaPrecioProveedor:
    def to_dict(self, lista_precio_data, proveedor_nombre=None):
        return {
            'id': str(lista_precio_data['_id']),
            'proveedor_id': str(lista_precio_data.get('proveedor_id')),
            'codigo_producto': lista_precio_data.get('codigo_producto'),
            'descripcion': lista_precio_data.get('descripcion'),
            'precio': lista_precio_data.get('precio'),
            'proveedor': proveedor_nombre
        }

