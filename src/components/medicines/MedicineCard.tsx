import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, ShoppingCart, FileText, Package } from 'lucide-react';
import { Medicine } from '@/types';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface MedicineCardProps {
  medicine: Medicine;
  variant?: 'default' | 'compact';
}

export function MedicineCard({ medicine, variant = 'default' }: MedicineCardProps) {
  const { addToCart, seniorMode } = useApp();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!medicine.inStock) {
      toast({
        title: "Out of Stock",
        description: `${medicine.name} is currently unavailable.`,
        variant: "destructive",
      });
      return;
    }

    const quantity = medicine.defaultQuantity || 1;
    addToCart({ medicine, quantity });
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${medicine.name} has been added to your cart.`,
    });
  };

  const discount = medicine.originalPrice
    ? Math.round(((medicine.originalPrice - medicine.price) / medicine.originalPrice) * 100)
    : 0;

  if (variant === 'compact') {
    return (
      <Link
        to={`/medicine/${medicine.id}`}
        className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-300"
      >
        <img
          src={medicine.image}
          alt={medicine.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{medicine.name}</h3>
          <p className="text-sm text-muted-foreground">{medicine.genericName}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-primary font-bold">Rs. {medicine.price}</p>
            {medicine.packSize && (
              <span className="text-xs text-muted-foreground">• {medicine.packSize}</span>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleAddToCart}
          disabled={!medicine.inStock}
        >
          <Plus size={20} />
        </Button>
      </Link>
    );
  }

  return (
    <Link
      to={`/medicine/${medicine.id}`}
      className={cn(
        "group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-card-hover transition-all duration-300",
        !medicine.inStock && "opacity-75"
      )}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={medicine.image}
          alt={medicine.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-lg">
            {discount}% OFF
          </span>
        )}
        {medicine.requiresPrescription && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-warning/90 text-warning-foreground text-xs font-bold rounded-lg flex items-center gap-1">
            <AlertTriangle size={12} />
            Rx
          </span>
        )}
        {!medicine.inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-bold rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className={cn("flex flex-col flex-1 p-4", seniorMode && "p-5")}>
        <h3 className={cn(
          "font-semibold text-foreground line-clamp-2 mb-1",
          seniorMode ? "text-lg" : "text-base"
        )}>
          {medicine.name}
        </h3>
        <p className={cn(
          "text-muted-foreground mb-1 line-clamp-1",
          seniorMode ? "text-base" : "text-sm"
        )}>
          {medicine.genericName}
        </p>
        <p className="text-xs text-muted-foreground">{medicine.dosage}</p>
        
        {/* Pack info and leaflet indicator */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {medicine.packSize && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              <Package size={10} />
              {medicine.packSize}
            </span>
          )}
          {medicine.tabletCount && !medicine.packSize && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              <Package size={10} />
              {medicine.tabletCount} tablets
            </span>
          )}
          {medicine.leafletIncluded && (
            <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
              <FileText size={10} />
              Leaflet
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className={cn(
              "font-bold text-primary",
              seniorMode ? "text-xl" : "text-lg"
            )}>
              Rs. {medicine.price}
            </span>
            {medicine.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                Rs. {medicine.originalPrice}
              </span>
            )}
          </div>
          <Button
            variant="default"
            size={seniorMode ? "lg" : "default"}
            onClick={handleAddToCart}
            disabled={!medicine.inStock}
            className="gap-2"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
