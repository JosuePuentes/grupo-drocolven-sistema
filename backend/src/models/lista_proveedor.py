from src.models.user import db
from datetime import datetime

class ListaProveedor(db.Model):
    __tablename__ = 'lista_proveedor'
    
    id = db.Column(db.Integer, primary_key=True)
    proveedor_id = db.Column(db.Integer, db.ForeignKey('proveedor.id'), nullable=False)
    codigo = db.Column(db.String(50), nullable=False)
    descripcion = db.Column(db.String(500), nullable=False)
    laboratorio = db.Column(db.String(200))
    precio = db.Column(db.Float, nullable=False)
    precio_descuento = db.Column(db.Float)
    disponible = db.Column(db.Boolean, default=True)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación con proveedor
    proveedor = db.relationship('Proveedor', backref=db.backref('productos', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'proveedor_id': self.proveedor_id,
            'proveedor_nombre': self.proveedor.nombre if self.proveedor else None,
            'codigo': self.codigo,
            'descripcion': self.descripcion,
            'laboratorio': self.laboratorio,
            'precio': self.precio,
            'precio_descuento': self.precio_descuento,
            'precio_final': self.precio_descuento if self.precio_descuento else self.precio,
            'disponible': self.disponible,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }
    
    def __repr__(self):
        return f'<ListaProveedor {self.codigo} - {self.descripcion}>'

