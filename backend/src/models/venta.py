from datetime import datetime

class Venta:
    def to_dict(self, venta_data, cliente_nombre=None, farmacia_nombre=None):
        return {
            'id': str(venta_data['_id']),
            'cliente_id': str(venta_data.get('cliente_id')),
            'farmacia_id': str(venta_data.get('farmacia_id')),
            'total': venta_data.get('total'),
            'metodo_pago': venta_data.get('metodo_pago'),
            'fecha': venta_data.get('fecha').isoformat() if venta_data.get('fecha') else None,
            'cliente': cliente_nombre,
            'farmacia': farmacia_nombre
        }

class VentaDetalle:
    def to_dict(self, detalle_data, producto_descripcion=None):
        return {
            'id': str(detalle_data['_id']),
            'venta_id': str(detalle_data.get('venta_id')),
            'inventario_id': str(detalle_data.get('inventario_id')),
            'cantidad': detalle_data.get('cantidad'),
            'precio': detalle_data.get('precio'),
            'producto': producto_descripcion
        }

