import { useState, useEffect } from 'react'
import { Search, ShoppingCart, MapPin, Package, Calendar, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

function Busqueda() {
  const [searchTerm, setSearchTerm] = useState('')
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [carrito, setCarrito] = useState([])

  const buscarProductos = async () => {
    if (!searchTerm.trim()) {
      setProductos([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/inventarios/search?q=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      setProductos(data)
    } catch (error) {
      console.error('Error buscando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const agregarAlCarrito = (producto, farmacia) => {
    const item = {
      id: `${producto.codigo}-${farmacia.farmacia_id}`,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      laboratorio: producto.laboratorio,
      farmacia_id: farmacia.farmacia_id,
      farmacia_nombre: farmacia.farmacia_nombre,
      precio: farmacia.precio_neto,
      cantidad: 1,
      disponible: farmacia.pedido
    }

    const existingItem = carrito.find(item => item.id === `${producto.codigo}-${farmacia.farmacia_id}`)
    
    if (existingItem) {
      setCarrito(carrito.map(item => 
        item.id === `${producto.codigo}-${farmacia.farmacia_id}`
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
    } else {
      setCarrito([...carrito, item])
    }
  }

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter(item => item.id !== id))
    } else {
      setCarrito(carrito.map(item => 
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      ))
    }
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0)
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-ES')
  }

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(precio)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarProductos()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Búsqueda de Medicamentos</h1>

        {/* Barra de búsqueda */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar medicamentos por nombre, código o laboratorio..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resultados de búsqueda */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Buscando productos...</p>
              </div>
            ) : productos.length === 0 && searchTerm ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No se encontraron productos para "{searchTerm}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {productos.map((producto) => (
                  <div key={producto.codigo} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Información del producto */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {producto.descripcion}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Package size={14} />
                            Código: {producto.codigo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 size={14} />
                            {producto.laboratorio}
                          </span>
                          {producto.fecha_vencimiento && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              Vence: {formatearFecha(producto.fecha_vencimiento)}
                            </span>
                          )}
                          {producto.nacional && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              producto.nacional.toLowerCase().includes('si') 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {producto.nacional.toLowerCase().includes('si') ? 'Nacional' : 'Importado'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Disponibilidad en farmacias */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Disponible en {producto.farmacias.length} farmacia{producto.farmacias.length !== 1 ? 's' : ''}:
                        </h4>
                        <div className="grid gap-3">
                          {producto.farmacias.map((farmacia) => (
                            <div key={farmacia.farmacia_id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MapPin size={16} className="text-blue-600" />
                                    <span className="font-medium text-gray-900">
                                      {farmacia.farmacia_nombre}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">Precio: </span>
                                      <span className="font-medium">{formatearPrecio(farmacia.precio)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Precio neto: </span>
                                      <span className="font-medium text-green-600">
                                        {formatearPrecio(farmacia.precio_neto)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Disponible: </span>
                                      <span className={`font-medium ${
                                        farmacia.pedido > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {farmacia.pedido > 0 ? `${farmacia.pedido} unidades` : 'Sin stock'}
                                      </span>
                                    </div>
                                    {farmacia.descuento > 0 && (
                                      <div>
                                        <span className="text-gray-600">Descuento: </span>
                                        <span className="font-medium text-orange-600">
                                          {(farmacia.descuento * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <Button
                                    onClick={() => agregarAlCarrito(producto, farmacia)}
                                    disabled={farmacia.pedido <= 0}
                                    className="flex items-center gap-2"
                                    size="sm"
                                  >
                                    <ShoppingCart size={16} />
                                    Agregar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carrito de compras */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Carrito ({carrito.length})
                </h3>

                {carrito.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    El carrito está vacío
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {carrito.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded p-3">
                          <h4 className="font-medium text-sm mb-1">
                            {item.descripcion}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {item.farmacia_nombre}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
                              >
                                -
                              </button>
                              <span className="text-sm font-medium">{item.cantidad}</span>
                              <button
                                onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                disabled={item.cantidad >= item.disponible}
                                className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100 disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-sm font-medium">
                              {formatearPrecio(item.precio * item.cantidad)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-lg text-green-600">
                          {formatearPrecio(calcularTotal())}
                        </span>
                      </div>
                      <Button className="w-full">
                        Procesar Venta
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Busqueda

