from flask import Blueprint, request, jsonify
from src.models.proveedor import Proveedor
from src.models.lista_proveedor import ListaProveedor
from src.models.user import db
from sqlalchemy import or_, func
from datetime import datetime
import openpyxl
import os
from werkzeug.utils import secure_filename

lista_comparativa_bp = Blueprint('lista_comparativa', __name__)

@lista_comparativa_bp.route('/lista-comparativa/buscar', methods=['GET'])
def buscar_en_proveedores():
    """Buscar medicamentos en todas las listas de proveedores con descuentos aplicados"""
    try:
        query = request.args.get('q', '').strip()
        proveedor_id = request.args.get('proveedor_id')
        
        if not query:
            return jsonify([])
        
        # Construir la consulta base incluyendo datos del proveedor
        consulta = db.session.query(
            ListaProveedor,
            Proveedor.descuento_comercial,
            Proveedor.descuento_pronto_pago,
            Proveedor.dias_credito
        ).join(Proveedor)
        
        # Filtrar por término de búsqueda
        consulta = consulta.filter(
            or_(
                ListaProveedor.codigo.ilike(f'%{query}%'),
                ListaProveedor.descripcion.ilike(f'%{query}%'),
                ListaProveedor.laboratorio.ilike(f'%{query}%')
            )
        )
        
        # Filtrar por proveedor específico si se proporciona
        if proveedor_id:
            consulta = consulta.filter(ListaProveedor.proveedor_id == proveedor_id)
        
        # Obtener resultados
        resultados = consulta.filter(ListaProveedor.disponible == True).all()
        
        # Agrupar por código/descripción para comparar precios
        productos_agrupados = {}
        for resultado in resultados:
            producto, desc_comercial, desc_pronto_pago, dias_credito = resultado
            
            key = f"{producto.codigo}_{producto.descripcion.lower()}"
            if key not in productos_agrupados:
                productos_agrupados[key] = {
                    'codigo': producto.codigo,
                    'descripcion': producto.descripcion,
                    'laboratorio': producto.laboratorio,
                    'proveedores': []
                }
            
            # Calcular precio final con descuento comercial
            precio_original = producto.precio_descuento if producto.precio_descuento else producto.precio
            descuento_aplicado = (precio_original * desc_comercial / 100) if desc_comercial else 0
            precio_final_comercial = precio_original - descuento_aplicado
            
            # Calcular precio con descuento por pronto pago adicional
            descuento_pronto_pago_aplicado = (precio_final_comercial * desc_pronto_pago / 100) if desc_pronto_pago else 0
            precio_final_pronto_pago = precio_final_comercial - descuento_pronto_pago_aplicado
            
            productos_agrupados[key]['proveedores'].append({
                'proveedor_id': producto.proveedor_id,
                'proveedor_nombre': producto.proveedor.nombre,
                'precio_original': precio_original,
                'descuento_comercial': desc_comercial or 0,
                'descuento_pronto_pago': desc_pronto_pago or 0,
                'precio_con_descuento_comercial': precio_final_comercial,
                'precio_con_descuento_total': precio_final_pronto_pago,
                'ahorro_comercial': descuento_aplicado,
                'ahorro_pronto_pago': descuento_pronto_pago_aplicado,
                'ahorro_total': descuento_aplicado + descuento_pronto_pago_aplicado,
                'dias_credito': dias_credito or 0,
                'fecha_actualizacion': producto.fecha_actualizacion.isoformat() if producto.fecha_actualizacion else None
            })
        
        # Ordenar proveedores por mejor precio final y marcar el mejor
        for producto in productos_agrupados.values():
            # Ordenar por precio con descuento comercial (precio real de compra)
            producto['proveedores'].sort(key=lambda x: x['precio_con_descuento_comercial'])
            
            if producto['proveedores']:
                # Marcar el mejor precio
                producto['proveedores'][0]['es_mejor_precio'] = True
                producto['mejor_precio'] = producto['proveedores'][0]['precio_con_descuento_comercial']
                producto['mejor_proveedor'] = producto['proveedores'][0]['proveedor_nombre']
                producto['ahorro_mejor_opcion'] = producto['proveedores'][0]['ahorro_total']
                
                # Calcular diferencia con otras opciones
                for i, proveedor in enumerate(producto['proveedores'][1:], 1):
                    diferencia = proveedor['precio_con_descuento_comercial'] - producto['mejor_precio']
                    proveedor['diferencia_con_mejor'] = diferencia
                    proveedor['porcentaje_diferencia'] = (diferencia / producto['mejor_precio']) * 100 if producto['mejor_precio'] > 0 else 0
        
        # Convertir a lista y ordenar por mejor precio
        resultado_final = list(productos_agrupados.values())
        resultado_final.sort(key=lambda x: x['mejor_precio'] if 'mejor_precio' in x else float('inf'))
        
        return jsonify(resultado_final)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lista_comparativa_bp.route('/lista-comparativa/proveedores', methods=['GET'])
def get_proveedores_con_listas():
    """Obtener proveedores que tienen listas de precios"""
    try:
        proveedores = db.session.query(Proveedor).join(ListaProveedor).distinct().all()
        return jsonify([{
            'id': p.id,
            'nombre': p.nombre,
            'contacto': p.contacto,
            'total_productos': len(p.productos)
        } for p in proveedores])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lista_comparativa_bp.route('/lista-comparativa/estadisticas', methods=['GET'])
