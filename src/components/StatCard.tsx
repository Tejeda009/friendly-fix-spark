import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'warning';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border hover:border-primary/50',
    primary: 'border-primary/30 bg-primary/5',
    accent: 'border-accent/30 bg-accent/5',
    warning: 'border-warning/30 bg-warning/5',
  };

  const iconStyles = {
    default: 'bg-secondary text-foreground',
    primary: 'bg-primary/20 text-primary',
    accent: 'bg-accent/20 text-accent',
    warning: 'bg-warning/20 text-warning',
  };

  return (
    <div className={cn(
      'stat-card animate-scale-in',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={cn(
            'text-sm font-medium px-2 py-1 rounded-full',
            trend.isPositive 
              ? 'bg-success/20 text-success' 
              : 'bg-destructive/20 text-destructive'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      
      <h3 className="text-sm text-muted-foreground mb-1">{title}</h3>
      <p className="font-display text-3xl font-bold mb-1">{value}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
