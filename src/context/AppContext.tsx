import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, User, Address, Order } from '@/types';

interface AppContextType {
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (medicineId: string) => void;
  updateQuantity: (medicineId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // User
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;

  // Accessibility
  seniorMode: boolean;
  toggleSeniorMode: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;

  // Addresses
  addresses: Address[];
  addAddress: (address: Address) => void;
  setDefaultAddress: (addressId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [seniorMode, setSeniorMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 'addr-1',
      label: 'Home',
      fullAddress: '123 Main Street, Block F, Gulberg III',
      city: 'Lahore',
      postalCode: '54000',
      isDefault: true,
    },
  ]);

  // Load preferences from localStorage
  useEffect(() => {
    const savedSeniorMode = localStorage.getItem('seniorMode') === 'true';
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedCart = localStorage.getItem('cart');

    setSeniorMode(savedSeniorMode);
    setHighContrast(savedHighContrast);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Apply accessibility classes
  useEffect(() => {
    const body = document.body;
    if (seniorMode) {
      body.classList.add('senior-mode');
    } else {
      body.classList.remove('senior-mode');
    }
    if (highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
  }, [seniorMode, highContrast]);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.medicine.id === item.medicine.id);
      if (existing) {
        return prev.map(i =>
          i.medicine.id === item.medicine.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prev => prev.filter(i => i.medicine.id !== medicineId));
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(medicineId);
      return;
    }
    setCart(prev =>
      prev.map(i =>
        i.medicine.id === medicineId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.medicine.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleSeniorMode = () => {
    setSeniorMode(prev => {
      localStorage.setItem('seniorMode', String(!prev));
      return !prev;
    });
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => {
      localStorage.setItem('highContrast', String(!prev));
      return !prev;
    });
  };

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const addAddress = (address: Address) => {
    setAddresses(prev => [...prev, address]);
  };

  const setDefaultAddress = (addressId: string) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))
    );
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        user,
        setUser,
        isAuthenticated: !!user,
        seniorMode,
        toggleSeniorMode,
        highContrast,
        toggleHighContrast,
        orders,
        addOrder,
        addresses,
        addAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
