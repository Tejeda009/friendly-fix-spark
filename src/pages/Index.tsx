import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Fuel, 
  Wrench, 
  Cog, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FuelRecord, MaintenanceRecord, PartRecord, MAINTENANCE_TYPES } from '@/types/moto';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Dashboard() {
  const { value: fuelRecords } = useLocalStorage<FuelRecord[]>('moto-fuel', []);
  const { value: maintenanceRecords } = useLocalStorage<MaintenanceRecord[]>('moto-maintenance', []);
  const { value: partRecords } = useLocalStorage<PartRecord[]>('moto-parts', []);

  // Calculate statistics
  const totalFuelCost = fuelRecords.reduce((sum, r) => sum + r.totalCost, 0);
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, r) => sum + r.cost, 0);
  const totalPartsCost = partRecords.reduce((sum, r) => sum + r.price, 0);
  const totalCost = totalFuelCost + totalMaintenanceCost + totalPartsCost;

  // Calculate average consumption
  const avgConsumption = fuelRecords.length >= 2 
    ? (() => {
        const sorted = [...fuelRecords].sort((a, b) => a.odometer - b.odometer);
        let totalKm = 0;
        let totalLiters = 0;
        for (let i = 1; i < sorted.length; i++) {
          totalKm += sorted[i].odometer - sorted[i-1].odometer;
          totalLiters += sorted[i].liters;
        }
        return totalKm > 0 ? ((totalLiters / totalKm) * 100).toFixed(1) : '0';
      })()
    : '0';

  // Get upcoming maintenance
  const upcomingMaintenance = maintenanceRecords
    .filter(m => m.nextDueDate && isAfter(parseISO(m.nextDueDate), new Date()))
    .sort((a, b) => parseISO(a.nextDueDate!).getTime() - parseISO(b.nextDueDate!).getTime())
    .slice(0, 3);

  // Get recent activities
  const recentActivities = [
    ...fuelRecords.map(f => ({ ...f, activityType: 'fuel' as const })),
    ...maintenanceRecords.map(m => ({ ...m, activityType: 'maintenance' as const })),
    ...partRecords.map(p => ({ ...p, activityType: 'part' as const, date: p.purchaseDate })),
  ]
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <PageHeader 
        title="Dashboard" 
        description="Panoramica della tua moto"
        icon={Gauge}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Spesa Totale"
          value={`€${totalCost.toFixed(0)}`}
          subtitle="Tutti i costi"
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Carburante"
          value={`€${totalFuelCost.toFixed(0)}`}
          subtitle={`${fuelRecords.length} rifornimenti`}
          icon={Fuel}
        />
        <StatCard
          title="Manutenzione"
          value={`€${totalMaintenanceCost.toFixed(0)}`}
          subtitle={`${maintenanceRecords.length} interventi`}
          icon={Wrench}
        />
        <StatCard
          title="Consumo Medio"
          value={`${avgConsumption} L/100km`}
          subtitle="Ultimi rifornimenti"
          icon={Gauge}
          variant="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Maintenance */}
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Manutenzione in Arrivo
            </h2>
            <Link 
              to="/maintenance" 
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Vedi tutto <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {upcomingMaintenance.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nessuna manutenzione programmata
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingMaintenance.map((m) => (
                <div 
                  key={m.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">{MAINTENANCE_TYPES[m.type]}</p>
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-warning">
                      {format(parseISO(m.nextDueDate!), 'd MMM yyyy', { locale: it })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="glass-card p-6 animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Attività Recenti
            </h2>
          </div>
          
          {recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nessuna attività registrata
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.activityType === 'fuel' 
                        ? 'bg-primary/20' 
                        : activity.activityType === 'maintenance'
                        ? 'bg-accent/20'
                        : 'bg-success/20'
                    }`}>
                      {activity.activityType === 'fuel' ? (
                        <Fuel className="w-5 h-5 text-primary" />
                      ) : activity.activityType === 'maintenance' ? (
                        <Wrench className="w-5 h-5 text-accent" />
                      ) : (
                        <Cog className="w-5 h-5 text-success" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {activity.activityType === 'fuel' 
                          ? `${(activity as FuelRecord).liters}L di carburante`
                          : activity.activityType === 'maintenance'
                          ? (activity as MaintenanceRecord).description
                          : (activity as PartRecord).name
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(activity.date), 'd MMM yyyy', { locale: it })}
                      </p>
                    </div>
                  </div>
                  <p className="font-display font-bold text-lg">
                    €{activity.activityType === 'fuel' 
                      ? (activity as FuelRecord).totalCost.toFixed(0)
                      : activity.activityType === 'maintenance'
                      ? (activity as MaintenanceRecord).cost.toFixed(0)
                      : (activity as PartRecord).price.toFixed(0)
                    }
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <Link 
          to="/fuel" 
          className="glass-card p-6 hover:border-primary/50 transition-all hover:shadow-glow group"
        >
          <Fuel className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-display font-bold text-lg">Aggiungi Rifornimento</h3>
          <p className="text-sm text-muted-foreground">Registra un nuovo pieno</p>
        </Link>
        <Link 
          to="/maintenance" 
          className="glass-card p-6 hover:border-accent/50 transition-all hover:shadow-glow-accent group"
        >
          <Wrench className="w-8 h-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-display font-bold text-lg">Nuova Manutenzione</h3>
          <p className="text-sm text-muted-foreground">Aggiungi un intervento</p>
        </Link>
        <Link 
          to="/statistics" 
          className="glass-card p-6 hover:border-success/50 transition-all group"
        >
          <TrendingUp className="w-8 h-8 text-success mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-display font-bold text-lg">Vedi Statistiche</h3>
          <p className="text-sm text-muted-foreground">Analizza i tuoi dati</p>
        </Link>
      </div>
    </Layout>
  );
}