def get_estadisticas():
    """Obtener estadísticas generales de las listas de proveedores"""
    try:
        total_productos = db.session.query(ListaProveedor).count()
        total_proveedores = db.session.query(Proveedor).join(ListaProveedor).distinct().count()
        
        # Productos únicos (por código)
        productos_unicos = db.session.query(ListaProveedor.codigo).distinct().count()
        
        # Proveedor con más productos
        proveedor_top = db.session.query(
            Proveedor.nombre,
            func.count(ListaProveedor.id).label('total')
        ).join(ListaProveedor).group_by(Proveedor.id, Proveedor.nombre).order_by(func.count(ListaProveedor.id).desc()).first()
        
        return jsonify({
            'total_productos': total_productos,
            'total_proveedores': total_proveedores,
            'productos_unicos': productos_unicos,
            'proveedor_top': {
                'nombre': proveedor_top[0] if proveedor_top else None,
                'total_productos': proveedor_top[1] if proveedor_top else 0
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@lista_comparativa_bp.route('/lista-comparativa/upload/<int:proveedor_id>', methods=['POST'])
def upload_lista_proveedor(proveedor_id):
    """Subir lista de precios de un proveedor desde Excel"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No se encontró archivo'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó archivo'}), 400
        
        # Verificar que el proveedor existe
        proveedor = Proveedor.query.get(proveedor_id)
        if not proveedor:
            return jsonify({'error': 'Proveedor no encontrado'}), 404
        
        # Guardar archivo temporalmente
        filename = secure_filename(file.filename)
        temp_path = os.path.join('/tmp', filename)
        file.save(temp_path)
        
        # Procesar archivo Excel
        wb = openpyxl.load_workbook(temp_path)
        ws = wb.active
        
        productos_procesados = 0
        productos_actualizados = 0
        errores = []
        
        # Leer headers (asumiendo que están en la fila 1 o 2)
        headers = []
        for row in ws.iter_rows(min_row=1, max_row=2, values_only=True):
            if any(cell for cell in row if cell and str(cell).strip()):
                headers = [str(cell).strip().upper() if cell else '' for cell in row]
                break
        
        # Mapear columnas
        col_mapping = {}
        for i, header in enumerate(headers):
            if 'CODIGO' in header or 'COD' in header:
                col_mapping['codigo'] = i
            elif 'DESCRIPCION' in header or 'PRODUCTO' in header or 'NOMBRE' in header:
                col_mapping['descripcion'] = i
            elif 'LABORATORIO' in header or 'LAB' in header:
                col_mapping['laboratorio'] = i
            elif 'PRECIO' in header and 'DESCUENTO' not in header:
                col_mapping['precio'] = i
            elif 'DESCUENTO' in header or 'PRECIO_DESCUENTO' in header:
                col_mapping['precio_descuento'] = i
        
        # Procesar datos
        for row_num, row in enumerate(ws.iter_rows(min_row=3, values_only=True), start=3):
            try:
                if not any(cell for cell in row if cell):
                    continue
                
                # Extraer datos
                codigo = str(row[col_mapping.get('codigo', 0)] or '').strip()
                descripcion = str(row[col_mapping.get('descripcion', 1)] or '').strip()
                laboratorio = str(row[col_mapping.get('laboratorio', 2)] or '').strip()
                
                if not codigo or not descripcion:
                    continue
                
                try:
                    precio = float(row[col_mapping.get('precio', 3)] or 0)
                    precio_descuento = None
                    if 'precio_descuento' in col_mapping and row[col_mapping['precio_descuento']]:
                        precio_descuento = float(row[col_mapping['precio_descuento']])
                except (ValueError, TypeError):
                    errores.append(f"Fila {row_num}: Error en formato de precio")
                    continue
                
                # Buscar producto existente
                producto_existente = ListaProveedor.query.filter_by(
                    proveedor_id=proveedor_id,
                    codigo=codigo
                ).first()
                
                if producto_existente:
                    # Actualizar producto existente
                    producto_existente.descripcion = descripcion
                    producto_existente.laboratorio = laboratorio
                    producto_existente.precio = precio
                    producto_existente.precio_descuento = precio_descuento
                    producto_existente.fecha_actualizacion = datetime.utcnow()
                    productos_actualizados += 1
                else:
                    # Crear nuevo producto
                    nuevo_producto = ListaProveedor(
                        proveedor_id=proveedor_id,
                        codigo=codigo,
                        descripcion=descripcion,
                        laboratorio=laboratorio,
                        precio=precio,
                        precio_descuento=precio_descuento
                    )
                    db.session.add(nuevo_producto)
                    productos_procesados += 1
                
            except Exception as e:
                errores.append(f"Fila {row_num}: {str(e)}")
                continue
        
        db.session.commit()
        
        # Limpiar archivo temporal
        os.remove(temp_path)
        
        return jsonify({
            'message': 'Lista de precios procesada exitosamente',
            'productos_nuevos': productos_procesados,
            'productos_actualizados': productos_actualizados,
            'errores': errores[:10]  # Limitar errores mostrados
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

