from src.models.user import db
from datetime import datetime

class Inventario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmacia_id = db.Column(db.Integer, db.ForeignKey('farmacia.id'), nullable=False)
    codigo = db.Column(db.String(50), nullable=False)
    descripcion = db.Column(db.String(200), nullable=False)
    laboratorio = db.Column(db.String(100), nullable=False)
    nacional = db.Column(db.String(10), nullable=True)  # Si/No
    departamento = db.Column(db.String(100), nullable=True)
    fecha_vencimiento = db.Column(db.Date, nullable=True)
    precio = db.Column(db.Float, nullable=False)
    descuento = db.Column(db.Float, nullable=True)
    precio_neto = db.Column(db.Float, nullable=False)
    pedido = db.Column(db.Integer, default=0)  # Cantidad disponible/stock
    total = db.Column(db.Float, nullable=True)  # Total calculado
    
    farmacia = db.relationship('Farmacia', backref=db.backref('inventarios', lazy=True))
    
    def __repr__(self):
        return f'<Inventario {self.codigo} - {self.descripcion}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'farmacia_id': self.farmacia_id,
            'codigo': self.codigo,
            'descripcion': self.descripcion,
            'laboratorio': self.laboratorio,
            'nacional': self.nacional,
            'departamento': self.departamento,
            'fecha_vencimiento': self.fecha_vencimiento.isoformat() if self.fecha_vencimiento else None,
            'precio': self.precio,
            'descuento': self.descuento,
            'precio_neto': self.precio_neto,
            'pedido': self.pedido,  # Cantidad disponible
            'total': self.total,
            'farmacia': self.farmacia.nombre if self.farmacia else None
        }

