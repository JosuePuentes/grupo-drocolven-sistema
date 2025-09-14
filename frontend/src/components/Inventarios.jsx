import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Upload, Download, Search } from 'lucide-react'

function Inventarios() {
  const [farmacias, setFarmacias] = useState([])
  const [selectedFarmacia, setSelectedFarmacia] = useState('')
  const [inventarios, setInventarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchFarmacias()
  }, [])

  useEffect(() => {
    if (selectedFarmacia) {
      fetchInventarios()
    }
  }, [selectedFarmacia])

  const fetchFarmacias = async () => {
    try {
      const response = await fetch('/api/farmacias')
      const data = await response.json()
      setFarmacias(data)
    } catch (error) {
      console.error('Error fetching farmacias:', error)
    }
  }

  const fetchInventarios = async () => {
    if (!selectedFarmacia) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/inventarios?farmacia_id=${selectedFarmacia}`)
      const data = await response.json()
      setInventarios(data)
    } catch (error) {
      console.error('Error fetching inventarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedFarmacia) {
      alert('Por favor seleccione una farmacia y un archivo')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('farmacia_id', selectedFarmacia)

    try {
      const response = await fetch('/api/inventarios/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`Inventario cargado exitosamente. ${result.inventarios_procesados} productos procesados.`)
        setUploadFile(null)
        fetchInventarios()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error al cargar el archivo')
    } finally {
      setUploading(false)
    }
  }

  const filteredInventarios = inventarios.filter(item =>
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.laboratorio.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Inventarios</h1>

      {/* Selector de Farmacia */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Seleccionar Farmacia</h2>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedFarmacia}
          onChange={(e) => setSelectedFarmacia(e.target.value)}
        >
          <option value="">Seleccione una farmacia</option>
          {farmacias.map((farmacia) => (
            <option key={farmacia.id} value={farmacia.id}>
              {farmacia.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Subida de Archivo */}
      {selectedFarmacia && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Cargar Inventario desde Excel</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archivo Excel (.xlsx, .xls)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Formato esperado: Código, Descripción, Laboratorio, Existencia, Precio
              </p>
            </div>
            <Button 
              onClick={handleFileUpload}
              disabled={!uploadFile || uploading}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              {uploading ? 'Cargando...' : 'Cargar Inventario'}
            </Button>
          </div>
        </div>
      )}

      {/* Lista de Inventarios */}
      {selectedFarmacia && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Inventario - {farmacias.find(f => f.id == selectedFarmacia)?.nombre}
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <p>Cargando inventario...</p>
            ) : filteredInventarios.length === 0 ? (
              <p className="text-gray-500">No hay productos en el inventario</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Código</th>
                      <th className="text-left py-2">Descripción</th>
                      <th className="text-left py-2">Laboratorio</th>
                      <th className="text-left py-2">Precio</th>
                      <th className="text-left py-2">Precio con Desc. Diario</th>
                      <th className="text-left py-2">Desc. Diario (%)</th>
                      <th className="text-left py-2">Existencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventarios.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.codigo}</td>
                        <td className="py-2">{item.descripcion}</td>
                        <td className="py-2">{item.laboratorio}</td>
                        <td className="py-2">${item.precio.toFixed(2)}</td>
                        <td className="py-2">${item.precio_neto.toFixed(2)}</td>
                        <td className="py-2">{item.descuento_diario_porcentaje ? `${item.descuento_diario_porcentaje}%` : 'N/A'}</td>
                        <td className="py-2">{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventarios

