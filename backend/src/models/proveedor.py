from src.models.user import db
from datetime import datetime

class Proveedor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    contacto = db.Column(db.String(100), nullable=True)  # Nombre del contacto
    telefono = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    direccion = db.Column(db.String(200), nullable=True)
    
    # Campos financieros específicos
    dias_credito = db.Column(db.Integer, default=0)  # Días de crédito
    descuento_comercial = db.Column(db.Float, default=0.0)  # Descuento comercial (%)
    descuento_pronto_pago = db.Column(db.Float, default=0.0)  # Descuento por pronto pago (%)
    
    # Campos de auditoría
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<Proveedor {self.nombre}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'contacto': self.contacto,
            'telefono': self.telefono,
            'email': self.email,
            'direccion': self.direccion,
            'dias_credito': self.dias_credito,
            'descuento_comercial': self.descuento_comercial,
            'descuento_pronto_pago': self.descuento_pronto_pago,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'activo': self.activo
        }

class ListaPrecioProveedor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    proveedor_id = db.Column(db.Integer, db.ForeignKey('proveedor.id'), nullable=False)
    codigo_producto = db.Column(db.String(50), nullable=False)
    descripcion = db.Column(db.String(200), nullable=False)
    precio = db.Column(db.Float, nullable=False)
    
    proveedor = db.relationship('Proveedor', backref=db.backref('lista_precios', lazy=True))
    
    def __repr__(self):
        return f'<ListaPrecioProveedor {self.codigo_producto} - {self.descripcion}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'proveedor_id': self.proveedor_id,
            'codigo_producto': self.codigo_producto,
            'descripcion': self.descripcion,
            'precio': self.precio,
            'proveedor': self.proveedor.nombre if self.proveedor else None
        }

