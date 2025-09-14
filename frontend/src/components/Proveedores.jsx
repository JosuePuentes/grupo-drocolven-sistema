import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, CreditCard, Percent, Calendar, Upload } from 'lucide-react'

// Re-usable Button component (assuming it's not in a separate file)
const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background'
  const variants = { default: 'bg-blue-600 text-white hover:bg-blue-700', outline: 'border border-gray-300 bg-white hover:bg-gray-50', ghost: 'hover:bg-gray-100', destructive: 'bg-red-600 text-white hover:bg-red-700' }
  const sizes = { default: 'h-10 py-2 px-4', sm: 'h-9 px-3 text-sm', lg: 'h-11 px-8' }
  return <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>{children}</button>
}

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([])
  const [estadisticas, setEstadisticas] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState(null)
  const [uploadingProveedor, setUploadingProveedor] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
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
    setFormData({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', dias_credito: 0, descuento_comercial: 0, descuento_pronto_pago: 0 })
    setShowModal(true)
  }

  const openEditProveedorModal = (proveedor) => {
    setEditingProveedor(proveedor)
    setFormData({ ...proveedor })
    setShowModal(true)
  }

  const openUploadModal = (proveedor) => {
    setUploadingProveedor(proveedor)
    setSelectedFile(null)
    setShowUploadModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const url = editingProveedor ? `/api/proveedores/${editingProveedor.id}` : '/api/proveedores'
    const method = editingProveedor ? 'PUT' : 'POST'
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
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
        const response = await fetch(`/api/proveedores/${proveedorId}`, { method: 'DELETE' })
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

  const handleUpload = async () => {
    if (!selectedFile || !uploadingProveedor) return

    const uploadData = new FormData()
    uploadData.append('file', selectedFile)

    try {
      const response = await fetch(`/api/lista-comparativa/upload/${uploadingProveedor.id}`, {
        method: 'POST',
        body: uploadData,
      })
      const result = await response.json()
      if (response.ok) {
        alert(result.message || 'Lista de precios subida exitosamente')
        setShowUploadModal(false)
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert('Error al subir el archivo.')
      console.error('Upload error:', error)
    }
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Proveedores</h1>
        <p className="text-gray-600">Administra los proveedores y sus listas de precios.</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"> 
        {/* ... existing stats components ... */}
      </div>

      <div className="mb-6"><Button onClick={openNewProveedorModal}><Plus className="h-4 w-4 mr-2" />Nuevo Proveedor</Button></div>

      {/* Tabla de Proveedores */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b"><h2 className="text-lg font-semibold">Lista de Proveedores</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Términos Financieros</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{proveedor.nombre}</div>
                    <div className="text-sm text-gray-500">{proveedor.direccion || 'Dirección no especificada'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{proveedor.contacto || '-'}</div>
                    <div className="text-sm text-gray-500">{proveedor.telefono || '-'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Crédito: {proveedor.dias_credito} días</div>
                    <div className="text-sm text-gray-500">Desc: {proveedor.descuento_comercial}% / {proveedor.descuento_pronto_pago}%</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openUploadModal(proveedor)}><Upload className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => openEditProveedorModal(proveedor)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(proveedor.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear/Editar Proveedor */}
      {showModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* ... existing modal form ... */}
        </div>
      )}

      {/* Modal de Subir Lista de Precios */}
      {showUploadModal && uploadingProveedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Subir Lista de Precios</h3>
            <p className="text-sm text-gray-600 mb-4">Proveedor: <span className="font-bold">{uploadingProveedor.nombre}</span></p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona el archivo Excel</label>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">Columnas esperadas: codigo, descripcion, laboratorio, existencia, precio.</p>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={!selectedFile}>Subir Archivo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proveedores

