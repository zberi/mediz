import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItemCard } from '@/components/cart/CartItem';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const CartPage = () => {
  const { cart, cartTotal, clearCart, seniorMode } = useApp();
  const navigate = useNavigate();

  const deliveryFee = cartTotal >= 500 ? 0 : 99;
  const total = cartTotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={32} className="text-muted-foreground" />
          </div>
          <h2 className={cn(
            "font-bold text-foreground mb-2",
            seniorMode ? "text-2xl" : "text-xl"
          )}>
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6">
            Add medicines to start your order
          </p>
          <Link to="/medicines">
            <Button variant="default" size="lg">
              Browse Medicines
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 md:pb-8">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-card border-b border-border">
        <div className="container flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className={cn(
                "font-bold text-foreground",
                seniorMode ? "text-2xl" : "text-xl"
              )}>
                Your Cart
              </h1>
              <p className="text-sm text-muted-foreground">
                {cart.length} item{cart.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={16} className="mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <div className="container px-4 py-6">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => (
              <CartItemCard key={item.medicine.id} item={item} />
            ))}

            {/* Delivery Info */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground">
                {deliveryFee === 0 ? (
                  <span className="text-success font-medium">✓ You qualify for FREE delivery!</span>
                ) : (
                  <>Add Rs. {500 - cartTotal} more for free delivery</>
                )}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-36">
              <h3 className={cn(
                "font-bold text-foreground mb-4",
                seniorMode && "text-xl"
              )}>
                Order Summary
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>Rs. {cartTotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? "text-success" : ""}>
                    {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className={cn("font-bold text-foreground", seniorMode && "text-lg")}>Total</span>
                  <span className={cn("font-bold text-primary", seniorMode ? "text-2xl" : "text-xl")}>
                    Rs. {total}
                  </span>
                </div>
              </div>

              <Link to="/checkout">
                <Button variant="hero" size="xl" className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>

              <p className="text-xs text-center text-muted-foreground mt-4">
                By placing your order, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-card border-t border-border p-4 z-40">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-foreground">Total</span>
          <span className={cn("font-bold text-primary", seniorMode ? "text-2xl" : "text-xl")}>
            Rs. {total}
          </span>
        </div>
        <Link to="/checkout">
          <Button variant="hero" size="xl" className="w-full">
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CartPage;
