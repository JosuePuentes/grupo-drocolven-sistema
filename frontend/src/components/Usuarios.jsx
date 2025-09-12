import { useState, useEffect } from 'react'
import { User, Plus, Edit, Trash2, Eye, EyeOff, Shield, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [changingPasswordUser, setChangingPasswordUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    rol: 'vendedor',
    permisos: {}
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [permisosDisponibles, setPermisosDisponibles] = useState({})
  const [permisosRol, setPermisosRol] = useState({})
  const [showPermisos, setShowPermisos] = useState(false)

  const roles = [
    { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
    { value: 'gerente', label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
    { value: 'farmaceutico', label: 'Farmacéutico', color: 'bg-green-100 text-green-800' },
    { value: 'vendedor', label: 'Vendedor', color: 'bg-gray-100 text-gray-800' }
  ]

  const getRoleInfo = (rol) => {
    return roles.find(r => r.value === rol) || roles[3]
  }

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsuarios(data)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermisosDisponibles = async () => {
    try {
      const response = await fetch('/api/permisos/disponibles')
      const data = await response.json()
      setPermisosDisponibles(data)
    } catch (error) {
      console.error('Error cargando permisos disponibles:', error)
    }
  }

  const fetchPermisosRol = async (rol) => {
    try {
      const response = await fetch(`/api/permisos/rol/${rol}`)
      const data = await response.json()
      setPermisosRol(data)
    } catch (error) {
      console.error('Error cargando permisos del rol:', error)
    }
  }

  useEffect(() => {
    fetchUsuarios()
    fetchPermisosDisponibles()
  }, [])

  useEffect(() => {
    if (formData.rol) {
      fetchPermisosRol(formData.rol)
    }
  }, [formData.rol])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      // Si estamos editando y no se cambió la contraseña, no la enviamos
      const dataToSend = { ...formData }
      if (editingUser && !formData.password) {
        delete dataToSend.password
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        await fetchUsuarios()
        setShowModal(false)
        setEditingUser(null)
        setFormData({ username: '', email: '', password: '', rol: 'vendedor' })
        alert(result.message || 'Usuario guardado exitosamente')
      } else {
        alert(result.error || 'Error al guardar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar usuario')
    }
  }

  const handleEdit = (usuario) => {
    setEditingUser(usuario)
    setFormData({
      username: usuario.username,
      email: usuario.email,
      password: '',
      rol: usuario.rol
    })
    setShowModal(true)
  }

  const handleDelete = async (usuario) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.username}?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/users/${usuario.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        await fetchUsuarios()
        alert(result.message || 'Usuario eliminado exitosamente')
      } else {
        alert(result.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar usuario')
    }
  }

  const handleChangePassword = (usuario) => {
    setChangingPasswordUser(usuario)
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Las contraseñas no coinciden')
      return
    }
    
    if (passwordData.new_password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    try {
      const response = await fetch(`/api/users/${changingPasswordUser.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(result.message || 'Contraseña actualizada exitosamente')
        setShowPasswordModal(false)
        setChangingPasswordUser(null)
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      } else {
        alert(result.error || 'Error al cambiar contraseña')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cambiar contraseña')
    }
  }

  const handleResetPassword = async (usuario) => {
    const newPassword = prompt(`Ingresa la nueva contraseña para ${usuario.username}:`)
    
    if (!newPassword) return
    
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    try {
      const response = await fetch(`/api/users/${usuario.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_password: newPassword
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(`Contraseña reseteada exitosamente para ${usuario.username}`)
      } else {
        alert(result.error || 'Error al resetear contraseña')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al resetear contraseña')
    }
  }

  const openNewUserModal = () => {
    setEditingUser(null)
    setFormData({ username: '', email: '', password: '', rol: 'vendedor', permisos: {} })
    setShowPermisos(false)
    setShowModal(true)
  }

  const handlePermisoChange = (modulo, accion, valor) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [modulo]: {
          ...prev.permisos[modulo],
          [accion]: valor
        }
      }
    }))
  }

  const toggleShowPermisos = () => {
    setShowPermisos(!showPermisos)
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <Button onClick={openNewUserModal} className="flex items-center gap-2">
            <Plus size={20} />
            Nuevo Usuario
          </Button>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((usuario) => {
                  const roleInfo = getRoleInfo(usuario.rol)
                  return (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{usuario.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                          {usuario.rol === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                          {usuario.rol === 'gerente' && <UserCheck className="w-3 h-3 mr-1" />}
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(usuario)}
                            className="flex items-center gap-1"
                          >
                            <Edit size={14} />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePassword(usuario)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            <Shield size={14} />
                            Cambiar Contraseña
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(usuario)}
                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                          >
                            <UserCheck size={14} />
                            Resetear
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(usuario)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {usuarios.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          )}
        </div>

        {/* Modal para crear/editar usuario */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  >
                    {roles.map((rol) => (
                      <option key={rol.value} value={rol.value}>
                        {rol.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sección de Permisos */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Permisos Personalizados
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleShowPermisos}
                    >
                      {showPermisos ? 'Ocultar' : 'Configurar'} Permisos
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    Los permisos se basan en el rol seleccionado. Aquí puedes personalizar permisos específicos.
                  </div>

                  {showPermisos && (
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      {Object.entries(permisosDisponibles).map(([modulo, config]) => (
                        <div key={modulo} className="mb-4 last:mb-0">
                          <h4 className="font-medium text-sm text-gray-800 mb-2">
                            {config.label}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(config.acciones).map(([accion, descripcion]) => {
                              const permisoRol = permisosRol[modulo]?.[accion] || false
                              const permisoCustom = formData.permisos[modulo]?.[accion]
                              const permisoActual = permisoCustom !== undefined ? permisoCustom : permisoRol
                              
                              return (
                                <label key={accion} className="flex items-center text-xs">
                                  <input
                                    type="checkbox"
                                    checked={permisoActual}
                                    onChange={(e) => handlePermisoChange(modulo, accion, e.target.checked)}
                                    className="mr-2 h-3 w-3"
                                  />
                                  <span className={permisoRol ? 'text-blue-600' : 'text-gray-600'}>
                                    {descripcion}
                                    {permisoRol && <span className="text-blue-500 ml-1">(por rol)</span>}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setEditingUser(null)
                      setFormData({ username: '', email: '', password: '', rol: 'vendedor', permisos: {} })
                      setShowPermisos(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUser ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para cambiar contraseña */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                Cambiar Contraseña - {changingPasswordUser?.username}
              </h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder="Ingresa la contraseña actual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>

                {passwordData.new_password && passwordData.confirm_password && 
                 passwordData.new_password !== passwordData.confirm_password && (
                  <div className="text-red-600 text-sm">
                    Las contraseñas no coinciden
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setChangingPasswordUser(null)
                      setPasswordData({
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                      })
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={passwordData.new_password !== passwordData.confirm_password || passwordData.new_password.length < 6}
                  >
                    Cambiar Contraseña
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Usuarios

