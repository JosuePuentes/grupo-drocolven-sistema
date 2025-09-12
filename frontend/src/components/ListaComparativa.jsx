import React, { useState, useEffect } from 'react'
import { Search, Upload, TrendingUp, Package, Users, ChevronDown, ChevronUp, Percent, CreditCard } from 'lucide-react'

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

const ListaComparativa = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [resultados, setResultados] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [estadisticas, setEstadisticas] = useState({})
  const [loading, setLoading] = useState(false)
  const [expandedProducts, setExpandedProducts] = useState({})
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadingProveedor, setUploadingProveedor] = useState(null)

  useEffect(() => {
    fetchProveedores()
    fetchEstadisticas()
  }, [])

  const fetchProveedores = async () => {
    try {
      const response = await fetch('/api/lista-comparativa/proveedores')
      const data = await response.json()
      setProveedores(data)
    } catch (error) {
      console.error('Error cargando proveedores:', error)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const response = await fetch('/api/lista-comparativa/estadisticas')
      const data = await response.json()
      setEstadisticas(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setResultados([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/lista-comparativa/buscar?q=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      setResultados(data)
    } catch (error) {
      console.error('Error en búsqueda:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleProductExpansion = (index) => {
    setExpandedProducts(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const handleFileUpload = async (proveedorId, file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/lista-comparativa/upload/${proveedorId}`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`Lista procesada exitosamente:\n- Productos nuevos: ${result.productos_nuevos}\n- Productos actualizados: ${result.productos_actualizados}`)
        fetchProveedores()
        fetchEstadisticas()
        setShowUploadModal(false)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert('Error subiendo archivo')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(amount)
  }

  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lista Comparativa de Proveedores</h1>
        <p className="text-gray-600">Busca medicamentos entre todos tus proveedores y encuentra el mejor precio con descuentos aplicados</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Total Productos</p>
              <p className="text-2xl font-bold text-blue-900">{estadisticas.total_productos || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Proveedores Activos</p>
              <p className="text-2xl font-bold text-green-900">{estadisticas.total_proveedores || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-600">Productos Únicos</p>
              <p className="text-2xl font-bold text-purple-900">{estadisticas.productos_unicos || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Percent className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-orange-600">Ahorro Promedio</p>
              <p className="text-2xl font-bold text-orange-900">12.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar medicamento por código, nombre o laboratorio..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Lista de Precios
          </Button>
        </div>
      </div>

      {/* Resultados de Búsqueda */}
      {resultados.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Resultados de búsqueda ({resultados.length} productos encontrados)
          </h2>
          
          {resultados.map((producto, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border">
              {/* Información principal del producto */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{producto.descripcion}</h3>
                    <p className="text-sm text-gray-600">
                      Código: {producto.codigo} | Laboratorio: {producto.laboratorio}
                    </p>
                  </div>
                  
                  {/* Mejor precio destacado */}
                  <div className="text-right">
                    <div className="bg-green-100 px-3 py-2 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Mejor Precio</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(producto.mejor_precio)}
                      </p>
                      <p className="text-sm text-green-700">{producto.mejor_proveedor}</p>
                      {producto.ahorro_mejor_opcion > 0 && (
                        <p className="text-xs text-green-600">
                          Ahorro: {formatCurrency(producto.ahorro_mejor_opcion)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Botón para expandir/contraer */}
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Disponible en {producto.proveedores.length} proveedor{producto.proveedores.length !== 1 ? 'es' : ''}
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProductExpansion(index)}
                  >
                    {expandedProducts[index] ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Ocultar opciones
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Ver todas las opciones
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Lista expandible de proveedores */}
              {expandedProducts[index] && (
                <div className="border-t bg-gray-50">
                  <div className="p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Comparación de precios por proveedor:
                    </h4>
                    
                    <div className="space-y-3">
                      {producto.proveedores.map((proveedor, provIndex) => (
                        <div
                          key={provIndex}
                          className={`p-3 rounded-lg border ${
                            proveedor.es_mejor_precio 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-gray-900">
                                  {proveedor.proveedor_nombre}
                                </h5>
                                {proveedor.es_mejor_precio && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                    MEJOR PRECIO
                                  </span>
                                )}
                              </div>
                              
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Precio Original:</p>
                                  <p className="font-medium line-through text-gray-500">
                                    {formatCurrency(proveedor.precio_original)}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-gray-600">Desc. Comercial:</p>
                                  <p className="font-medium text-blue-600">
                                    {formatPercentage(proveedor.descuento_comercial)}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-gray-600">Precio Final:</p>
                                  <p className="font-bold text-green-600">
                                    {formatCurrency(proveedor.precio_con_descuento_comercial)}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-gray-600">Ahorro Total:</p>
                                  <p className="font-medium text-green-600">
                                    {formatCurrency(proveedor.ahorro_total)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Información adicional */}
                              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                {proveedor.dias_credito > 0 && (
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    <span>{proveedor.dias_credito} días crédito</span>
                                  </div>
                                )}
                                
                                {proveedor.descuento_pronto_pago > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Percent className="h-3 w-3" />
                                    <span>+{formatPercentage(proveedor.descuento_pronto_pago)} pronto pago</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Diferencia con el mejor precio */}
                            {!proveedor.es_mejor_precio && proveedor.diferencia_con_mejor && (
                              <div className="text-right">
                                <p className="text-sm text-red-600">
                                  +{formatCurrency(proveedor.diferencia_con_mejor)}
                                </p>
                                <p className="text-xs text-red-500">
                                  ({formatPercentage(proveedor.porcentaje_diferencia)} más caro)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && searchTerm && resultados.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
          <p className="text-gray-600">
            No hay productos que coincidan con "{searchTerm}" en las listas de proveedores.
          </p>
        </div>
      )}

      {/* Estado inicial */}
      {!searchTerm && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Busca medicamentos</h3>
          <p className="text-gray-600">
            Ingresa el nombre, código o laboratorio del medicamento que necesitas.
          </p>
        </div>
      )}

      {/* Modal de Subida de Lista */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Subir Lista de Proveedor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Proveedor
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={uploadingProveedor || ''}
                  onChange={(e) => setUploadingProveedor(e.target.value)}
                >
                  <option value="">Selecciona un proveedor</option>
                  {proveedores.map(proveedor => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo Excel
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files[0] && uploadingProveedor) {
                      handleFileUpload(uploadingProveedor, e.target.files[0])
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!uploadingProveedor}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: Código, Descripción, Laboratorio, Precio, Precio con Descuento
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadingProveedor(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListaComparativa

