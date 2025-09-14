from datetime import datetime

class Inventario:
    def to_dict(self, inventario_data, farmacia_nombre=None):
        return {
            'id': str(inventario_data['_id']),
            'farmacia_id': str(inventario_data['farmacia_id']),
            'codigo': inventario_data.get('codigo'),
            'descripcion': inventario_data.get('descripcion'),
            'laboratorio': inventario_data.get('laboratorio'),
            'nacional': inventario_data.get('nacional'),
            'departamento': inventario_data.get('departamento'),
            'fecha_vencimiento': inventario_data.get('fecha_vencimiento').isoformat() if inventario_data.get('fecha_vencimiento') else None,
            'precio': inventario_data.get('precio'),
            'descuento': inventario_data.get('descuento'),
            'precio_neto': inventario_data.get('precio_neto'),
            'pedido': inventario_data.get('pedido', 0),
            'total': inventario_data.get('total'),
            'farmacia': farmacia_nombre
        }

