import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/orders/OrderCard';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const OrdersPage = () => {
  const { orders, seniorMode } = useApp();

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-muted-foreground" />
          </div>
          <h2 className={cn("font-bold text-foreground mb-2", seniorMode ? "text-2xl" : "text-xl")}>
            No orders yet
          </h2>
          <p className="text-muted-foreground mb-6">
            When you place an order, it will appear here
          </p>
          <Link to="/medicines">
            <Button variant="default" size="lg" className="gap-2">
              Start Shopping
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="container px-4 py-6">
        <h1 className={cn("font-bold text-foreground mb-6", seniorMode ? "text-2xl" : "text-xl")}>
          My Orders
        </h1>

        <div className="space-y-4">
          {orders.map((order, index) => (
            <Link
              key={order.id}
              to={`/order/${order.id}`}
              className="block animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <OrderCard order={order} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
