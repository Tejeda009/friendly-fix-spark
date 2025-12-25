import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bike, Save, Edit2, Plus, Trash2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMoto } from '@/contexts/MotoContext';
import { MotoProfile } from '@/types/moto';
import { format } from 'date-fns';
import { toast } from 'sonner';
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

const emptyProfile: Omit<MotoProfile, 'id'> = {
  name: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  currentOdometer: 0,
  licensePlate: '',
  vin: '',
  purchaseDate: '',
  color: '',
};

export default function ProfilePage() {
  const { motorcycles, currentMoto, addMotorcycle, updateMotorcycle, deleteMotorcycle, setCurrentMoto } = useMoto();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isNewMoto = searchParams.get('new') === 'true';
  const [isEditing, setIsEditing] = useState(isNewMoto || !currentMoto);
  const [isCreating, setIsCreating] = useState(isNewMoto);
  const [formData, setFormData] = useState<Omit<MotoProfile, 'id'>>(
    isNewMoto ? emptyProfile : (currentMoto || emptyProfile)
  );

  // Update form when current moto changes
  useEffect(() => {
    if (currentMoto && !isCreating) {
      setFormData(currentMoto);
      setIsEditing(false);
    } else if (!currentMoto && motorcycles.length === 0) {
      setIsEditing(true);
      setIsCreating(true);
    }
  }, [currentMoto, motorcycles.length, isCreating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.brand.trim() || !formData.model.trim()) {
      toast.error('Inserisci nome, marca e modello');
      return;
    }

    if (isCreating) {
      const newId = addMotorcycle(formData);
      setCurrentMoto(newId);
      toast.success('Moto aggiunta con successo!');
      setIsCreating(false);
      navigate('/profile');
    } else if (currentMoto) {
      updateMotorcycle(currentMoto.id, formData);
      toast.success('Profilo salvato');
    }
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isCreating && motorcycles.length > 0) {
      setIsCreating(false);
      setFormData(currentMoto || emptyProfile);
      navigate('/profile');
    } else if (currentMoto) {
      setFormData(currentMoto);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (currentMoto) {
      deleteMotorcycle(currentMoto.id);
      toast.success('Moto eliminata');
    }
  };

  const handleNewMoto = () => {
    setFormData(emptyProfile);
    setIsCreating(true);
    setIsEditing(true);
  };

  return (
    <Layout>
      <PageHeader 
        title={isCreating ? "Nuova Moto" : "Profilo Moto"} 
        description={isCreating ? "Aggiungi una nuova moto al tuo garage" : "Dettagli della tua moto"}
        icon={Bike}
        action={!isEditing && currentMoto ? {
          label: 'Modifica',
          onClick: () => setIsEditing(true),
          icon: Edit2,
        } : undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Bike className="w-5 h-5 text-primary" />
                {isEditing ? (isCreating ? 'Nuova Moto' : 'Modifica Profilo') : 'Informazioni Moto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Moto *</Label>
                      <Input
                        id="name"
                        placeholder="es. La mia Ninja"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-glow"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca *</Label>
                      <Input
                        id="brand"
                        placeholder="es. Kawasaki"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="input-glow"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Modello *</Label>
                      <Input
                        id="model"
                        placeholder="es. Ninja 650"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="input-glow"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Anno</Label>
                      <Input
                        id="year"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="input-glow"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentOdometer">Chilometraggio Attuale</Label>
                      <Input
                        id="currentOdometer"
                        type="number"
                        min="0"
                        placeholder="12500"
                        value={formData.currentOdometer || ''}
                        onChange={(e) => setFormData({ ...formData, currentOdometer: parseInt(e.target.value) || 0 })}
                        className="input-glow"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Colore</Label>
                      <Input
                        id="color"
                        placeholder="es. Verde/Nero"
                        value={formData.color || ''}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="input-glow"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="licensePlate">Targa</Label>
                      <Input
                        id="licensePlate"
                        placeholder="es. AB123CD"
                        value={formData.licensePlate || ''}
                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                        className="input-glow"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">Data Acquisto</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={formData.purchaseDate || ''}
                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                        className="input-glow"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vin">Numero Telaio (VIN)</Label>
                    <Input
                      id="vin"
                      placeholder="es. JKA12345678901234"
                      value={formData.vin || ''}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                      className="input-glow"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    {(currentMoto || (isCreating && motorcycles.length > 0)) && (
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Annulla
                      </Button>
                    )}
                    <Button type="submit" className="btn-glow flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {isCreating ? 'Aggiungi Moto' : 'Salva Profilo'}
                    </Button>
                  </div>
                </form>
              ) : currentMoto ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Bike className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold">{currentMoto.name}</h2>
                      <p className="text-muted-foreground">
                        {currentMoto.brand} {currentMoto.model} ({currentMoto.year})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoItem label="Chilometraggio" value={`${currentMoto.currentOdometer.toLocaleString()} km`} />
                    <InfoItem label="Colore" value={currentMoto.color || '-'} />
                    <InfoItem label="Targa" value={currentMoto.licensePlate || '-'} />
                    <InfoItem label="Data Acquisto" value={currentMoto.purchaseDate ? format(new Date(currentMoto.purchaseDate), 'dd/MM/yyyy') : '-'} />
                    <InfoItem label="Numero Telaio" value={currentMoto.vin || '-'} className="col-span-2" />
                  </div>

                  {motorcycles.length > 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="mt-4">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Elimina Moto
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminare questa moto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Questa azione eliminerà permanentemente "{currentMoto.name}" e tutti i dati associati 
                            (rifornimenti, manutenzioni, parti, documenti). L'azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bike className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-display text-xl font-bold mb-2">Nessuna moto selezionata</h3>
                  <p className="text-muted-foreground mb-6">
                    Aggiungi la tua prima moto per iniziare
                  </p>
                  <Button onClick={handleNewMoto} className="btn-glow">
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Moto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          {currentMoto && (
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Riepilogo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Chilometri</span>
                  <span className="font-display font-bold text-primary">
                    {currentMoto.currentOdometer.toLocaleString()} km
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Anno</span>
                  <span className="font-bold">{currentMoto.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Età</span>
                  <span className="font-bold">{new Date().getFullYear() - currentMoto.year} anni</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Motorcycles */}
          <Card className="glass-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Le Tue Moto</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleNewMoto}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {motorcycles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessuna moto registrata
                </p>
              ) : (
                motorcycles.map((moto) => (
                  <button
                    key={moto.id}
                    onClick={() => {
                      setCurrentMoto(moto.id);
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      moto.id === currentMoto?.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    <p className="font-medium truncate">{moto.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {moto.brand} {moto.model}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border bg-gradient-to-br from-primary/10 to-accent/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <Bike className="w-12 h-12 mx-auto text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Gestisci più moto e passa da una all'altra facilmente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function InfoItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`p-3 rounded-lg bg-secondary/50 ${className || ''}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-medium truncate">{value}</p>
    </div>
  );
}