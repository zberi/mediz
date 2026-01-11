import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Truck, Clock, Heart, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search/SearchBar';
import { CategoryGrid } from '@/components/categories/CategoryGrid';
import { MedicineCard } from '@/components/medicines/MedicineCard';
import { medicines } from '@/data/medicines';
import { useApp } from '@/context/AppContext';
import { useChat } from '@/context/ChatContext';
import { cn } from '@/lib/utils';

const Index = () => {
  const { seniorMode } = useApp();
  const { openChat } = useChat();
  const featuredMedicines = medicines.slice(0, 4);
  const discountedMedicines = medicines.filter(m => m.originalPrice).slice(0, 4);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Hero Section */}
      <section className="gradient-hero pt-8 pb-12 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles size={16} />
            <span>Free delivery on orders above Rs. 500</span>
          </div>
          
          <h1 className={cn(
            "font-display font-bold text-foreground mb-4 animate-slide-up",
            seniorMode ? "text-4xl md:text-5xl" : "text-3xl md:text-5xl"
          )}>
            Your Health,{' '}
            <span className="text-primary">Delivered</span>
            <br />
            with Care
          </h1>
          
          <p className={cn(
            "text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up",
            seniorMode ? "text-xl" : "text-lg"
          )} style={{ animationDelay: '100ms' }}>
            Order medicines easily, get them delivered fast. 
            Trusted by thousands of families across Pakistan.
          </p>

          <div className="max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 px-4 border-b border-border bg-card">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Shield, label: 'Authentic Medicines', desc: '100% verified' },
              { icon: Truck, label: 'Fast Delivery', desc: 'Same day available' },
              { icon: Clock, label: 'Easy Returns', desc: '7 day policy' },
              { icon: Heart, label: 'Senior Friendly', desc: 'Accessible design' },
            ].map(({ icon: Icon, label, desc }, index) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl bg-secondary/50 animate-fade-in",
                  seniorMode && "p-5"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <p className={cn(
                    "font-semibold text-foreground",
                    seniorMode && "text-lg"
                  )}>
                    {label}
                  </p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 px-4">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={cn(
                "font-bold text-foreground",
                seniorMode ? "text-2xl" : "text-xl"
              )}>
                Shop by Category
              </h2>
              <p className="text-muted-foreground mt-1">Find what you need quickly</p>
            </div>
            <Link to="/medicines">
              <Button variant="ghost" className="gap-1">
                View All <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* Featured Medicines */}
      <section className="py-10 px-4 bg-secondary/30">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={cn(
                "font-bold text-foreground",
                seniorMode ? "text-2xl" : "text-xl"
              )}>
                Popular Medicines
              </h2>
              <p className="text-muted-foreground mt-1">Frequently ordered by customers</p>
            </div>
            <Link to="/medicines">
              <Button variant="ghost" className="gap-1">
                View All <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredMedicines.map((medicine, index) => (
              <div key={medicine.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <MedicineCard medicine={medicine} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers */}
      {discountedMedicines.length > 0 && (
        <section className="py-10 px-4">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Star size={20} className="text-accent-foreground" />
                </div>
                <div>
                  <h2 className={cn(
                    "font-bold text-foreground",
                    seniorMode ? "text-2xl" : "text-xl"
                  )}>
                    Special Offers
                  </h2>
                  <p className="text-muted-foreground">Save on your essentials</p>
                </div>
              </div>
              <Link to="/medicines?filter=offers">
                <Button variant="ghost" className="gap-1">
                  View All <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {discountedMedicines.map((medicine, index) => (
                <div key={medicine.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <MedicineCard medicine={medicine} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-10 px-4">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 md:p-12">
            <div className="relative z-10 max-w-lg">
              <h3 className={cn(
                "font-bold text-primary-foreground mb-3",
                seniorMode ? "text-3xl" : "text-2xl"
              )}>
                Need Help Finding Medicine?
              </h3>
              <p className={cn(
                "text-primary-foreground/90 mb-6",
                seniorMode && "text-lg"
              )}>
                Our pharmacists are available 24/7 to assist you with your health needs. Get expert advice now.
              </p>
              <Button variant="secondary" size="lg" className="gap-2" onClick={openChat}>
                Chat with Pharmacist
                <ArrowRight size={18} />
              </Button>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary-foreground/10 to-transparent" />
          </div>
        </div>
      </section>

      {/* Listings Counter */}
      <section className="py-6 px-4 border-t border-border bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className={cn("font-semibold text-primary", seniorMode && "text-lg")}>
              {medicines.length}
            </span>
            <span className={seniorMode ? "text-base" : "text-sm"}>
              Pakistani licensed medicines available
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
