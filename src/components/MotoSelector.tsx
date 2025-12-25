import { useState } from 'react';
import { Bike, ChevronDown, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMoto } from '@/contexts/MotoContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function MotoSelector() {
  const { motorcycles, currentMoto, setCurrentMoto } = useMoto();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (motorcycles.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => navigate('/profile')}
      >
        <Plus className="w-4 h-4" />
        Aggiungi Moto
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 max-w-[180px]"
        >
          <Bike className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="truncate">
            {currentMoto ? currentMoto.name : 'Seleziona Moto'}
          </span>
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {motorcycles.map((moto) => (
            <button
              key={moto.id}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                moto.id === currentMoto?.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary'
              )}
              onClick={() => {
                setCurrentMoto(moto.id);
                setIsOpen(false);
              }}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                moto.id === currentMoto?.id ? 'bg-primary/20' : 'bg-secondary'
              )}>
                <Bike className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{moto.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {moto.brand} {moto.model}
                </p>
              </div>
              {moto.id === currentMoto?.id && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
        <div className="border-t border-border mt-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              setIsOpen(false);
              navigate('/profile?new=true');
            }}
          >
            <Plus className="w-4 h-4" />
            Aggiungi Nuova Moto
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}