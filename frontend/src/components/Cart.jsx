import React, { useState } from 'react';
import { ShoppingCart, X, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Button = ({ children, ...props }) => (
    <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4" {...props}>
      {children}
    </button>
);

const Cart = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const { cartItems, removeFromCart, clearCart, cartCount } = useCart();

    const total = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cartItems)
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || 'Pedido realizado con éxito!');
                clearCart();
                setIsOpen(false);
            } else {
                throw new Error(result.error || 'Error al realizar el pedido');
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setIsPlacingOrder(false);
        }
    };

    return (
        <>
            {/* Floating Cart Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
                >
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Cart Sidebar */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsOpen(false)}></div>
            )}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h2 className="text-lg font-semibold">Carrito de Compras</h2>
                        <button onClick={() => setIsOpen(false)}><X size={24} /></button>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-gray-500">Tu carrito está vacío.</p>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-y-auto p-4 space-y-3">
                            {cartItems.map(item => (
                                <div key={`${item.codigo}-${item.proveedor_id}`} className="flex items-center gap-3 border-b pb-3">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.descripcion}</p>
                                        <p className="text-sm text-gray-500">{item.proveedor_nombre}</p>
                                        <p className="text-sm font-bold">{item.quantity} x {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(item.price)}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.codigo)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {cartItems.length > 0 && (
                        <div className="p-4 border-t bg-gray-50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-semibold">Total:</span>
                                <span className="text-xl font-bold">{new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(total)}</span>
                            </div>
                            <Button 
                                className="w-full"
                                onClick={handlePlaceOrder}
                                disabled={isPlacingOrder}
                            >
                                {isPlacingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isPlacingOrder ? 'Procesando Pedido...' : 'Enviar Pedido'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Cart;
