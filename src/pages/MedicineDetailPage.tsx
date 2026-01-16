import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, AlertTriangle, Check, Volume2, Package, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMedicineById, medicines } from '@/data/medicines';
import { MedicineCard } from '@/components/medicines/MedicineCard';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MedicineDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, seniorMode } = useApp();
  
  const medicine = getMedicineById(id || '');
  const [quantity, setQuantity] = useState(medicine?.defaultQuantity || 1);

  if (!medicine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Medicine not found</h2>
          <Button onClick={() => navigate('/medicines')}>Browse Medicines</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({ medicine, quantity });
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${medicine.name} has been added to your cart.`,
    });
  };

  const handleReadAloud = () => {
    if ('speechSynthesis' in window) {
      const packInfo = medicine.packSize ? ` Pack size: ${medicine.packSize}.` : '';
      const text = `${medicine.name}. ${medicine.description}. Price: ${medicine.price} rupees. Dosage: ${medicine.dosage}.${packInfo}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const discount = medicine.originalPrice
    ? Math.round(((medicine.originalPrice - medicine.price) / medicine.originalPrice) * 100)
    : 0;

  const relatedMedicines = medicines
    .filter(m => m.category === medicine.category && m.id !== medicine.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen pb-32 md:pb-8">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-card border-b border-border">
        <div className="container flex items-center gap-4 py-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-semibold text-foreground truncate">{medicine.name}</h1>
          {seniorMode && (
            <Button
              variant="secondary"
              size="icon"
              onClick={handleReadAloud}
              className="ml-auto"
              title="Read aloud"
            >
              <Volume2 size={20} />
            </Button>
          )}
        </div>
      </div>

      <div className="container px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            <img
              src={medicine.image}
              alt={medicine.name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1.5 bg-accent text-accent-foreground text-sm font-bold rounded-lg">
                {discount}% OFF
              </span>
            )}
            {medicine.requiresPrescription && (
              <span className="absolute top-4 right-4 px-3 py-1.5 bg-warning text-warning-foreground text-sm font-bold rounded-lg flex items-center gap-1">
                <AlertTriangle size={14} />
                Prescription Required
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className={cn(
              "font-bold text-foreground mb-2",
              seniorMode ? "text-3xl" : "text-2xl"
            )}>
              {medicine.name}
            </h1>
            <p className={cn(
              "text-primary font-medium mb-4",
              seniorMode && "text-lg"
            )}>
              {medicine.genericName}
            </p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className={cn(
                "font-bold text-primary",
                seniorMode ? "text-4xl" : "text-3xl"
              )}>
                Rs. {medicine.price}
              </span>
              {medicine.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  Rs. {medicine.originalPrice}
                </span>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24">Dosage:</span>
                <span className={cn("font-medium", seniorMode && "text-lg")}>{medicine.dosage}</span>
              </div>
              {medicine.packSize && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-24">Pack Size:</span>
                  <span className={cn("font-medium flex items-center gap-2", seniorMode && "text-lg")}>
                    <Package size={16} className="text-muted-foreground" />
                    {medicine.packSize}
                    {medicine.tabletCount && ` (${medicine.tabletCount} tablets)`}
                  </span>
                </div>
              )}
              {!medicine.packSize && medicine.tabletCount && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-24">Quantity:</span>
                  <span className={cn("font-medium flex items-center gap-2", seniorMode && "text-lg")}>
                    <Package size={16} className="text-muted-foreground" />
                    {medicine.tabletCount} tablets/capsules
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24">Manufacturer:</span>
                <span className={cn("font-medium", seniorMode && "text-lg")}>{medicine.manufacturer}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24">Availability:</span>
                <span className={cn(
                  "flex items-center gap-1 font-medium",
                  medicine.inStock ? "text-success" : "text-destructive",
                  seniorMode && "text-lg"
                )}>
                  {medicine.inStock ? (
                    <>
                      <Check size={16} /> In Stock ({medicine.stockQuantity} available)
                    </>
                  ) : (
                    'Out of Stock'
                  )}
                </span>
              </div>
              {medicine.leafletIncluded && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-24">Leaflet:</span>
                  <span className={cn("font-medium flex items-center gap-2 text-primary", seniorMode && "text-lg")}>
                    <FileText size={16} />
                    Patient Information Leaflet Included
                  </span>
                </div>
              )}
            </div>

            <p className={cn(
              "text-muted-foreground mb-6 leading-relaxed",
              seniorMode && "text-lg"
            )}>
              {medicine.description}
            </p>

            {medicine.warnings && medicine.warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 mb-6">
                <h4 className="font-semibold text-warning flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} />
                  Warnings
                </h4>
                <ul className="space-y-1">
                  {medicine.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-foreground">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="mt-auto pt-6 border-t border-border">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="h-10 w-10"
                  >
                    <Minus size={18} />
                  </Button>
                  <span className={cn(
                    "w-12 text-center font-bold",
                    seniorMode && "text-xl w-14"
                  )}>
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(q => Math.min(medicine.stockQuantity, q + 1))}
                    disabled={quantity >= medicine.stockQuantity}
                    className="h-10 w-10"
                  >
                    <Plus size={18} />
                  </Button>
                </div>
              </div>

              <Button
                variant="hero"
                size="xl"
                className="w-full gap-3"
                onClick={handleAddToCart}
                disabled={!medicine.inStock}
              >
                <ShoppingCart size={22} />
                Add to Cart - Rs. {medicine.price * quantity}
              </Button>
            </div>
          </div>
        </div>

        {/* Related Medicines */}
        {relatedMedicines.length > 0 && (
          <div className="mt-12">
            <h2 className={cn(
              "font-bold text-foreground mb-6",
              seniorMode ? "text-2xl" : "text-xl"
            )}>
              Related Medicines
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedMedicines.map((med) => (
                <MedicineCard key={med.id} medicine={med} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineDetailPage;
