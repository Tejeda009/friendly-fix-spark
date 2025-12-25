import { useState } from 'react';
import { Settings, Bell, Download, Upload, Trash2, Moon, Sun, Smartphone } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
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

interface AppSettings {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  warningThresholdPercent: number;
  theme: 'dark' | 'light' | 'system';
}

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  emailNotifications: false,
  pushNotifications: true,
  warningThresholdPercent: 80,
  theme: 'dark',
};

export default function SettingsPage() {
  const { value: settings, setValue: setSettings } = useLocalStorage<AppSettings>('moto-settings', DEFAULT_SETTINGS);
  const [isExporting, setIsExporting] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings({ ...settings, [key]: value });
    toast.success('Impostazione salvata');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        profile: localStorage.getItem('moto-profile'),
        fuelRecords: localStorage.getItem('moto-fuel-records'),
        maintenanceRecords: localStorage.getItem('moto-maintenance-records'),
        partRecords: localStorage.getItem('moto-part-records'),
        coreParts: localStorage.getItem('moto-core-parts'),
        settings: localStorage.getItem('moto-settings'),
        exportDate: new Date().toISOString(),
        version: '2.0.0',
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mototrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup esportato con successo');
    } catch (error) {
      toast.error('Errore durante l\'esportazione');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.profile) localStorage.setItem('moto-profile', data.profile);
      if (data.fuelRecords) localStorage.setItem('moto-fuel-records', data.fuelRecords);
      if (data.maintenanceRecords) localStorage.setItem('moto-maintenance-records', data.maintenanceRecords);
      if (data.partRecords) localStorage.setItem('moto-part-records', data.partRecords);
      if (data.coreParts) localStorage.setItem('moto-core-parts', data.coreParts);
      if (data.settings) localStorage.setItem('moto-settings', data.settings);

      toast.success('Backup importato! Ricarica la pagina per vedere i dati.');
      window.location.reload();
    } catch (error) {
      toast.error('File non valido');
    }
  };

  const handleClearAllData = () => {
    const keys = [
      'moto-profile',
      'moto-fuel-records',
      'moto-maintenance-records',
      'moto-part-records',
      'moto-core-parts',
      'moto-settings',
      'moto-notifications',
    ];
    keys.forEach(key => localStorage.removeItem(key));
    toast.success('Tutti i dati sono stati eliminati');
    window.location.reload();
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Le notifiche push non sono supportate su questo browser');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateSetting('pushNotifications', true);
      toast.success('Notifiche push abilitate');
      
      // Show a test notification
      new Notification('MotoTrack', {
        body: 'Le notifiche push sono ora attive!',
        icon: '/favicon.ico',
      });
    } else {
      toast.error('Permesso notifiche negato');
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Impostazioni"
        description="Configura l'app e gestisci i tuoi dati"
        icon={Settings}
      />

      <div className="space-y-6">
        {/* Notifications Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifiche
            </CardTitle>
            <CardDescription>
              Gestisci come e quando ricevere gli avvisi di manutenzione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifiche Attive</Label>
                <p className="text-sm text-muted-foreground">
                  Ricevi avvisi quando le parti sono in scadenza
                </p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(v) => updateSetting('notificationsEnabled', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifiche Push</Label>
                <p className="text-sm text-muted-foreground">
                  Ricevi notifiche sul dispositivo
                </p>
              </div>
              <div className="flex items-center gap-2">
                {settings.pushNotifications ? (
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(v) => updateSetting('pushNotifications', v)}
                  />
                ) : (
                  <Button variant="outline" size="sm" onClick={requestPushPermission}>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Abilita
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifiche Email</Label>
                <p className="text-sm text-muted-foreground">
                  Ricevi un riepilogo via email (richiede backend)
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(v) => updateSetting('emailNotifications', v)}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              Aspetto
            </CardTitle>
            <CardDescription>
              Personalizza l'aspetto dell'applicazione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(['dark', 'light', 'system'] as const).map((theme) => (
                <Button
                  key={theme}
                  variant={settings.theme === theme ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => {
                    updateSetting('theme', theme);
                    if (theme === 'light') {
                      document.documentElement.classList.add('light');
                    } else {
                      document.documentElement.classList.remove('light');
                    }
                  }}
                >
                  {theme === 'dark' && <Moon className="w-4 h-4 mr-2" />}
                  {theme === 'light' && <Sun className="w-4 h-4 mr-2" />}
                  {theme === 'system' && <Smartphone className="w-4 h-4 mr-2" />}
                  {theme === 'dark' ? 'Scuro' : theme === 'light' ? 'Chiaro' : 'Sistema'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Gestione Dati
            </CardTitle>
            <CardDescription>
              Esporta, importa o elimina i tuoi dati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExportData}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Esporta Backup
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full pointer-events-none">
                  <Upload className="w-4 h-4 mr-2" />
                  Importa Backup
                </Button>
              </div>
            </div>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina Tutti i Dati
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione eliminerà permanentemente tutti i dati dell'app inclusi profilo moto, 
                    rifornimenti, manutenzioni e parti. Questa azione non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData}>
                    Elimina Tutto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="glass-card">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <h3 className="font-display text-xl font-bold">
                MOTO<span className="text-primary">TRACK</span>
              </h3>
              <p className="text-sm text-muted-foreground">Versione 2.0.0</p>
              <p className="text-xs text-muted-foreground">
                © 2024 MotoTrack - Gestione Manutenzione Moto
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}