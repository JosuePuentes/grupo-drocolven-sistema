import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Home, Building2, Package, Search, Users, Truck, BarChart3, LogOut, ShoppingBag, Upload } from 'lucide-react';
import Farmacias from './components/Farmacias.jsx';
import Inventarios from './components/Inventarios.jsx';
import Busqueda from './components/Busqueda.jsx';
import Usuarios from './components/Usuarios.jsx';
import ListaComparativa from './components/ListaComparativa.jsx';
import Proveedores from './components/Proveedores.jsx';
import Reportes from './components/Reportes.jsx';
import SupplierDashboard from './components/SupplierDashboard.jsx';
import Cart from './components/Cart.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import './App.css';

function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard - Sistema de Gestión de Farmacias</h1>
      {/* ... content ... */}
    </div>
  );
}

function PharmacySidebar({ onLogout, user }) {
  const location = useLocation();
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/farmacias', icon: Building2, label: 'Farmacias' },
    { path: '/inventarios', icon: Package, label: 'Inventarios' },
    { path: '/lista-comparativa', icon: Search, label: 'Lista Comparativa' },
    { path: '/proveedores', icon: Truck, label: 'Proveedores' },
    { path: '/usuarios', icon: Users, label: 'Usuarios' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  ];

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
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${isActive ? 'bg-gray-700 border-r-2 border-blue-500' : ''}`}>
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mt-auto">
        <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-white border-gray-600 hover:bg-gray-700" onClick={onLogout}>
          <LogOut size={16} />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}

function SupplierSidebar({ onLogout, user }) {
    const location = useLocation();
    const menuItems = [
      { path: '/supplier/dashboard', icon: ShoppingBag, label: 'Pedidos Recibidos' },
      { path: '/supplier/upload', icon: Upload, label: 'Subir Lista' },
    ];
  
    return (
        <div className="w-64 bg-gray-800 text-white h-screen flex flex-col">
            <div className="p-4"><h2 className="text-xl font-bold">Portal de Proveedor</h2>
                {user && (
                    <div className="mt-2 text-sm text-gray-300">
                        <p>Bienvenido, {user.username}</p>
                    </div>
                )}
            </div>
            <nav className="mt-8 flex-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${isActive ? 'bg-gray-700 border-r-2 border-blue-500' : ''}`}>
                            <Icon size={20} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 mt-auto">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-white border-gray-600 hover:bg-gray-700" onClick={onLogout}>
                    <LogOut size={16} />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}

function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        login(data);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {/* ... Login Form JSX ... */}
    </div>
  );
}

function MainLayout({ children }) {
    const { user, logout } = useAuth();
    return (
        <div className="flex h-screen bg-gray-100">
            {user && user.proveedor_id ? 
                <SupplierSidebar onLogout={logout} user={user} /> : 
                <PharmacySidebar onLogout={logout} user={user} />
            }
            <div className="flex-1 overflow-auto">
                {children}
            </div>
            {user && !user.proveedor_id && <Cart />} 
        </div>
    );
}

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen">
      {!isAuthenticated ? (
        <Login />
      ) : (
        <MainLayout>
          <Routes>
            {user.proveedor_id ? (
              <>
                <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
                <Route path="*" element={<Navigate to="/supplier/dashboard" />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/farmacias" element={<Farmacias />} />
                <Route path="/inventarios" element={<Inventarios />} />
                <Route path="/lista-comparativa" element={<ListaComparativa />} />
                <Route path="/proveedores" element={<Proveedores />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            )}
          </Routes>
        </MainLayout>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;