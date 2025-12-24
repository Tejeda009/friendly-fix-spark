import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  children?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action, children }: PageHeaderProps) {
  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Icon className="w-7 h-7 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold glow-text">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {children}
          {action && (
            <Button 
              onClick={action.onClick}
              className="btn-glow gap-2"
            >
              {action.icon ? <action.icon className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
