from src.models.user import db
from datetime import datetime

class Venta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)
    farmacia_id = db.Column(db.Integer, db.ForeignKey('farmacia.id'), nullable=False)
    total = db.Column(db.Float, nullable=False)
    metodo_pago = db.Column(db.String(50), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    cliente = db.relationship('Cliente', backref=db.backref('ventas', lazy=True))
    farmacia = db.relationship('Farmacia', backref=db.backref('ventas', lazy=True))
    
    def __repr__(self):
        return f'<Venta {self.id} - Total: {self.total}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'farmacia_id': self.farmacia_id,
            'total': self.total,
            'metodo_pago': self.metodo_pago,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'cliente': self.cliente.nombre if self.cliente else None,
            'farmacia': self.farmacia.nombre if self.farmacia else None
        }

class VentaDetalle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('venta.id'), nullable=False)
    inventario_id = db.Column(db.Integer, db.ForeignKey('inventario.id'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio = db.Column(db.Float, nullable=False)
    
    venta = db.relationship('Venta', backref=db.backref('detalles', lazy=True))
    inventario = db.relationship('Inventario', backref=db.backref('ventas_detalle', lazy=True))
    
    def __repr__(self):
        return f'<VentaDetalle {self.id} - Cantidad: {self.cantidad}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'venta_id': self.venta_id,
            'inventario_id': self.inventario_id,
            'cantidad': self.cantidad,
            'precio': self.precio,
            'producto': self.inventario.descripcion if self.inventario else None
        }

