import React, { useState } from 'react';
import { Search, Loader2, ServerCrash, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Button = ({ children, ...props }) => (
  <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4" {...props}>
    {children}
  </button>
);
const Input = (props) => (
  <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...props} />
);
const Badge = ({ children, ...props }) => (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" {...props}>
        {children}
    </span>
);

const ListaComparativa = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [quantities, setQuantities] = useState({});
  const { cartItems, clearCart, removeFromCart } = useCart();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const response = await fetch(`/api/lista-comparativa/buscar?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('La respuesta de la red no fue exitosa');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productCode, supplierId, quantity) => {
    const key = `${productCode}-${supplierId}`;
    setQuantities(prev => ({ ...prev, [key]: parseInt(quantity) || 1 }));
  };

  const handleAddToCart = (product, provider) => {
    const key = `${product.codigo}-${provider.proveedor_id}`;
    const quantity = quantities[key] || 1;
    
    // Add a flag to distinguish purchase order items from sales items
    addToCart({
        ...product,
        proveedor_id: provider.proveedor_id,
        proveedor_nombre: provider.proveedor_nombre,
        price: provider.precio_con_descuento_comercial,
        quantity,
        isPurchaseOrderItem: true // Flag to identify this as a purchase order item
    });
    alert(`${quantity} x ${product.descripcion} de ${provider.proveedor_nombre} añadido al carrito de compra.`);
  };

  const procesarPedidoCompra = async () => {
    const purchaseOrderItems = cartItems.filter(item => item.isPurchaseOrderItem);

    if (purchaseOrderItems.length === 0) {
      alert('No hay productos de compra en el carrito para procesar.');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseOrderItems),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Pedido(s) de compra realizado(s) exitosamente! IDs: ${result.order_ids.join(', ')}`);
        // Remove only purchase order items from the cart
        purchaseOrderItems.forEach(item => removeFromCart(item.id));
      } else {
        alert(`Error al procesar el pedido de compra: ${result.error}`);
      }
    } catch (error) {
      console.error('Error procesando pedido de compra:', error);
      alert('Error de conexión al procesar el pedido de compra.');
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(value);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lista Comparativa de Precios</h1>
        <p className="text-gray-600">Busca un producto y compara los precios para añadir al carrito.</p>
      </div>

      <div className="flex w-full max-w-2xl items-center space-x-2 mb-8">
        <Input 
          type="text" 
          placeholder="Buscar por código, descripción o laboratorio..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} 
          Buscar
        </Button>
      </div>

      {cartItems.filter(item => item.isPurchaseOrderItem).length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <p className="text-blue-800 font-medium">
            Hay {cartItems.filter(item => item.isPurchaseOrderItem).length} productos en el carrito de compra.
          </p>
          <Button onClick={procesarPedidoCompra} className="flex items-center gap-2">
            <ShoppingCart size={16} />
            Procesar Pedido de Compra
          </Button>
        </div>
      )}

      <div>
        {loading && <div className="flex justify-center p-10"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>}
        {!loading && error && (
          <div className="text-center p-10 bg-red-50 rounded-lg">
            <ServerCrash className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-lg font-medium text-red-800">Error al realizar la búsqueda</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        )}
        {!loading && !error && searched && results.length === 0 && (
          <div className="text-center p-10 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800">No se encontraron resultados</h3>
            <p className="mt-1 text-sm text-gray-600">Intenta con un término de búsqueda diferente.</p>
          </div>
        )}
        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((product) => (
              <div key={product.codigo} className="bg-white rounded-lg shadow-sm border flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">{product.descripcion}</h3>
                  <p className="text-sm text-gray-500">{product.codigo} - {product.laboratorio}</p>
                </div>
                <div className="p-4 space-y-3 flex-grow">
                  {product.proveedores.map((prov) => {
                      const key = `${product.codigo}-${prov.proveedor_id}`;
                      return (
                        <div key={prov.proveedor_id} className={`p-3 rounded-md ${prov.es_mejor_precio ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-sm text-gray-800 w-2/3">{prov.proveedor_nombre}</p>
                            {prov.es_mejor_precio && <Badge className="bg-green-200 text-green-800">Mejor Precio</Badge>}
                          </div>
                          <div className="text-right mt-1">
                            <p className="font-bold text-lg text-gray-900">{formatCurrency(prov.precio_con_descuento_comercial)}</p>
                            {prov.ahorro_total > 0 && <p className="text-xs text-green-600">Ahorras {formatCurrency(prov.ahorro_total)}</p>}
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-3">
                            <Input 
                                type="number"
                                min="1"
                                defaultValue="1"
                                className="h-8 w-20 text-center"
                                onChange={(e) => handleQuantityChange(product.codigo, prov.proveedor_id, e.target.value)}
                            />
                            <Button size="sm" variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 h-8" onClick={() => handleAddToCart(product, prov)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ListaComparativa;
