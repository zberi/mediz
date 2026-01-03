import React from 'react';
import { Link } from 'react-router-dom';
import { categories } from '@/data/medicines';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export function CategoryGrid() {
  const { seniorMode } = useApp();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          to={`/medicines?category=${category.id}`}
          className={cn(
            "group flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-300",
            "animate-slide-up",
            seniorMode && "p-6 md:p-8"
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <span className={cn(
            "text-3xl mb-3 group-hover:scale-110 transition-transform",
            seniorMode && "text-4xl mb-4"
          )}>
            {category.icon}
          </span>
          <h3 className={cn(
            "font-semibold text-foreground text-center text-sm md:text-base",
            seniorMode && "text-base md:text-lg"
          )}>
            {category.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {category.medicineCount} items
          </p>
        </Link>
      ))}
    </div>
  );
}
