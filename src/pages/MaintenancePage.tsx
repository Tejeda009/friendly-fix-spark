import { useState } from 'react';
import { Wrench, Plus } from 'lucide-react';
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
import { MaintenanceRecord, MAINTENANCE_TYPES, MaintenanceType } from '@/types/moto';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function MaintenancePage() {
  const { value: records, setValue: setRecords, deleteItem } = useLocalStorage<MaintenanceRecord[]>('moto-maintenance', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'general' as MaintenanceType,
    description: '',
    cost: '',
    odometer: '',
    nextDueOdometer: '',
    nextDueDate: '',
    shop: '',
    notes: '',
  });

  // Calculate statistics
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const thisYearCost = records
    .filter(r => parseISO(r.date).getFullYear() === new Date().getFullYear())
    .reduce((sum, r) => sum + r.cost, 0);
  const avgCostPerIntervention = records.length > 0 ? totalCost / records.length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cost = parseFloat(formData.cost);
    const odometer = parseInt(formData.odometer);

    if (isNaN(cost) || isNaN(odometer) || !formData.description.trim()) {
      toast.error('Inserisci valori validi');
      return;
    }

    const newRecord: MaintenanceRecord = {
      id: editingRecord?.id || generateId(),
      date: formData.date,
      type: formData.type,
      description: formData.description.trim(),
      cost,
      odometer,
      nextDueOdometer: formData.nextDueOdometer ? parseInt(formData.nextDueOdometer) : undefined,
      nextDueDate: formData.nextDueDate || undefined,
      shop: formData.shop || undefined,
      notes: formData.notes || undefined,
    };

    if (editingRecord) {
      setRecords(records.map(r => r.id === editingRecord.id ? newRecord : r));
      toast.success('Manutenzione aggiornata');
    } else {
      setRecords([newRecord, ...records]);
      toast.success('Manutenzione aggiunta');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'general',
      description: '',
      cost: '',
      odometer: '',
      nextDueOdometer: '',
      nextDueDate: '',
      shop: '',
      notes: '',
    });
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setFormData({
      date: record.date,
      type: record.type,
      description: record.description,
      cost: record.cost.toString(),
      odometer: record.odometer.toString(),
      nextDueOdometer: record.nextDueOdometer?.toString() || '',
      nextDueDate: record.nextDueDate || '',
      shop: record.shop || '',
      notes: record.notes || '',
    });
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success('Manutenzione eliminata');
  };

  const columns = [
    {
      key: 'date',
      header: 'Data',
      render: (r: MaintenanceRecord) => format(parseISO(r.date), 'd MMM yyyy', { locale: it }),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (r: MaintenanceRecord) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
          {MAINTENANCE_TYPES[r.type]}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Descrizione',
      render: (r: MaintenanceRecord) => <span className="font-medium">{r.description}</span>,
    },
    {
      key: 'cost',
      header: 'Costo',
      render: (r: MaintenanceRecord) => <span className="font-bold text-primary">€{r.cost.toFixed(2)}</span>,
    },
    {
      key: 'odometer',
      header: 'Km',
      render: (r: MaintenanceRecord) => `${r.odometer.toLocaleString()} km`,
    },
    {
      key: 'nextDue',
      header: 'Prossima',
      render: (r: MaintenanceRecord) => {
        if (r.nextDueDate) {
          return format(parseISO(r.nextDueDate), 'd MMM yyyy', { locale: it });
        }
        if (r.nextDueOdometer) {
          return `${r.nextDueOdometer.toLocaleString()} km`;
        }
        return '-';
      },
    },
  ];

  return (
    <Layout>
      <PageHeader 
        title="Manutenzione" 
        description="Storico interventi e manutenzioni"
        icon={Wrench}
        action={{
          label: 'Nuovo Intervento',
          onClick: () => setIsDialogOpen(true),
          icon: Plus,
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Totale Speso"
          value={`€${totalCost.toFixed(0)}`}
          icon={Wrench}
          variant="primary"
        />
        <StatCard
          title="Quest'Anno"
          value={`€${thisYearCost.toFixed(0)}`}
          icon={Wrench}
        />
        <StatCard
          title="Costo Medio"
          value={`€${avgCostPerIntervention.toFixed(0)}`}
          subtitle="per intervento"
          icon={Wrench}
        />
        <StatCard
          title="Totale Interventi"
          value={records.length}
          icon={Wrench}
          variant="accent"
        />
      </div>

      {/* Data Table */}
      <DataTable
        data={records.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Nessuna manutenzione registrata. Aggiungi il tuo primo intervento!"
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingRecord ? 'Modifica Manutenzione' : 'Nuova Manutenzione'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v as MaintenanceType })}
                >
                  <SelectTrigger className="input-glow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MAINTENANCE_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Input
                id="description"
                placeholder="es. Cambio olio motore"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-glow"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Costo (€)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="75.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometer">Chilometraggio</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="25000"
                  value={formData.odometer}
                  onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextDueOdometer">Prossima a (km)</Label>
                <Input
                  id="nextDueOdometer"
                  type="number"
                  placeholder="30000"
                  value={formData.nextDueOdometer}
                  onChange={(e) => setFormData({ ...formData, nextDueOdometer: e.target.value })}
                  className="input-glow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Prossima il</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  className="input-glow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop">Officina (opzionale)</Label>
              <Input
                id="shop"
                placeholder="Nome officina"
                value={formData.shop}
                onChange={(e) => setFormData({ ...formData, shop: e.target.value })}
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
