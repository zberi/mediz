import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { MedicineCard } from '@/components/medicines/MedicineCard';
import { Button } from '@/components/ui/button';
import { QuickOrderBanner } from '@/components/quick-order/QuickOrderBanner';
import { medicines, categories, searchMedicines, getMedicinesByCategory } from '@/data/medicines';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const MedicinesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { seniorMode } = useApp();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';

  const filteredMedicines = useMemo(() => {
    let result = medicines;

    // Apply search
    if (searchQuery) {
      result = searchMedicines(searchQuery);
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter(m => m.category === categoryFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'name':
      default:
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [searchQuery, categoryFilter, sortBy]);

  const handleSearch = (query: string) => {
    setSearchParams(prev => {
      if (query) {
        prev.set('search', query);
      } else {
        prev.delete('search');
      }
      return prev;
    });
  };

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams(prev => {
      if (categoryId === categoryFilter) {
        prev.delete('category');
      } else {
        prev.set('category', categoryId);
      }
      prev.delete('search');
      return prev;
    });
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Quick Order Banner */}
      <QuickOrderBanner />

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="container py-4 px-4">
          <div className="flex flex-col gap-4">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search medicines..."
            />

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors",
                    categoryFilter === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {filteredMedicines.length} results
                </p>
                {(searchQuery || categoryFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-primary"
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-10 px-3 rounded-lg bg-secondary text-sm font-medium border-0 focus:ring-2 focus:ring-primary"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                <div className="hidden md:flex items-center bg-secondary rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8"
                  >
                    <Grid size={16} />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8"
                  >
                    <List size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container py-6 px-4">
        {filteredMedicines.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Filter size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No medicines found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedicines.map((medicine, index) => (
              <div
                key={medicine.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MedicineCard medicine={medicine} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMedicines.map((medicine, index) => (
              <div
                key={medicine.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MedicineCard medicine={medicine} variant="compact" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicinesPage;
