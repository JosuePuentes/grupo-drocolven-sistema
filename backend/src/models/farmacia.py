class Farmacia:
    def to_dict(self, farmacia_data):
        return {
            'id': str(farmacia_data['_id']),
            'nombre': farmacia_data['nombre'],
            'direccion': farmacia_data.get('direccion'),
            'telefono': farmacia_data.get('telefono'),
            'email': farmacia_data.get('email'),
            'descuento_diario_porcentaje': farmacia_data.get('descuento_diario_porcentaje'),
            'descuento_diario_fecha': farmacia_data.get('descuento_diario_fecha')
        }

