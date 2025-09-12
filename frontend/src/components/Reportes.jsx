import React, { useState, useEffect } from 'react'
import { AlertTriangle, Package, TrendingDown, ShoppingCart, Filter, Download, Building2, Calculator } from 'lucide-react'

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background'
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  }
  
  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8'
  }
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

const Reportes = () => {
  const [productosFalla, setProductosFalla] = useState([])
  const [consolidadoCompras, setConsolidadoCompras] = useState(null)
  const [estadisticas, setEstadisticas] = useState({})
  const [sugerencias, setSugerencias] = useState({})
  const [farmacias, setFarmacias] = useState([])
  const [filtros, setFiltros] = useState({
    farmacia_id: '',
    limite_stock: 5,
    prioridad: ''
  })
  const [loading, setLoading] = useState(false)
  const [vistaActual, setVistaActual] = useState('consolidado') // 'consolidado' o 'detallado'

  useEffect(() => {
    fetchFarmacias()
    fetchProductosFalla()
    fetchEstadisticas()
    fetchSugerencias()
    fetchConsolidadoCompras()
  }, [])

  const fetchFarmacias = async () => {
    try {
      const response = await fetch('/api/farmacias')
      const data = await response.json()
      setFarmacias(data)
    } catch (error) {
      console.error('Error cargando farmacias:', error)
    }
  }

  const fetchProductosFalla = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtros.farmacia_id) params.append('farmacia_id', filtros.farmacia_id)
      if (filtros.limite_stock) params.append('limite_stock', filtros.limite_stock)
      
      const response = await fetch(`/api/reportes/productos-falla?${params}`)
      const data = await response.json()
      
      let productos = data
      if (filtros.prioridad) {
        productos = productos.filter(p => p.prioridad === filtros.prioridad)
      }
      
      setProductosFalla(productos)
    } catch (error) {
      console.error('Error cargando productos en falla:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const params = new URLSearchParams()
      if (filtros.limite_stock) params.append('limite_stock', filtros.limite_stock)
      
      const response = await fetch(`/api/reportes/estadisticas-fallas?${params}`)
      const data = await response.json()
      setEstadisticas(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const fetchSugerencias = async () => {
    try {
      const response = await fetch('/api/reportes/sugerencias-compra')
      const data = await response.json()
      setSugerencias(data)
    } catch (error) {
      console.error('Error cargando sugerencias:', error)
    }
  }

  const fetchConsolidadoCompras = async () => {
    try {
      const params = new URLSearchParams()
      if (filtros.limite_stock) params.append('limite_stock', filtros.limite_stock)
      
      const response = await fetch(`/api/reportes/consolidado-compras?${params}`)
      const data = await response.json()
      setConsolidadoCompras(data)
    } catch (error) {
      console.error('Error cargando consolidado de compras:', error)
    }
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  const aplicarFiltros = () => {
    fetchProductosFalla()
    fetchEstadisticas()
    fetchSugerencias()
    fetchConsolidadoCompras()
  }

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'Alta': return 'bg-red-100 text-red-800'
      case 'Media': return 'bg-yellow-100 text-yellow-800'
      case 'Baja': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(amount)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes de Productos en Falla</h1>
        <p className="text-gray-600">Análisis de productos con stock bajo o agotado y sugerencias de compra consolidadas</p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-600">Productos en Falla</p>
              <p className="text-2xl font-bold text-red-900">{estadisticas.total_productos_falla || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-orange-600">Sin Stock</p>
              <p className="text-2xl font-bold text-orange-900">{estadisticas.productos_sin_stock || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-900">{estadisticas.productos_stock_bajo || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Unidades Sugeridas</p>
              <p className="text-2xl font-bold text-blue-900">
                {consolidadoCompras?.resumen_general?.total_unidades_necesarias || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtros.farmacia_id}
            onChange={(e) => handleFiltroChange('farmacia_id', e.target.value)}
          >
            <option value="">Todas las farmacias</option>
            {farmacias.map(farmacia => (
              <option key={farmacia.id} value={farmacia.id}>{farmacia.nombre}</option>
            ))}
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filtros.limite_stock}
            onChange={(e) => handleFiltroChange('limite_stock', e.target.value)}
          >
            <option value="0">Solo sin stock</option>
            <option value="5">Stock ≤ 5</option>
            <option value="10">Stock ≤ 10</option>
            <option value="20">Stock ≤ 20</option>
          </select>
          
          <Button onClick={aplicarFiltros} size="sm">
            Aplicar Filtros
          </Button>
          
          <div className="ml-auto flex gap-2">
            <Button
              variant={vistaActual === 'consolidado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVistaActual('consolidado')}
            >
              <Calculator className="h-4 w-4 mr-1" />
              Vista Consolidada
            </Button>
            <Button
              variant={vistaActual === 'detallado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVistaActual('detallado')}
            >
              <Building2 className="h-4 w-4 mr-1" />
              Vista Detallada
            </Button>
          </div>
        </div>
      </div>

      {/* Vista Consolidada - Reporte por Producto con Totales */}
      {vistaActual === 'consolidado' && consolidadoCompras && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Reporte Consolidado de Compras</h2>
              <p className="text-sm text-gray-600">
                Total: {consolidadoCompras.resumen_general.total_productos_diferentes} productos diferentes | 
                {consolidadoCompras.resumen_general.total_unidades_necesarias} unidades | 
                {formatCurrency(consolidadoCompras.resumen_general.valor_total_estimado)}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando reporte consolidado...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Necesario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalle por Farmacia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consolidadoCompras.productos.map((producto, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{producto.descripcion}</div>
                          <div className="text-sm text-gray-500">
                            Código: {producto.codigo} | {producto.laboratorio}
                          </div>
                          <div className="text-sm text-gray-500">
                            Precio unit: {formatCurrency(producto.precio_unitario)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-2xl font-bold text-blue-600">
                          {producto.total_necesario} unidades
                        </div>
                        <div className="text-sm text-gray-500">
                          {producto.detalle_farmacias.length} farmacia{producto.detalle_farmacias.length !== 1 ? 's' : ''} afectada{producto.detalle_farmacias.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {producto.detalle_farmacias.map((detalle, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-gray-900">{detalle.farmacia_nombre}:</span>
                              <span className="ml-2 text-blue-600 font-semibold">
                                {detalle.cantidad_necesaria} unidades
                              </span>
                              <span className="ml-2 text-gray-500">
                                (stock actual: {detalle.stock_actual})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(producto.valor_total)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Vista Detallada - Reporte Original */}
      {vistaActual === 'detallado' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Productos en Falla - Vista Detallada</h2>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando productos en falla...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Situación Actual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farmacias Afectadas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sugerencia Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFalla.map((producto, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{producto.descripcion}</div>
                          <div className="text-sm text-gray-500">
                            Código: {producto.codigo} | {producto.laboratorio}
                          </div>
                          <div className="text-sm text-gray-500">
                            Precio ref: {formatCurrency(producto.precio_referencia)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Stock total: {producto.stock_total} unidades</div>
                          <div className="text-red-600">Sin stock: {producto.farmacias_sin_stock} farmacias</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {producto.farmacias_afectadas.map((farmacia, idx) => (
                            <div key={idx} className="mb-1">
                              <span className="font-medium">{farmacia.farmacia_nombre}:</span>
                              <span className={`ml-1 ${farmacia.stock_actual === 0 ? 'text-red-600 font-bold' : 'text-yellow-600'}`}>
                                {farmacia.stock_actual} unidades
                              </span>
                              <span className="ml-2 text-blue-600 font-semibold">
                                (necesita: {farmacia.sugerencia_compra})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-blue-600">
                          {producto.cantidad_total_sugerida} unidades
                        </div>
                        <div className="text-sm text-gray-500">
                          Valor aprox: {formatCurrency(producto.valor_total_estimado)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadColor(producto.prioridad)}`}>
                          {producto.prioridad}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Resumen de Sugerencias por Prioridad */}
      {sugerencias.resumen && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Alta Prioridad</h3>
            <p className="text-2xl font-bold text-red-900">{sugerencias.resumen.productos_alta_prioridad}</p>
            <p className="text-sm text-red-600">productos críticos</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Media Prioridad</h3>
            <p className="text-2xl font-bold text-yellow-900">{sugerencias.resumen.productos_media_prioridad}</p>
            <p className="text-sm text-yellow-600">productos importantes</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Baja Prioridad</h3>
            <p className="text-2xl font-bold text-green-900">{sugerencias.resumen.productos_baja_prioridad}</p>
            <p className="text-sm text-green-600">productos opcionales</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reportes

