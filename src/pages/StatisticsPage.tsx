import { useMemo } from 'react';
import { BarChart3, Fuel, Wrench, Cog, TrendingUp, TrendingDown } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { FuelRecord, MaintenanceRecord, PartRecord, MAINTENANCE_TYPES, MaintenanceType } from '@/types/moto';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';

const CHART_COLORS = [
  'hsl(32, 100%, 50%)',   // primary/orange
  'hsl(175, 70%, 45%)',   // accent/teal
  'hsl(145, 70%, 45%)',   // success/green
  'hsl(45, 100%, 50%)',   // warning/amber
  'hsl(0, 75%, 55%)',     // destructive/red
  'hsl(280, 70%, 50%)',   // purple
  'hsl(200, 70%, 50%)',   // blue
];

export default function StatisticsPage() {
  const { value: fuelRecords } = useLocalStorage<FuelRecord[]>('moto-fuel', []);
  const { value: maintenanceRecords } = useLocalStorage<MaintenanceRecord[]>('moto-maintenance', []);
  const { value: partRecords } = useLocalStorage<PartRecord[]>('moto-parts', []);

  // Calculate totals
  const totalFuelCost = fuelRecords.reduce((sum, r) => sum + r.totalCost, 0);
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, r) => sum + r.cost, 0);
  const totalPartsCost = partRecords.reduce((sum, r) => sum + r.price, 0);
  const totalCost = totalFuelCost + totalMaintenanceCost + totalPartsCost;

  // Monthly spending data for last 12 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now,
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const fuel = fuelRecords
        .filter(r => {
          const date = parseISO(r.date);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, r) => sum + r.totalCost, 0);

      const maintenance = maintenanceRecords
        .filter(r => {
          const date = parseISO(r.date);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, r) => sum + r.cost, 0);

      const parts = partRecords
        .filter(r => {
          const date = parseISO(r.purchaseDate);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, r) => sum + r.price, 0);

      return {
        name: format(month, 'MMM', { locale: it }),
        fullMonth: format(month, 'MMMM yyyy', { locale: it }),
        Carburante: Math.round(fuel),
        Manutenzione: Math.round(maintenance),
        Ricambi: Math.round(parts),
        Totale: Math.round(fuel + maintenance + parts),
      };
    });
  }, [fuelRecords, maintenanceRecords, partRecords]);

  // Cost distribution for pie chart
  const costDistribution = useMemo(() => [
    { name: 'Carburante', value: Math.round(totalFuelCost), color: CHART_COLORS[0] },
    { name: 'Manutenzione', value: Math.round(totalMaintenanceCost), color: CHART_COLORS[1] },
    { name: 'Ricambi', value: Math.round(totalPartsCost), color: CHART_COLORS[2] },
  ].filter(item => item.value > 0), [totalFuelCost, totalMaintenanceCost, totalPartsCost]);

  // Maintenance by type
  const maintenanceByType = useMemo(() => {
    const byType = maintenanceRecords.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + r.cost;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byType)
      .map(([type, cost], index) => ({
        name: MAINTENANCE_TYPES[type as MaintenanceType],
        value: Math.round(cost),
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [maintenanceRecords]);

  // Fuel consumption over time
  const consumptionData = useMemo(() => {
    if (fuelRecords.length < 2) return [];
    
    const sorted = [...fuelRecords].sort((a, b) => a.odometer - b.odometer);
    const data: { name: string; consumo: number; km: number }[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const km = sorted[i].odometer - sorted[i-1].odometer;
      if (km > 0) {
        const consumption = (sorted[i].liters / km) * 100;
        data.push({
          name: format(parseISO(sorted[i].date), 'd MMM', { locale: it }),
          consumo: parseFloat(consumption.toFixed(2)),
          km: sorted[i].odometer,
        });
      }
    }

    return data.slice(-12); // Last 12 fill-ups
  }, [fuelRecords]);

  // Calculate trends
  const lastMonthTotal = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2].Totale : 0;
  const thisMonthTotal = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].Totale : 0;
  const monthlyTrend = lastMonthTotal > 0 
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-border">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: €{entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasData = fuelRecords.length > 0 || maintenanceRecords.length > 0 || partRecords.length > 0;

  return (
    <Layout>
      <PageHeader 
        title="Statistiche" 
        description="Analisi dettagliata delle spese"
        icon={BarChart3}
      />

      {!hasData ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Nessun dato disponibile</h2>
          <p className="text-muted-foreground">
            Aggiungi rifornimenti, manutenzioni o ricambi per vedere le statistiche.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Spesa Totale"
              value={`€${totalCost.toFixed(0)}`}
              icon={TrendingUp}
              variant="primary"
              trend={monthlyTrend !== 0 ? {
                value: Math.round(monthlyTrend),
                isPositive: monthlyTrend < 0,
              } : undefined}
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
              title="Ricambi"
              value={`€${totalPartsCost.toFixed(0)}`}
              subtitle={`${partRecords.length} acquisti`}
              icon={Cog}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Spending Chart */}
            <div className="glass-card p-6 animate-slide-up">
              <h3 className="font-display text-xl font-bold mb-6">Spese Mensili</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Carburante" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Manutenzione" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ricambi" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Distribution Pie Chart */}
            <div className="glass-card p-6 animate-slide-up stagger-1">
              <h3 className="font-display text-xl font-bold mb-6">Distribuzione Costi</h3>
              <div className="h-80">
                {costDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {costDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`€${value}`, 'Totale']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nessun dato
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fuel Consumption Trend */}
            {consumptionData.length > 0 && (
              <div className="glass-card p-6 animate-slide-up stagger-2">
                <h3 className="font-display text-xl font-bold mb-6">Andamento Consumo (L/100km)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={consumptionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} L/100km`, 'Consumo']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="consumo" 
                        stroke={CHART_COLORS[0]}
                        fill={`${CHART_COLORS[0]}33`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Maintenance by Type */}
            {maintenanceByType.length > 0 && (
              <div className="glass-card p-6 animate-slide-up stagger-3">
                <h3 className="font-display text-xl font-bold mb-6">Manutenzione per Tipo</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenanceByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `€${value}`}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`€${value}`, 'Totale']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {maintenanceByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Total Spending Trend */}
          <div className="glass-card p-6 mt-6 animate-slide-up stagger-4">
            <h3 className="font-display text-xl font-bold mb-6">Trend Spese Totali</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Totale" 
                    stroke={CHART_COLORS[0]}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS[0], strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
