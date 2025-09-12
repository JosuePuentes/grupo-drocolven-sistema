from flask import Blueprint, request, jsonify
import openpyxl
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from src.models.user import db
from src.models.inventario import Inventario
from src.models.farmacia import Farmacia

inventario_bp = Blueprint('inventario', __name__)

UPLOAD_FOLDER = '/tmp/uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_descuento(descuento_str):
    """Parsea el descuento que puede venir en diferentes formatos"""
    if not descuento_str:
        return 0.0
    
    if isinstance(descuento_str, (int, float)):
        return float(descuento_str)
    
    # Si es string, limpiar y convertir
    descuento_str = str(descuento_str).replace(',', '.').strip()
    
    # Si contiene %, extraer el número
    if '%' in descuento_str:
        descuento_str = descuento_str.replace('%', '').strip()
        return float(descuento_str) / 100
    
    try:
        return float(descuento_str)
    except:
        return 0.0

@inventario_bp.route('/inventarios', methods=['GET'])
def get_inventarios():
    try:
        farmacia_id = request.args.get('farmacia_id')
        if farmacia_id:
            inventarios = Inventario.query.filter_by(farmacia_id=farmacia_id).all()
        else:
            inventarios = Inventario.query.all()
        
        return jsonify([inventario.to_dict() for inventario in inventarios])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/inventarios/search', methods=['GET'])
def search_inventarios():
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify([])
        
        # Buscar en todas las farmacias
        inventarios = Inventario.query.filter(
            db.or_(
                Inventario.descripcion.ilike(f'%{query}%'),
                Inventario.codigo.ilike(f'%{query}%'),
                Inventario.laboratorio.ilike(f'%{query}%')
            )
        ).all()
        
        # Agrupar por código para mostrar en qué farmacias está disponible
        productos = {}
        for inv in inventarios:
            if inv.codigo not in productos:
                productos[inv.codigo] = {
                    'codigo': inv.codigo,
                    'descripcion': inv.descripcion,
                    'laboratorio': inv.laboratorio,
                    'nacional': inv.nacional,
                    'departamento': inv.departamento,
                    'fecha_vencimiento': inv.fecha_vencimiento.isoformat() if inv.fecha_vencimiento else None,
                    'farmacias': []
                }
            
            productos[inv.codigo]['farmacias'].append({
                'farmacia_id': inv.farmacia_id,
                'farmacia_nombre': inv.farmacia.nombre,
                'precio': inv.precio,
                'descuento': inv.descuento,
                'precio_neto': inv.precio_neto,
                'pedido': inv.pedido,  # Cantidad disponible
                'total': inv.total
            })
        
        return jsonify(list(productos.values()))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/inventarios', methods=['POST'])
