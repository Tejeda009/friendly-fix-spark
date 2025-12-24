import { useState } from 'react';
import { Cog, Plus } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PartRecord, PART_CATEGORIES, PartCategory } from '@/types/moto';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function PartsPage() {
  const { value: records, setValue: setRecords, deleteItem } = useLocalStorage<PartRecord[]>('moto-parts', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PartRecord | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as PartCategory,
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    price: '',
    installDate: '',
    brand: '',
    partNumber: '',
    warranty: '',
    notes: '',
  });

  // Calculate statistics
  const totalCost = records.reduce((sum, r) => sum + r.price, 0);
  const thisYearCost = records
    .filter(r => parseISO(r.purchaseDate).getFullYear() === new Date().getFullYear())
    .reduce((sum, r) => sum + r.price, 0);
  const categoryCounts = records.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price);

    if (isNaN(price) || !formData.name.trim()) {
      toast.error('Inserisci valori validi');
      return;
    }

    const newRecord: PartRecord = {
      id: editingRecord?.id || generateId(),
      name: formData.name.trim(),
      category: formData.category,
      purchaseDate: formData.purchaseDate,
      price,
      installDate: formData.installDate || undefined,
      brand: formData.brand || undefined,
      partNumber: formData.partNumber || undefined,
      warranty: formData.warranty || undefined,
      notes: formData.notes || undefined,
    };

    if (editingRecord) {
      setRecords(records.map(r => r.id === editingRecord.id ? newRecord : r));
      toast.success('Ricambio aggiornato');
    } else {
      setRecords([newRecord, ...records]);
      toast.success('Ricambio aggiunto');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      price: '',
      installDate: '',
      brand: '',
      partNumber: '',
      warranty: '',
      notes: '',
    });
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: PartRecord) => {
    setFormData({
      name: record.name,
      category: record.category,
      purchaseDate: record.purchaseDate,
      price: record.price.toString(),
      installDate: record.installDate || '',
      brand: record.brand || '',
      partNumber: record.partNumber || '',
      warranty: record.warranty || '',
      notes: record.notes || '',
    });
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success('Ricambio eliminato');
  };

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (r: PartRecord) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (r: PartRecord) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
          {PART_CATEGORIES[r.category]}
        </span>
      ),
    },
    {
      key: 'brand',
      header: 'Marca',
      render: (r: PartRecord) => r.brand || '-',
    },
    {
      key: 'purchaseDate',
      header: 'Acquistato',
      render: (r: PartRecord) => format(parseISO(r.purchaseDate), 'd MMM yyyy', { locale: it }),
    },
    {
      key: 'price',
      header: 'Prezzo',
      render: (r: PartRecord) => <span className="font-bold text-primary">€{r.price.toFixed(2)}</span>,
    },
    {
      key: 'warranty',
      header: 'Garanzia',
      render: (r: PartRecord) => r.warranty || '-',
    },
  ];

  return (
    <Layout>
      <PageHeader 
        title="Ricambi" 
        description="Gestisci i ricambi acquistati"
        icon={Cog}
        action={{
          label: 'Nuovo Ricambio',
          onClick: () => setIsDialogOpen(true),
          icon: Plus,
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Totale Speso"
          value={`€${totalCost.toFixed(0)}`}
          icon={Cog}
          variant="primary"
        />
        <StatCard
          title="Quest'Anno"
          value={`€${thisYearCost.toFixed(0)}`}
          icon={Cog}
        />
        <StatCard
          title="Totale Ricambi"
          value={records.length}
          icon={Cog}
        />
        <StatCard
          title="Categoria Top"
          value={topCategory ? PART_CATEGORIES[topCategory[0] as PartCategory] : '-'}
          subtitle={topCategory ? `${topCategory[1]} ricambi` : ''}
          icon={Cog}
          variant="accent"
        />
      </div>

      {/* Data Table */}
      <DataTable
        data={records.sort((a, b) => parseISO(b.purchaseDate).getTime() - parseISO(a.purchaseDate).getTime())}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Nessun ricambio registrato. Aggiungi il tuo primo ricambio!"
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingRecord ? 'Modifica Ricambio' : 'Nuovo Ricambio'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Ricambio</Label>
              <Input
                id="name"
                placeholder="es. Filtro olio"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-glow"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v as PartCategory })}
                >
                  <SelectTrigger className="input-glow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PART_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  placeholder="es. HiFlo"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="input-glow"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Data Acquisto</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prezzo (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installDate">Data Installazione</Label>
                <Input
                  id="installDate"
                  type="date"
                  value={formData.installDate}
                  onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                  className="input-glow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partNumber">Codice Ricambio</Label>
                <Input
                  id="partNumber"
                  placeholder="es. HF303"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  className="input-glow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty">Garanzia</Label>
              <Input
                id="warranty"
                placeholder="es. 2 anni"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                className="input-glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Aggiungi note..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-glow resize-none"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Annulla
              </Button>
              <Button type="submit" className="btn-glow">
                {editingRecord ? 'Aggiorna' : 'Aggiungi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
