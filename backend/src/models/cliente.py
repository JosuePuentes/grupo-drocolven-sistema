class Cliente:
    def to_dict(self, cliente_data):
        return {
            'id': str(cliente_data['_id']),
            'nombre': cliente_data.get('nombre'),
            'telefono': cliente_data.get('telefono'),
            'email': cliente_data.get('email')
        }