def create_inventario():
    try:
        data = request.get_json()
        
        required_fields = ['farmacia_id', 'codigo', 'descripcion', 'laboratorio', 'precio', 'precio_neto']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} es requerido'}), 400
        
        inventario = Inventario(
            farmacia_id=data['farmacia_id'],
            codigo=data['codigo'],
            descripcion=data['descripcion'],
            laboratorio=data['laboratorio'],
            nacional=data.get('nacional'),
            departamento=data.get('departamento'),
            fecha_vencimiento=datetime.strptime(data['fecha_vencimiento'], '%Y-%m-%d').date() if data.get('fecha_vencimiento') else None,
            precio=float(data['precio']),
            descuento=float(data.get('descuento', 0)),
            precio_neto=float(data['precio_neto']),
            pedido=data.get('pedido', 0),
            total=data.get('total', 0)
        )
        
        db.session.add(inventario)
        db.session.commit()
        
        return jsonify(inventario.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/inventarios/upload', methods=['POST'])
def upload_inventario():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No se encontró archivo'}), 400
        
        file = request.files['file']
        farmacia_id = request.form.get('farmacia_id')
        
        if not farmacia_id:
            return jsonify({'error': 'farmacia_id es requerido'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó archivo'}), 400
        
        if file and allowed_file(file.filename):
            # Crear directorio si no existe
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            
            # Procesar archivo Excel
            workbook = openpyxl.load_workbook(filepath)
            sheet = workbook.active
            
            inventarios_creados = 0
            errores = []
            
            # Buscar la fila de headers (normalmente fila 2)
            header_row = None
            for row_num in range(1, 5):  # Buscar en las primeras 4 filas
                row = [cell.value for cell in sheet[row_num]]
                if any('CODIGO' in str(cell).upper() if cell else False for cell in row):
                    header_row = row_num
                    break
            
            if not header_row:
                return jsonify({'error': 'No se encontraron headers válidos en el archivo'}), 400
            
            # Procesar datos desde la fila siguiente a los headers
            for row_num, row in enumerate(sheet.iter_rows(min_row=header_row + 1, values_only=True), start=header_row + 1):
                try:
                    if not any(row):  # Saltar filas vacías
                        continue
                    
                    # Mapear columnas según la estructura del archivo
                    codigo = str(row[0]) if row[0] else None
                    descripcion = str(row[1]).strip() if row[1] else None
                    laboratorio = str(row[2]).strip() if row[2] else None
                    nacional = str(row[3]).strip() if row[3] else None
                    departamento = str(row[4]).strip() if row[4] else None
                    fecha_vencimiento = row[5] if row[5] else None
                    precio = float(row[6]) if row[6] else 0
                    descuento_raw = row[7] if row[7] else 0
                    precio_neto = float(row[10]) if row[10] and isinstance(row[10], (int, float)) else precio
                    pedido = int(row[11]) if row[11] and isinstance(row[11], (int, float)) else 0  # Columna PEDIDO
                    total = float(row[12]) if row[12] and isinstance(row[12], (int, float)) else 0  # Columna TOTAL
                    
                    if not all([codigo, descripcion, laboratorio]):
                        errores.append(f'Fila {row_num}: Datos básicos incompletos')
                        continue
                    
                    # Parsear descuento
                    descuento = parse_descuento(descuento_raw)
                    
                    # Calcular precio neto si no está disponible
                    if precio_neto == precio and descuento > 0:
                        precio_neto = precio - (precio * descuento)
                    
                    # Parsear fecha de vencimiento
                    fecha_venc_date = None
                    if fecha_vencimiento:
                        if isinstance(fecha_vencimiento, datetime):
                            fecha_venc_date = fecha_vencimiento.date()
                        else:
                            try:
                                fecha_venc_date = datetime.strptime(str(fecha_vencimiento), '%Y-%m-%d').date()
                            except:
                                pass
                    
                    # Verificar si ya existe el producto en esta farmacia
                    existing = Inventario.query.filter_by(
                        farmacia_id=farmacia_id, 
                        codigo=codigo
                    ).first()
                    
                    if existing:
                        # Actualizar existente
                        existing.descripcion = descripcion
                        existing.laboratorio = laboratorio
                        existing.nacional = nacional
                        existing.departamento = departamento
                        existing.fecha_vencimiento = fecha_venc_date
                        existing.precio = precio
                        existing.descuento = descuento
                        existing.precio_neto = precio_neto
                        existing.pedido = pedido
                        existing.total = total
                    else:
                        # Crear nuevo
                        inventario = Inventario(
                            farmacia_id=int(farmacia_id),
                            codigo=codigo,
                            descripcion=descripcion,
                            laboratorio=laboratorio,
                            nacional=nacional,
                            departamento=departamento,
                            fecha_vencimiento=fecha_venc_date,
                            precio=precio,
                            descuento=descuento,
                            precio_neto=precio_neto,
                            pedido=pedido,
                            total=total
                        )
                        db.session.add(inventario)
                    
                    inventarios_creados += 1
                    
                except Exception as e:
                    errores.append(f'Fila {row_num}: {str(e)}')
            
            db.session.commit()
            
            # Limpiar archivo temporal
            os.remove(filepath)
            
            return jsonify({
                'message': f'Inventario procesado exitosamente',
                'inventarios_procesados': inventarios_creados,
                'errores': errores
            })
        
        return jsonify({'error': 'Tipo de archivo no permitido'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/inventarios/<int:inventario_id>', methods=['PUT'])
def update_inventario(inventario_id):
    try:
        inventario = Inventario.query.get_or_404(inventario_id)
        data = request.get_json()
        
        # Actualizar campos si están presentes
        if 'codigo' in data:
            inventario.codigo = data['codigo']
        if 'descripcion' in data:
            inventario.descripcion = data['descripcion']
        if 'laboratorio' in data:
            inventario.laboratorio = data['laboratorio']
        if 'nacional' in data:
            inventario.nacional = data['nacional']
        if 'departamento' in data:
            inventario.departamento = data['departamento']
        if 'fecha_vencimiento' in data:
            inventario.fecha_vencimiento = datetime.strptime(data['fecha_vencimiento'], '%Y-%m-%d').date() if data['fecha_vencimiento'] else None
        if 'precio' in data:
            inventario.precio = float(data['precio'])
        if 'descuento' in data:
            inventario.descuento = float(data['descuento'])
        if 'precio_neto' in data:
            inventario.precio_neto = float(data['precio_neto'])
        if 'pedido' in data:
            inventario.pedido = int(data['pedido'])
        if 'total' in data:
            inventario.total = float(data['total'])
        
        db.session.commit()
        
        return jsonify(inventario.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/inventarios/<int:inventario_id>', methods=['DELETE'])
def delete_inventario(inventario_id):
    try:
        inventario = Inventario.query.get_or_404(inventario_id)
        db.session.delete(inventario)
        db.session.commit()
        
        return jsonify({'message': 'Inventario eliminado exitosamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

