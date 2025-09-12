import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Home, Building2, Package, Search, Users, Truck, BarChart3, LogOut } from 'lucide-react'
import Farmacias from './components/Farmacias.jsx'
import Inventarios from './components/Inventarios.jsx'
import Busqueda from './components/Busqueda.jsx'
import Usuarios from './components/Usuarios.jsx'
import ListaComparativa from './components/ListaComparativa.jsx'
import Proveedores from './components/Proveedores.jsx'
import Reportes from './components/Reportes.jsx'
import './App.css'

// Componentes temporales para las rutas
function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard - Sistema de Gestión de Farmacias</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/farmacias" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Farmacias</h2>
          </div>
          <p className="text-gray-600">Gestionar farmacias de la red</p>
        </Link>
        <Link to="/inventarios" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-green-600" size={24} />
            <h2 className="text-xl font-semibold">Inventario</h2>
          </div>
          <p className="text-gray-600">Administrar inventarios por farmacia</p>
        </Link>
        <Link to="/busqueda" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Search className="text-purple-600" size={24} />
            <h2 className="text-xl font-semibold">Búsqueda</h2>
          </div>
          <p className="text-gray-600">Buscar medicamentos y precios</p>
        </Link>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-orange-600" size={24} />
            <h2 className="text-xl font-semibold">Ventas</h2>
          </div>
          <p className="text-gray-600">Procesar ventas y generar recibos</p>
        </div>
        <Link to="/usuarios" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-red-600" size={24} />
            <h2 className="text-xl font-semibold">Usuarios</h2>
          </div>
          <p className="text-gray-600">Gestionar usuarios del sistema</p>
        </Link>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="text-indigo-600" size={24} />
            <h2 className="text-xl font-semibold">Proveedores</h2>
          </div>
          <p className="text-gray-600">Administrar proveedores y precios</p>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ onLogout, user }) {
  const location = useLocation()
  
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/farmacias', icon: Building2, label: 'Farmacias' },
    { path: '/inventarios', icon: Package, label: 'Inventarios' },
    { path: '/busqueda', icon: Search, label: 'Búsqueda' },
    { path: '/usuarios', icon: Users, label: 'Usuarios' },
    { path: '/lista-comparativa', icon: BarChart3, label: 'Lista Comparativa' },
    { path: '/proveedores', icon: Truck, label: 'Proveedores' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  ]

  return (
    <div className="w-64 bg-gray-800 text-white h-screen flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold">Grupo Drocolven</h2>
        {user && (
          <div className="mt-2 text-sm text-gray-300">
            <p>Bienvenido, {user.username}</p>
            <p className="text-xs">Rol: {user.rol}</p>
          </div>
        )}
      </div>
      <nav className="mt-8 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                isActive ? 'bg-gray-700 border-r-2 border-blue-500' : ''
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 mt-auto">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 text-white border-gray-600 hover:bg-gray-700"
          onClick={onLogout}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Guardar datos del usuario en localStorage
        localStorage.setItem('user', JSON.stringify(data))
        onLogin(data)
      } else {
        setError(data.error || 'Error al iniciar sesión')
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Gestión de Farmacias
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión en tu cuenta
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Button 
              type="submit" 
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MainLayout({ children, onLogout, user }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onLogout={onLogout} user={user} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false) // Cambiado a false para requerir login
  const [user, setUser] = useState(null)

  // Verificar si hay una sesión guardada al cargar la aplicación
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <Router>
      <div className="min-h-screen">
        {!isAuthenticated ? (
          <Login onLogin={handleLogin} />
        ) : (
          <MainLayout onLogout={handleLogout} user={user}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/farmacias" element={<Farmacias />} />
              <Route path="/inventarios" element={<Inventarios />} />
              <Route path="/busqueda" element={<Busqueda />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/lista-comparativa" element={<ListaComparativa />} />
              <Route path="/proveedores" element={<Proveedores />} />
              <Route path="/reportes" element={<Reportes />} />
            </Routes>
          </MainLayout>
        )}
      </div>
    </Router>
  )
}

export default App

