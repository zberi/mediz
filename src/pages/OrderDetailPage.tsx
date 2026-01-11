import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, MessageCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusTracker } from '@/components/orders/OrderCard';
import { useApp } from '@/context/AppContext';
import { useChat } from '@/context/ChatContext';
import { cn } from '@/lib/utils';

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { orders, seniorMode } = useApp();
  const { openChat } = useChat();

  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <p className="text-muted-foreground mb-4">This order may have been cancelled or doesn't exist.</p>
          <Link to="/orders">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-card border-b border-border">
        <div className="container flex items-center gap-4 py-4 px-4">
          <Link to="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className={cn("font-bold text-foreground", seniorMode ? "text-xl" : "text-lg")}>
              Order #{order.id.slice(-8)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6">
        {/* Order Status */}
        <section className="bg-card rounded-2xl border border-border p-6">
          <h2 className={cn("font-bold text-foreground mb-2", seniorMode && "text-xl")}>
            Order Status
          </h2>
          <OrderStatusTracker status={order.status} />
          
          {order.status === 'out_for_delivery' && (
            <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20">
              <p className={cn("text-accent font-medium mb-2", seniorMode && "text-lg")}>
                🚴 Your order is on the way!
              </p>
              <p className="text-sm text-muted-foreground">
                Estimated arrival: {order.estimatedDelivery?.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </section>

        {/* Delivery Address */}
        <section className="bg-card rounded-2xl border border-border p-6">
          <h2 className={cn("font-bold text-foreground mb-4 flex items-center gap-2", seniorMode && "text-xl")}>
            <MapPin size={20} className="text-primary" />
            Delivery Address
          </h2>
          <div className="p-4 rounded-xl bg-secondary">
            <p className={cn("font-semibold text-foreground", seniorMode && "text-lg")}>{order.address.label}</p>
            <p className="text-muted-foreground">{order.address.fullAddress}</p>
            <p className="text-sm text-muted-foreground">{order.address.city}, {order.address.postalCode}</p>
          </div>
        </section>

        {/* Order Items */}
        <section className="bg-card rounded-2xl border border-border p-6">
          <h2 className={cn("font-bold text-foreground mb-4", seniorMode && "text-xl")}>
            Order Items ({itemCount})
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.medicine.id} className="flex items-center gap-4">
                <img
                  src={item.medicine.image}
                  alt={item.medicine.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-medium text-foreground truncate", seniorMode && "text-lg")}>
                    {item.medicine.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.medicine.dosage}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className={cn("font-semibold text-foreground", seniorMode && "text-lg")}>
                  Rs. {item.medicine.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Summary */}
        <section className="bg-card rounded-2xl border border-border p-6">
          <h2 className={cn("font-bold text-foreground mb-4", seniorMode && "text-xl")}>
            Payment Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>Rs. {order.totalAmount - order.deliveryFee + order.discount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span className={order.deliveryFee === 0 ? "text-success" : ""}>
                {order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-Rs. {order.discount}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between">
              <span className={cn("font-bold text-foreground", seniorMode && "text-lg")}>Total</span>
              <span className={cn("font-bold text-primary", seniorMode ? "text-2xl" : "text-xl")}>
                Rs. {order.totalAmount}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground pt-2">
              <span>Payment Method</span>
              <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-card rounded-2xl border border-border p-6">
          <h2 className={cn("font-bold text-foreground mb-4", seniorMode && "text-xl")}>
            Need Help?
          </h2>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2">
              <Phone size={18} />
              Call Support
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={openChat}>
              <MessageCircle size={18} />
              Chat with Us
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrderDetailPage;
