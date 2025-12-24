import { ReactNode } from 'react';
import { Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  onDelete?: (id: string) => void;
  onEdit?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  onDelete, 
  onEdit,
  emptyMessage = 'Nessun dato disponibile'
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={String(col.key)} className={col.className}>
                {col.header}
              </TableHead>
            ))}
            {(onEdit || onDelete) && (
              <TableHead className="w-24 text-right">Azioni</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow 
              key={item.id} 
              className="border-border hover:bg-secondary/50 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {columns.map((col) => (
                <TableCell key={String(col.key)} className={col.className}>
                  {col.render 
                    ? col.render(item) 
                    : String(item[col.key as keyof T] ?? '-')
                  }
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onEdit(item)}
                        className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler eliminare questo elemento? Questa azione non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
