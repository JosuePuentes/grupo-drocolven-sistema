import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (product) => {
        setCartItems(prevItems => {
            // Check if product is already in cart
            const existingItem = prevItems.find(item => 
                item.codigo === product.codigo && item.proveedor_id === product.proveedor_id
            );

            if (existingItem) {
                // If it exists, update the quantity
                return prevItems.map(item => 
                    item.codigo === product.codigo && item.proveedor_id === product.proveedor_id
                        ? { ...item, quantity: item.quantity + product.quantity }
                        : item
                );
            } else {
                // If it's a new item, add it to the cart
                return [...prevItems, product];
            }
        });
    };

    const removeFromCart = (product_codigo) => {
        setCartItems(prevItems => prevItems.filter(item => item.codigo !== product_codigo));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount: cartItems.reduce((acc, item) => acc + item.quantity, 0)
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
