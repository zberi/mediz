import React from 'react';
import { Check, Clock, Package, Truck, MapPin, X } from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<OrderStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-warning', label: 'Pending' },
  confirmed: { icon: Check, color: 'text-primary', label: 'Confirmed' },
  preparing: { icon: Package, color: 'text-primary', label: 'Preparing' },
  out_for_delivery: { icon: Truck, color: 'text-accent', label: 'Out for Delivery' },
  delivered: { icon: Check, color: 'text-success', label: 'Delivered' },
  cancelled: { icon: X, color: 'text-destructive', label: 'Cancelled' },
};

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const { icon: StatusIcon, color, label } = statusConfig[order.status];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-card-hover transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground">Order #{order.id.slice(-8)}</p>
          <p className="font-semibold text-foreground">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary", color)}>
          <StatusIcon size={16} />
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex -space-x-2">
          {order.items.slice(0, 3).map((item, index) => (
            <img
              key={item.medicine.id}
              src={item.medicine.image}
              alt={item.medicine.name}
              className="w-10 h-10 rounded-lg border-2 border-card object-cover"
              style={{ zIndex: 3 - index }}
            />
          ))}
          {order.items.length > 3 && (
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground border-2 border-card">
              +{order.items.length - 3}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {itemCount} item{itemCount > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin size={14} />
          <span className="text-sm">{order.address.city}</span>
        </div>
        <p className="font-bold text-primary">Rs. {order.totalAmount}</p>
      </div>
    </div>
  );
}

interface OrderStatusTrackerProps {
  status: OrderStatus;
}

export function OrderStatusTracker({ status }: OrderStatusTrackerProps) {
  const steps: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
  const currentIndex = steps.indexOf(status);

  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-destructive">
        <X size={24} />
        <span className="font-semibold">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted -z-10" />
        <div
          className="absolute top-5 left-0 h-1 bg-primary -z-10 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const { icon: Icon, label } = statusConfig[step];
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/20"
                )}
              >
                <Icon size={20} />
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium text-center",
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
