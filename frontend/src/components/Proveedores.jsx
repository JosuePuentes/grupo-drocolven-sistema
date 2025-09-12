import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, CreditCard, Percent, Calendar } from 'lucide-react'

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

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([])
  const [estadisticas, setEstadisticas] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    dias_credito: 0,
    descuento_comercial: 0,
    descuento_pronto_pago: 0
  })

  useEffect(() => {
    fetchProveedores()
    fetchEstadisticas()
  }, [])

  const fetchProveedores = async () => {
    try {
      const response = await fetch('/api/proveedores')
      const data = await response.json()
      setProveedores(data)
    } catch (error) {
      console.error('Error cargando proveedores:', error)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const response = await fetch('/api/proveedores/estadisticas')
      const data = await response.json()
      setEstadisticas(data)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const openNewProveedorModal = () => {
    setEditingProveedor(null)
    setFormData({
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      dias_credito: 0,
      descuento_comercial: 0,
      descuento_pronto_pago: 0
    })
    setShowModal(true)
  }

  const openEditProveedorModal = (proveedor) => {
    setEditingProveedor(proveedor)
    setFormData({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      dias_credito: proveedor.dias_credito || 0,
      descuento_comercial: proveedor.descuento_comercial || 0,
      descuento_pronto_pago: proveedor.descuento_pronto_pago || 0
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingProveedor 
        ? `/api/proveedores/${editingProveedor.id}`
        : '/api/proveedores'
      
      const method = editingProveedor ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(result.message)
        fetchProveedores()
        fetchEstadisticas()
        setShowModal(false)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert('Error procesando solicitud')
    }
  }

  const handleDelete = async (proveedorId) => {
    if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      try {
        const response = await fetch(`/api/proveedores/${proveedorId}`, {
          method: 'DELETE'
        })

        const result = await response.json()
        
        if (response.ok) {
          alert(result.message)
          fetchProveedores()
          fetchEstadisticas()
        } else {
          alert(`Error: ${result.error}`)
        }
      } catch (error) {
        alert('Error eliminando proveedor')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Proveedores</h1>
        <p className="text-gray-600">Administra los proveedores de Grupo Drocolven</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Total Proveedores</p>
              <p className="text-2xl font-bold text-blue-900">{estadisticas.total_proveedores || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Con Crédito</p>
              <p className="text-2xl font-bold text-green-900">{estadisticas.proveedores_con_credito || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-600">Promedio Días Crédito</p>
              <p className="text-2xl font-bold text-purple-900">{estadisticas.promedio_dias_credito || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Percent className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-orange-600">Desc. Comercial Prom.</p>
              <p className="text-2xl font-bold text-orange-900">{estadisticas.promedio_descuento_comercial || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Nuevo Proveedor */}
      <div className="mb-6">
        <Button onClick={openNewProveedorModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Tabla de Proveedores */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Lista de Proveedores</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Términos Financieros
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{proveedor.nombre}</div>
                      {proveedor.direccion && (
                        <div className="text-sm text-gray-500">{proveedor.direccion}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      {proveedor.contacto && (
                        <div className="text-sm text-gray-900">{proveedor.contacto}</div>
                      )}
                      {proveedor.telefono && (
                        <div className="text-sm text-gray-500">{proveedor.telefono}</div>
                      )}
                      {proveedor.email && (
                        <div className="text-sm text-gray-500">{proveedor.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Crédito: {proveedor.dias_credito} días</div>
                      <div>Desc. Comercial: {proveedor.descuento_comercial}%</div>
                      <div>Desc. Pronto Pago: {proveedor.descuento_pronto_pago}%</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(proveedor.fecha_creacion)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditProveedorModal(proveedor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(proveedor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Proveedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Contacto
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.contacto}
                    onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Términos Financieros</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días de Crédito
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.dias_credito}
                      onChange={(e) => setFormData({...formData, dias_credito: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento Comercial (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.descuento_comercial}
                      onChange={(e) => setFormData({...formData, descuento_comercial: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descuento Pronto Pago (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.descuento_pronto_pago}
                      onChange={(e) => setFormData({...formData, descuento_pronto_pago: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proveedores

