import { useState } from 'react';
import { Settings2, Plus, AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CorePart, CORE_PART_TYPES, CorePartType, MotoProfile } from '@/types/moto';
import { format, parseISO, differenceInDays, addMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Default maintenance intervals for each part type
const DEFAULT_INTERVALS: Record<CorePartType, { km: number; months: number }> = {
  engine_oil: { km: 6000, months: 12 },
  oil_filter: { km: 6000, months: 12 },
  air_filter: { km: 12000, months: 24 },
  spark_plugs: { km: 16000, months: 24 },
  brake_pads_front: { km: 15000, months: 24 },
  brake_pads_rear: { km: 20000, months: 24 },
  brake_fluid: { km: 20000, months: 24 },
  coolant: { km: 20000, months: 24 },
  chain: { km: 25000, months: 36 },
  sprockets: { km: 25000, months: 36 },
  tires_front: { km: 15000, months: 36 },
  tires_rear: { km: 12000, months: 36 },
  battery: { km: 50000, months: 36 },
  fork_oil: { km: 20000, months: 24 },
  valve_clearance: { km: 24000, months: 36 },
};

export default function CorePartsPage() {
  const { value: parts, setValue: setParts, deleteItem } = useLocalStorage<CorePart[]>('moto-core-parts', []);
  const { value: profile } = useLocalStorage<MotoProfile>('moto-profile', { currentOdometer: 0 } as MotoProfile);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<CorePart | null>(null);

  const [formData, setFormData] = useState({
    type: 'engine_oil' as CorePartType,
    lastServiceDate: format(new Date(), 'yyyy-MM-dd'),
    lastServiceOdometer: profile.currentOdometer.toString(),
    intervalKm: '',
    intervalMonths: '',
    brand: '',
    notes: '',
  });

  // Calculate maintenance status for each part
  const getMaintenanceStatus = (part: CorePart) => {
    const currentOdometer = profile.currentOdometer;
    const kmSinceService = currentOdometer - part.lastServiceOdometer;
    const daysSinceService = differenceInDays(new Date(), parseISO(part.lastServiceDate));
    const monthsSinceService = daysSinceService / 30;

    const kmProgress = (kmSinceService / part.intervalKm) * 100;
    const timeProgress = (monthsSinceService / part.intervalMonths) * 100;
    const maxProgress = Math.max(kmProgress, timeProgress);

    const kmRemaining = part.intervalKm - kmSinceService;
    const daysRemaining = (part.intervalMonths * 30) - daysSinceService;

    let status: 'ok' | 'warning' | 'overdue';
    if (maxProgress >= 100) {
      status = 'overdue';
    } else if (maxProgress >= 80) {
      status = 'warning';
    } else {
      status = 'ok';
    }

    return {
      status,
      kmProgress: Math.min(kmProgress, 100),
      timeProgress: Math.min(timeProgress, 100),
      maxProgress: Math.min(maxProgress, 100),
      kmRemaining,
      daysRemaining,
      nextDueKm: part.lastServiceOdometer + part.intervalKm,
      nextDueDate: addMonths(parseISO(part.lastServiceDate), part.intervalMonths),
    };
  };

  // Get parts by status
  const overdueParts = parts.filter(p => getMaintenanceStatus(p).status === 'overdue');
  const warningParts = parts.filter(p => getMaintenanceStatus(p).status === 'warning');
  const okParts = parts.filter(p => getMaintenanceStatus(p).status === 'ok');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lastServiceOdometer = parseInt(formData.lastServiceOdometer);
    const defaults = DEFAULT_INTERVALS[formData.type];
    const intervalKm = parseInt(formData.intervalKm) || defaults.km;
    const intervalMonths = parseInt(formData.intervalMonths) || defaults.months;

    if (isNaN(lastServiceOdometer)) {
      toast.error('Inserisci un chilometraggio valido');
      return;
    }

    const newPart: CorePart = {
      id: editingPart?.id || generateId(),
      type: formData.type,
      lastServiceDate: formData.lastServiceDate,
      lastServiceOdometer,
      intervalKm,
      intervalMonths,
      brand: formData.brand || undefined,
      notes: formData.notes || undefined,
    };

    if (editingPart) {
      setParts(parts.map(p => p.id === editingPart.id ? newPart : p));
      toast.success('Parte aggiornata');
    } else {
      // Check if part type already exists
      if (parts.some(p => p.type === formData.type)) {
        toast.error('Questa parte è già registrata. Modificala invece.');
        return;
      }
      setParts([...parts, newPart]);
      toast.success('Parte aggiunta');
    }

    resetForm();
  };

  const resetForm = () => {
    const defaults = DEFAULT_INTERVALS['engine_oil'];
    setFormData({
      type: 'engine_oil',
      lastServiceDate: format(new Date(), 'yyyy-MM-dd'),
      lastServiceOdometer: profile.currentOdometer.toString(),
      intervalKm: '',
      intervalMonths: '',
      brand: '',
      notes: '',
    });
    setEditingPart(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (part: CorePart) => {
    setFormData({
      type: part.type,
      lastServiceDate: part.lastServiceDate,
      lastServiceOdometer: part.lastServiceOdometer.toString(),
      intervalKm: part.intervalKm.toString(),
      intervalMonths: part.intervalMonths.toString(),
      brand: part.brand || '',
      notes: part.notes || '',
    });
    setEditingPart(part);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success('Parte eliminata');
  };

  const handleTypeChange = (type: CorePartType) => {
    const defaults = DEFAULT_INTERVALS[type];
    setFormData({
      ...formData,
      type,
      intervalKm: defaults.km.toString(),
      intervalMonths: defaults.months.toString(),
    });
  };

  const availableTypes = Object.keys(CORE_PART_TYPES).filter(
    type => !parts.some(p => p.type === type) || editingPart?.type === type
  ) as CorePartType[];

  return (
    <Layout>
      <PageHeader
        title="Parti Essenziali"
        description="Monitora lo stato delle parti e ricevi avvisi per la manutenzione"
        icon={Settings2}
        action={{
          label: 'Aggiungi Parte',
          onClick: () => setIsDialogOpen(true),
          icon: Plus,
        }}
      />

      {/* Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className={`glass-card border-destructive/50 ${overdueParts.length > 0 ? 'animate-pulse' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-destructive">{overdueParts.length}</p>
                <p className="text-sm text-muted-foreground">Scadute</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-warning/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-warning">{warningParts.length}</p>
                <p className="text-sm text-muted-foreground">In Scadenza</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-success/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-success">{okParts.length}</p>
                <p className="text-sm text-muted-foreground">In Regola</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Parts Alert */}
      {overdueParts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-destructive">Manutenzione Richiesta!</h3>
              <p className="text-sm text-muted-foreground">
                Le seguenti parti necessitano manutenzione immediata:{' '}
                <span className="font-medium text-foreground">
                  {overdueParts.map(p => CORE_PART_TYPES[p.type]).join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Parts Grid */}
      {parts.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Settings2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Nessuna parte registrata</h3>
            <p className="text-muted-foreground mb-6">
              Aggiungi le parti essenziali della tua moto per ricevere avvisi sulla manutenzione
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="btn-glow">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Prima Parte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {parts.map((part) => {
            const status = getMaintenanceStatus(part);
            const statusColors = {
              ok: 'border-success/30 hover:border-success/50',
              warning: 'border-warning/30 hover:border-warning/50',
              overdue: 'border-destructive/30 hover:border-destructive/50 bg-destructive/5',
            };
            const progressColors = {
              ok: 'bg-success',
              warning: 'bg-warning',
              overdue: 'bg-destructive',
            };

            return (
              <Card
                key={part.id}
                className={`glass-card transition-all ${statusColors[status.status]}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        status.status === 'ok' ? 'bg-success/20' :
                        status.status === 'warning' ? 'bg-warning/20' : 'bg-destructive/20'
                      }`}>
                        {status.status === 'ok' ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : status.status === 'warning' ? (
                          <Clock className="w-5 h-5 text-warning" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{CORE_PART_TYPES[part.type]}</CardTitle>
                        {part.brand && (
                          <p className="text-xs text-muted-foreground">{part.brand}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(part)}
                        className="h-8 w-8 p-0"
                      >
                        <Wrench className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Usura</span>
                      <span className={`font-medium ${
                        status.status === 'ok' ? 'text-success' :
                        status.status === 'warning' ? 'text-warning' : 'text-destructive'
                      }`}>
                        {Math.round(status.maxProgress)}%
                      </span>
                    </div>
                    <Progress
                      value={status.maxProgress}
                      className="h-2"
                    />
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Ultimo Servizio</p>
                      <p className="font-medium">
                        {format(parseISO(part.lastServiceDate), 'd MMM yyyy', { locale: it })}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Km Servizio</p>
                      <p className="font-medium">{part.lastServiceOdometer.toLocaleString()} km</p>
                    </div>
                  </div>

                  {/* Next Due */}
                  <div className={`p-3 rounded-lg ${
                    status.status === 'ok' ? 'bg-success/10' :
                    status.status === 'warning' ? 'bg-warning/10' : 'bg-destructive/10'
                  }`}>
                    <p className="text-xs text-muted-foreground mb-1">Prossima Manutenzione</p>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {status.kmRemaining > 0
                          ? `Tra ${status.kmRemaining.toLocaleString()} km`
                          : `Scaduto di ${Math.abs(status.kmRemaining).toLocaleString()} km`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        o {format(status.nextDueDate, 'd MMM yyyy', { locale: it })}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {status.status !== 'ok' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEdit(part)}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Registra Manutenzione
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingPart ? 'Aggiorna Manutenzione' : 'Aggiungi Parte'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo Parte</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => handleTypeChange(v as CorePartType)}
                disabled={!!editingPart}
              >
                <SelectTrigger className="input-glow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CORE_PART_TYPES[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastServiceDate">Data Ultimo Servizio</Label>
                <Input
                  id="lastServiceDate"
                  type="date"
                  value={formData.lastServiceDate}
                  onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastServiceOdometer">Km Ultimo Servizio</Label>
                <Input
                  id="lastServiceOdometer"
                  type="number"
                  placeholder="12500"
                  value={formData.lastServiceOdometer}
                  onChange={(e) => setFormData({ ...formData, lastServiceOdometer: e.target.value })}
                  className="input-glow"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intervalKm">Intervallo (km)</Label>
                <Input
                  id="intervalKm"
                  type="number"
                  placeholder={DEFAULT_INTERVALS[formData.type].km.toString()}
                  value={formData.intervalKm}
                  onChange={(e) => setFormData({ ...formData, intervalKm: e.target.value })}
                  className="input-glow"
                />
                <p className="text-xs text-muted-foreground">
                  Default: {DEFAULT_INTERVALS[formData.type].km.toLocaleString()} km
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalMonths">Intervallo (mesi)</Label>
                <Input
                  id="intervalMonths"
                  type="number"
                  placeholder={DEFAULT_INTERVALS[formData.type].months.toString()}
                  value={formData.intervalMonths}
                  onChange={(e) => setFormData({ ...formData, intervalMonths: e.target.value })}
                  className="input-glow"
                />
                <p className="text-xs text-muted-foreground">
                  Default: {DEFAULT_INTERVALS[formData.type].months} mesi
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca/Prodotto (opzionale)</Label>
              <Input
                id="brand"
                placeholder="es. Motul 5100"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Annulla
              </Button>
              <Button type="submit" className="btn-glow">
                {editingPart ? 'Aggiorna' : 'Aggiungi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
