import { useState } from 'react';
import { Fuel, Plus } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FuelRecord, FUEL_TYPES, FuelType } from '@/types/moto';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function FuelPage() {
  const { value: fuelRecords, setValue: setFuelRecords, deleteItem } = useLocalStorage<FuelRecord[]>('moto-fuel', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    liters: '',
    price: '',
    odometer: '',
    fuelType: 'gasoline' as FuelType,
    station: '',
    notes: '',
  });

  // Calculate statistics
  const totalLiters = fuelRecords.reduce((sum, r) => sum + r.liters, 0);
  const totalCost = fuelRecords.reduce((sum, r) => sum + r.totalCost, 0);
  const avgPricePerLiter = fuelRecords.length > 0 
    ? (totalCost / totalLiters).toFixed(3) 
    : '0';
  
  // Calculate consumption
  const avgConsumption = fuelRecords.length >= 2 
    ? (() => {
        const sorted = [...fuelRecords].sort((a, b) => a.odometer - b.odometer);
        let totalKm = 0;
        let totalL = 0;
        for (let i = 1; i < sorted.length; i++) {
          totalKm += sorted[i].odometer - sorted[i-1].odometer;
          totalL += sorted[i].liters;
        }
        return totalKm > 0 ? ((totalL / totalKm) * 100).toFixed(1) : '0';
      })()
    : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const liters = parseFloat(formData.liters);
    const price = parseFloat(formData.price);
    const odometer = parseInt(formData.odometer);

    if (isNaN(liters) || isNaN(price) || isNaN(odometer)) {
      toast.error('Inserisci valori validi');
      return;
    }

    const newRecord: FuelRecord = {
      id: editingRecord?.id || generateId(),
      date: formData.date,
      liters,
      price,
      totalCost: liters * price,
      odometer,
      fuelType: formData.fuelType,
      station: formData.station || undefined,
      notes: formData.notes || undefined,
    };

    if (editingRecord) {
      setFuelRecords(fuelRecords.map(r => r.id === editingRecord.id ? newRecord : r));
      toast.success('Rifornimento aggiornato');
    } else {
      setFuelRecords([newRecord, ...fuelRecords]);
      toast.success('Rifornimento aggiunto');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      liters: '',
      price: '',
      odometer: '',
      fuelType: 'gasoline',
      station: '',
      notes: '',
    });
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: FuelRecord) => {
    setFormData({
      date: record.date,
      liters: record.liters.toString(),
      price: record.price.toString(),
      odometer: record.odometer.toString(),
      fuelType: record.fuelType,
      station: record.station || '',
      notes: record.notes || '',
    });
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success('Rifornimento eliminato');
  };

  const columns = [
    {
      key: 'date',
      header: 'Data',
      render: (r: FuelRecord) => format(parseISO(r.date), 'd MMM yyyy', { locale: it }),
    },
    {
      key: 'liters',
      header: 'Litri',
      render: (r: FuelRecord) => `${r.liters.toFixed(2)} L`,
    },
    {
      key: 'price',
      header: 'Prezzo/L',
      render: (r: FuelRecord) => `€${r.price.toFixed(3)}`,
    },
    {
      key: 'totalCost',
      header: 'Totale',
      render: (r: FuelRecord) => <span className="font-bold text-primary">€{r.totalCost.toFixed(2)}</span>,
    },
    {
      key: 'odometer',
      header: 'Km',
      render: (r: FuelRecord) => `${r.odometer.toLocaleString()} km`,
    },
    {
      key: 'fuelType',
      header: 'Tipo',
      render: (r: FuelRecord) => FUEL_TYPES[r.fuelType],
    },
  ];

  return (
    <Layout>
      <PageHeader 
        title="Carburante" 
        description="Gestisci i tuoi rifornimenti"
        icon={Fuel}
        action={{
          label: 'Nuovo Rifornimento',
          onClick: () => setIsDialogOpen(true),
          icon: Plus,
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Totale Speso"
          value={`€${totalCost.toFixed(0)}`}
          icon={Fuel}
          variant="primary"
        />
        <StatCard
          title="Litri Totali"
          value={`${totalLiters.toFixed(0)} L`}
          icon={Fuel}
        />
        <StatCard
          title="Prezzo Medio"
          value={`€${avgPricePerLiter}`}
          subtitle="per litro"
          icon={Fuel}
        />
        <StatCard
          title="Consumo Medio"
          value={`${avgConsumption} L/100km`}
          icon={Fuel}
          variant="accent"
        />
      </div>

      {/* Data Table */}
      <DataTable
        data={fuelRecords.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Nessun rifornimento registrato. Aggiungi il tuo primo rifornimento!"
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingRecord ? 'Modifica Rifornimento' : 'Nuovo Rifornimento'}
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
                <Label htmlFor="fuelType">Tipo Carburante</Label>
                <Select 
                  value={formData.fuelType} 
                  onValueChange={(v) => setFormData({ ...formData, fuelType: v as FuelType })}
                >
                  <SelectTrigger className="input-glow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FUEL_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="liters">Litri</Label>
                <Input
                  id="liters"
                  type="number"
                  step="0.01"
                  placeholder="15.50"
                  value={formData.liters}
                  onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prezzo/L (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  placeholder="1.850"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="station">Stazione (opzionale)</Label>
              <Input
                id="station"
                placeholder="Nome distributore"
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                className="input-glow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Input
                id="notes"
                placeholder="Aggiungi note..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-glow"
              />
            </div>

            {formData.liters && formData.price && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="font-display text-2xl font-bold text-primary">
                  €{(parseFloat(formData.liters || '0') * parseFloat(formData.price || '0')).toFixed(2)}
                </p>
              </div>
            )}

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
