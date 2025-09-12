import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Plus, Edit, Trash2 } from 'lucide-react'

function Farmacias() {
  const [farmacias, setFarmacias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFarmacia, setEditingFarmacia] = useState(null)
  const [formData, setFormData] = useState({ nombre: '' })

  useEffect(() => {
    fetchFarmacias()
  }, [])

  const fetchFarmacias = async () => {
    try {
      const response = await fetch('/api/farmacias')
      const data = await response.json()
      setFarmacias(data)
    } catch (error) {
      console.error('Error fetching farmacias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingFarmacia 
        ? `/api/farmacias/${editingFarmacia.id}`
        : '/api/farmacias'
      
      const method = editingFarmacia ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchFarmacias()
        setShowForm(false)
        setEditingFarmacia(null)
        setFormData({ nombre: '' })
      }
    } catch (error) {
      console.error('Error saving farmacia:', error)
    }
  }

  const handleEdit = (farmacia) => {
    setEditingFarmacia(farmacia)
    setFormData({ nombre: farmacia.nombre })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta farmacia?')) {
      try {
        const response = await fetch(`/api/farmacias/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchFarmacias()
        }
      } catch (error) {
        console.error('Error deleting farmacia:', error)
      }
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingFarmacia(null)
    setFormData({ nombre: '' })
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Farmacias</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Nueva Farmacia
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingFarmacia ? 'Editar Farmacia' : 'Nueva Farmacia'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Farmacia
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ingrese el nombre de la farmacia"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingFarmacia ? 'Actualizar' : 'Crear'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Farmacias</h2>
          {farmacias.length === 0 ? (
            <p className="text-gray-500">No hay farmacias registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Nombre</th>
                    <th className="text-left py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {farmacias.map((farmacia) => (
                    <tr key={farmacia.id} className="border-b">
                      <td className="py-2">{farmacia.id}</td>
                      <td className="py-2">{farmacia.nombre}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(farmacia)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(farmacia.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Farmacias

