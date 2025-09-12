from flask import Blueprint, request, jsonify
from src.models.inventario import Inventario
from src.models.farmacia import Farmacia
from src.models.user import db
from sqlalchemy import func, and_, or_

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/reportes/productos-falla', methods=['GET'])
def get_productos_falla():
    try:
        farmacia_id = request.args.get('farmacia_id')
        limite_stock = int(request.args.get('limite_stock', 5))
        
        # Query base para productos en falla
        query = db.session.query(
            Inventario.codigo,
            Inventario.descripcion,
            Inventario.laboratorio,
            Inventario.precio,
            Inventario.precio_neto,
            Inventario.pedido,
            Farmacia.id.label('farmacia_id'),
            Farmacia.nombre.label('farmacia_nombre')
        ).join(Farmacia, Inventario.farmacia_id == Farmacia.id)
        
        # Filtrar por productos con stock bajo o sin stock
        query = query.filter(
            or_(
                Inventario.pedido == 0,  # Sin stock
                Inventario.pedido <= limite_stock  # Stock bajo
            )
        )
        
        # Filtrar por farmacia específica si se proporciona
        if farmacia_id:
            query = query.filter(Inventario.farmacia_id == farmacia_id)
        
        productos_falla = query.all()
        
        # Agrupar productos por código para consolidar información
        productos_consolidados = {}
        
        for producto in productos_falla:
            codigo = producto.codigo
            
            if codigo not in productos_consolidados:
                productos_consolidados[codigo] = {
                    'codigo': producto.codigo,
                    'descripcion': producto.descripcion,
                    'laboratorio': producto.laboratorio,
                    'precio_referencia': float(producto.precio_neto or producto.precio or 0),
                    'farmacias_afectadas': [],
                    'stock_total': 0,
                    'farmacias_sin_stock': 0,
                    'cantidad_total_sugerida': 0,
                    'valor_total_estimado': 0
                }
            
            # Calcular sugerencia de compra por farmacia
            stock_actual = producto.pedido or 0
            stock_minimo = max(15, limite_stock * 3)  # Stock mínimo sugerido
            sugerencia_farmacia = max(0, stock_minimo - stock_actual)
            
            # Agregar información de la farmacia
            productos_consolidados[codigo]['farmacias_afectadas'].append({
                'farmacia_id': producto.farmacia_id,
                'farmacia_nombre': producto.farmacia_nombre,
                'stock_actual': stock_actual,
                'sugerencia_compra': sugerencia_farmacia,
                'valor_estimado': sugerencia_farmacia * productos_consolidados[codigo]['precio_referencia']
            })
            
            # Actualizar totales
            productos_consolidados[codigo]['stock_total'] += stock_actual
            if stock_actual == 0:
                productos_consolidados[codigo]['farmacias_sin_stock'] += 1
            productos_consolidados[codigo]['cantidad_total_sugerida'] += sugerencia_farmacia
            productos_consolidados[codigo]['valor_total_estimado'] += sugerencia_farmacia * productos_consolidados[codigo]['precio_referencia']
        
        # Calcular prioridad y ordenar
        resultado = []
        for codigo, producto in productos_consolidados.items():
            # Determinar prioridad basada en farmacias sin stock
            porcentaje_sin_stock = producto['farmacias_sin_stock'] / len(producto['farmacias_afectadas'])
            if porcentaje_sin_stock >= 0.7:
                prioridad = 'Alta'
            elif porcentaje_sin_stock >= 0.3:
                prioridad = 'Media'
            else:
                prioridad = 'Baja'
            
            producto['prioridad'] = prioridad
            producto['total_farmacias_afectadas'] = len(producto['farmacias_afectadas'])
            
            # Ordenar farmacias por sugerencia de compra (mayor a menor)
            producto['farmacias_afectadas'].sort(key=lambda x: x['sugerencia_compra'], reverse=True)
            
            resultado.append(producto)
        
        # Ordenar por prioridad y cantidad sugerida
        prioridad_orden = {'Alta': 3, 'Media': 2, 'Baja': 1}
        resultado.sort(key=lambda x: (prioridad_orden[x['prioridad']], x['cantidad_total_sugerida']), reverse=True)
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reportes_bp.route('/reportes/estadisticas-fallas', methods=['GET'])
def get_estadisticas_fallas():
    try:
        limite_stock = int(request.args.get('limite_stock', 5))
        
        # Productos sin stock
        productos_sin_stock = db.session.query(func.count(Inventario.id)).filter(
            Inventario.pedido == 0
        ).scalar()
        
        # Productos con stock bajo
        productos_stock_bajo = db.session.query(func.count(Inventario.id)).filter(
            and_(Inventario.pedido > 0, Inventario.pedido <= limite_stock)
        ).scalar()
        
        # Total productos en falla
        total_productos_falla = productos_sin_stock + productos_stock_bajo
        
        # Farmacias más afectadas
        farmacias_afectadas = db.session.query(
            Farmacia.nombre,
            func.count(Inventario.id).label('productos_falla')
        ).join(Inventario, Farmacia.id == Inventario.farmacia_id).filter(
            Inventario.pedido <= limite_stock
        ).group_by(Farmacia.id, Farmacia.nombre).order_by(
            func.count(Inventario.id).desc()
        ).limit(5).all()
        
        return jsonify({
            'total_productos_falla': total_productos_falla,
            'productos_sin_stock': productos_sin_stock,
            'productos_stock_bajo': productos_stock_bajo,
            'farmacias_mas_afectadas': [
                {'nombre': f.nombre, 'productos_falla': f.productos_falla}
                for f in farmacias_afectadas
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reportes_bp.route('/reportes/sugerencias-compra', methods=['GET'])
def get_sugerencias_compra():
    try:
        # Obtener productos en falla y calcular sugerencias
        productos_falla = db.session.query(
            Inventario.codigo,
            Inventario.descripcion,
            Inventario.pedido,
            Inventario.precio,
            Inventario.precio_neto,
            Farmacia.nombre.label('farmacia_nombre')
        ).join(Farmacia, Inventario.farmacia_id == Farmacia.id).filter(
            Inventario.pedido <= 5
        ).all()
        
        # Consolidar sugerencias por producto
        sugerencias_consolidadas = {}
        total_unidades = 0
        total_valor = 0
        
        for producto in productos_falla:
            codigo = producto.codigo
            stock_actual = producto.pedido or 0
            stock_minimo = 15
            sugerencia = max(0, stock_minimo - stock_actual)
            precio = float(producto.precio_neto or producto.precio or 0)
            
            if codigo not in sugerencias_consolidadas:
                sugerencias_consolidadas[codigo] = {
                    'descripcion': producto.descripcion,
                    'cantidad_total': 0,
                    'valor_total': 0,
                    'farmacias': []
                }
            
            if sugerencia > 0:
                sugerencias_consolidadas[codigo]['cantidad_total'] += sugerencia
                sugerencias_consolidadas[codigo]['valor_total'] += sugerencia * precio
                sugerencias_consolidadas[codigo]['farmacias'].append({
                    'farmacia': producto.farmacia_nombre,
                    'cantidad': sugerencia,
                    'valor': sugerencia * precio
                })
                
                total_unidades += sugerencia
                total_valor += sugerencia * precio
        
        # Calcular resumen por prioridad
        productos_alta = sum(1 for p in sugerencias_consolidadas.values() if len(p['farmacias']) >= 4)
        productos_media = sum(1 for p in sugerencias_consolidadas.values() if 2 <= len(p['farmacias']) < 4)
        productos_baja = len(sugerencias_consolidadas) - productos_alta - productos_media
        
        return jsonify({
            'sugerencias_por_producto': sugerencias_consolidadas,
            'resumen': {
                'total_unidades_sugeridas': total_unidades,
                'valor_total_estimado': total_valor,
                'productos_alta_prioridad': productos_alta,
                'productos_media_prioridad': productos_media,
                'productos_baja_prioridad': productos_baja,
                'total_productos_diferentes': len(sugerencias_consolidadas)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reportes_bp.route('/reportes/resumen-por-farmacia', methods=['GET'])
def get_resumen_por_farmacia():
    try:
        limite_stock = int(request.args.get('limite_stock', 5))
        
        # Obtener resumen por farmacia
        resumen_farmacias = db.session.query(
            Farmacia.id,
            Farmacia.nombre,
            func.count(Inventario.id).label('total_productos_falla'),
            func.sum(func.case([(Inventario.pedido == 0, 1)], else_=0)).label('productos_sin_stock'),
            func.sum(func.case([(and_(Inventario.pedido > 0, Inventario.pedido <= limite_stock), 1)], else_=0)).label('productos_stock_bajo')
        ).join(Inventario, Farmacia.id == Inventario.farmacia_id).filter(
            Inventario.pedido <= limite_stock
        ).group_by(Farmacia.id, Farmacia.nombre).all()
        
        resultado = []
        for farmacia in resumen_farmacias:
            resultado.append({
                'farmacia_id': farmacia.id,
                'farmacia_nombre': farmacia.nombre,
                'total_productos_falla': farmacia.total_productos_falla or 0,
                'productos_sin_stock': farmacia.productos_sin_stock or 0,
                'productos_stock_bajo': farmacia.productos_stock_bajo or 0
            })
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reportes_bp.route('/reportes/consolidado-compras', methods=['GET'])
def get_consolidado_compras():
    """Obtener reporte consolidado de compras con totales por producto y detalle por farmacia"""
    try:
        limite_stock = int(request.args.get('limite_stock', 5))
        
        # Obtener todos los productos en falla con información de farmacia
        productos_falla = db.session.query(
            Inventario.codigo,
            Inventario.descripcion,
            Inventario.laboratorio,
            Inventario.pedido,
            Inventario.precio_neto,
            Inventario.precio,
            Farmacia.id.label('farmacia_id'),
            Farmacia.nombre.label('farmacia_nombre')
        ).join(Farmacia, Inventario.farmacia_id == Farmacia.id).filter(
            Inventario.pedido <= limite_stock
        ).all()
        
        # Consolidar por producto
        consolidado = {}
        
        for item in productos_falla:
            codigo = item.codigo
            stock_actual = item.pedido or 0
            stock_minimo = 15  # Stock mínimo deseado
            sugerencia_farmacia = max(0, stock_minimo - stock_actual)
            precio = float(item.precio_neto or item.precio or 0)
            
            if codigo not in consolidado:
                consolidado[codigo] = {
                    'codigo': codigo,
                    'descripcion': item.descripcion,
                    'laboratorio': item.laboratorio,
                    'precio_unitario': precio,
                    'total_necesario': 0,
                    'valor_total': 0,
                    'detalle_farmacias': []
                }
            
            if sugerencia_farmacia > 0:
                consolidado[codigo]['total_necesario'] += sugerencia_farmacia
                consolidado[codigo]['valor_total'] += sugerencia_farmacia * precio
                consolidado[codigo]['detalle_farmacias'].append({
                    'farmacia_id': item.farmacia_id,
                    'farmacia_nombre': item.farmacia_nombre,
                    'stock_actual': stock_actual,
                    'cantidad_necesaria': sugerencia_farmacia,
                    'valor_farmacia': sugerencia_farmacia * precio
                })
        
        # Convertir a lista y ordenar por valor total (mayor a menor)
        resultado = list(consolidado.values())
        resultado.sort(key=lambda x: x['valor_total'], reverse=True)
        
        # Calcular totales generales
        total_productos = len(resultado)
        total_unidades = sum(p['total_necesario'] for p in resultado)
        total_valor = sum(p['valor_total'] for p in resultado)
        
        return jsonify({
            'productos': resultado,
            'resumen_general': {
                'total_productos_diferentes': total_productos,
                'total_unidades_necesarias': total_unidades,
                'valor_total_estimado': total_valor
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

