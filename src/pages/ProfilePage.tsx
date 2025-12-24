import { useState } from 'react';
import { Bike, Save, Edit2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MotoProfile } from '@/types/moto';
import { format } from 'date-fns';
import { toast } from 'sonner';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const defaultProfile: MotoProfile = {
  id: generateId(),
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
  const { value: profile, setValue: setProfile } = useLocalStorage<MotoProfile>('moto-profile', defaultProfile);
  const [isEditing, setIsEditing] = useState(!profile.name);
  const [formData, setFormData] = useState<MotoProfile>(profile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.brand.trim() || !formData.model.trim()) {
      toast.error('Inserisci nome, marca e modello');
      return;
    }

    setProfile({ ...formData, id: profile.id || generateId() });
    setIsEditing(false);
    toast.success('Profilo salvato');
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  return (
    <Layout>
      <PageHeader 
        title="Profilo Moto" 
        description="Dettagli della tua moto"
        icon={Bike}
        action={!isEditing && profile.name ? {
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
                {isEditing ? 'Modifica Profilo' : 'Informazioni Moto'}
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
                    {profile.name && (
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Annulla
                      </Button>
                    )}
                    <Button type="submit" className="btn-glow flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Salva Profilo
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Bike className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold">{profile.name}</h2>
                      <p className="text-muted-foreground">
                        {profile.brand} {profile.model} ({profile.year})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoItem label="Chilometraggio" value={`${profile.currentOdometer.toLocaleString()} km`} />
                    <InfoItem label="Colore" value={profile.color || '-'} />
                    <InfoItem label="Targa" value={profile.licensePlate || '-'} />
                    <InfoItem label="Data Acquisto" value={profile.purchaseDate ? format(new Date(profile.purchaseDate), 'dd/MM/yyyy') : '-'} />
                    <InfoItem label="Numero Telaio" value={profile.vin || '-'} className="col-span-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Riepilogo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Chilometri</span>
                <span className="font-display font-bold text-primary">
                  {profile.currentOdometer.toLocaleString()} km
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Anno</span>
                <span className="font-bold">{profile.year}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Età</span>
                <span className="font-bold">{new Date().getFullYear() - profile.year} anni</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border bg-gradient-to-br from-primary/10 to-accent/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <Bike className="w-12 h-12 mx-auto text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Mantieni aggiornato il profilo per avere statistiche accurate
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
