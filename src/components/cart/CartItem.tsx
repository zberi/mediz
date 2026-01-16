import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export function CartItemCard({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart, seniorMode } = useApp();
  const { medicine, quantity } = item;

  return (
    <div className={cn(
      "flex gap-4 p-4 bg-card rounded-xl border border-border",
      seniorMode && "p-5"
    )}>
      <img
        src={medicine.image}
        alt={medicine.name}
        className={cn(
          "w-20 h-20 rounded-lg object-cover",
          seniorMode && "w-24 h-24"
        )}
      />
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-semibold text-foreground line-clamp-1",
          seniorMode && "text-lg"
        )}>
          {medicine.name}
        </h3>
        <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
        {medicine.packSize && (
          <p className="text-xs text-muted-foreground">{medicine.packSize}</p>
        )}
        <p className={cn(
          "text-primary font-bold mt-1",
          seniorMode && "text-lg"
        )}>
          Rs. {medicine.price * quantity}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeFromCart(medicine.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={18} />
        </Button>

        <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateQuantity(medicine.id, quantity - 1)}
            className="h-8 w-8"
          >
            <Minus size={16} />
          </Button>
          <span className={cn(
            "w-8 text-center font-semibold",
            seniorMode && "text-lg w-10"
          )}>
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateQuantity(medicine.id, quantity + 1)}
            disabled={quantity >= medicine.stockQuantity}
            className="h-8 w-8"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
