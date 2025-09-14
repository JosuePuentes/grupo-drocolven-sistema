import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, ServerCrash, Truck, Edit, X } from 'lucide-react';

const Button = ({ children, ...props }) => (
    <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-9 px-3 text-sm" {...props}>
      {children}
    </button>
);

const Input = (props) => (
  <input className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...props} />
);

const SupplierDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editedItems, setEditedItems] = useState([]);

  const fetchOrders = async () => {
    if (!user || !user.proveedor_id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/supplier/${user.proveedor_id}`);
      if (!response.ok) throw new Error('Error al cargar las órdenes');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo actualizar el estado');
        alert('Estado actualizado con éxito');
        fetchOrders(); // Refresh orders
    } catch (err) {
        alert(err.message);
    }
  }

  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditedItems(order.items.map(item => ({ ...item }))); // Deep copy items
    setShowEditModal(true);
  };

  const handleItemQuantityChange = (index, newQuantity) => {
    const updatedItems = [...editedItems];
    updatedItems[index].quantity = parseInt(newQuantity) || 0;
    setEditedItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = editedItems.filter((_, i) => i !== index);
    setEditedItems(updatedItems);
  };

  const handleSaveChanges = async () => {
    if (!editingOrder) return;

    try {
      const response = await fetch(`/api/orders/${editingOrder._id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editedItems })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Pedido actualizado exitosamente!');
        setShowEditModal(false);
        fetchOrders(); // Refresh orders
      } else {
        alert(`Error al guardar cambios: ${result.error}`);
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Error de conexión al guardar cambios.');
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value);
  const formatDate = (dateString) => new Date(dateString).toLocaleString('es-ES');

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>;
  }

  if (error) {
    return (
        <div className="text-center p-10 bg-red-50 rounded-lg m-6">
            <ServerCrash className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-lg font-medium text-red-800">Error al cargar datos</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de Proveedor</h1>
        <p className="text-gray-600">Gestiona los pedidos recibidos de las farmacias.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b"><h2 className="text-lg font-semibold">Pedidos Recibidos</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmacia ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(order.order_date)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-mono">{order.pharmacy_id}</td>
                  <td className="px-4 py-4 text-sm">
                    <ul className="list-disc list-inside">
                        {order.items.map(item => (
                            <li key={item.codigo}>{item.quantity} x {item.descripcion}</li>
                        ))}
                    </ul>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${order.status === 'in-transit' ? 'bg-blue-100 text-blue-800' : ''}
                        ${order.status === 'received' ? 'bg-green-100 text-green-800' : ''}`}>
                        {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {order.status === 'pending' && (
                        <div className="flex gap-2">
                            <Button onClick={() => openEditModal(order)} variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200">
                                <Edit className="mr-2 h-4 w-4"/>
                                Modificar Pedido
                            </Button>
                            <Button onClick={() => handleUpdateStatus(order._id, 'in-transit')}>
                                <Truck className="mr-2 h-4 w-4"/>
                                Marcar en Tránsito
                            </Button>
                        </div>
                    )}
                    {order.status === 'in-transit' && (
                        <Button onClick={() => handleUpdateStatus(order._id, 'received')}>
                            <Truck className="mr-2 h-4 w-4"/>
                            Marcar como Recibido
                        </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Modificar Pedido #{editingOrder._id}</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {editedItems.length === 0 ? (
                <p className="text-gray-500">No hay ítems en este pedido.</p>
              ) : (
                editedItems.map((item, index) => (
                  <div key={item.codigo} className="flex items-center gap-4 border-b pb-2">
                    <div className="flex-grow">
                      <p className="font-medium">{item.descripcion}</p>
                      <p className="text-sm text-gray-600">Código: {item.codigo} | Precio: {formatCurrency(item.price)}</p>
                    </div>
                    <Input 
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                      className="w-24 text-center"
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(index)}>
                      <X className="h-4 w-4"/>
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
              <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDashboard;
