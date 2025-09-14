import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, ServerCrash, CheckCircle, Package, Upload } from 'lucide-react';

const Button = ({ children, ...props }) => (
    <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-9 px-3 text-sm" {...props}>
      {children}
    </button>
);

const PedidosEnTransito = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);

  // NOTE: The backend needs a way to identify the pharmacy.
  // Using user._id as a placeholder for pharmacy_id.
  const pharmacyId = user ? user.id : null;

  const fetchOrders = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/pharmacy/${pharmacyId}`);
      if (!response.ok) throw new Error('Error al cargar los pedidos');
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

  const openReceiveModal = (order) => {
    setReceivingOrder(order);
    setDeliveryPhoto(null);
    setShowReceiveModal(true);
  };

  const handleReceiveOrder = async () => {
    if (!deliveryPhoto || !receivingOrder) return;

    const formData = new FormData();
    formData.append('file', deliveryPhoto);

    try {
        const response = await fetch(`/api/orders/${receivingOrder._id}/receive`, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudo actualizar el pedido');
        alert('Pedido marcado como Recibido!');
        setShowReceiveModal(false);
        fetchOrders();
    } catch (err) {
        alert(err.message);
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
            <h3 className="mt-2 text-lg font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Pedidos</h1>
        <p className="text-gray-600">Rastrea el estado de todos tus pedidos a proveedores.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(order.order_date)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-mono">{order.supplier_id}</td>
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
                    {order.status === 'in-transit' && (
                        <Button onClick={() => openReceiveModal(order)}>
                            <CheckCircle className="mr-2 h-4 w-4"/>
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

      {showReceiveModal && receivingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Recibir Pedido</h3>
            <p className="text-sm text-gray-600 mb-4">Confirma la recepción del pedido de <span className="font-bold">Proveedor ID: {receivingOrder.supplier_id}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntar Foto de Entrega</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setDeliveryPhoto(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="flex justify-end gap-3 pt-6">
              <Button variant="outline" onClick={() => setShowReceiveModal(false)}>Cancelar</Button>
              <Button onClick={handleReceiveOrder} disabled={!deliveryPhoto}>Confirmar Recepción</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosEnTransito;
