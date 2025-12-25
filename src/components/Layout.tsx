import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Fuel, 
  Wrench, 
  Cog, 
  BarChart3, 
  Menu, 
  X,
  Bike,
  Settings2,
  Settings,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';
import { MotoSelector } from './MotoSelector';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/profile', label: 'Profilo Moto', icon: Bike },
  { path: '/fuel', label: 'Carburante', icon: Fuel },
  { path: '/maintenance', label: 'Manutenzione', icon: Wrench },
  { path: '/core-parts', label: 'Parti', icon: Settings2 },
  { path: '/parts', label: 'Ricambi', icon: Cog },
  { path: '/documents', label: 'Documenti', icon: FileText },
  { path: '/statistics', label: 'Statistiche', icon: BarChart3 },
  { path: '/settings', label: 'Impostazioni', icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bike className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display text-lg font-bold tracking-wider">MOTO<span className="text-primary">TRACK</span></span>
        </Link>
        <div className="flex items-center gap-1">
          <MotoSelector />
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-md pt-20">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'nav-link text-lg',
                  location.pathname === item.path && 'active'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-border bg-sidebar p-6 sticky top-0">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
              <Bike className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-wider">MOTO<span className="text-primary">TRACK</span></h1>
              <p className="text-xs text-muted-foreground">Gestione Moto</p>
            </div>
          </Link>
          <NotificationBell />
        </div>

        {/* Moto Selector */}
        <div className="mb-6">
          <MotoSelector />
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'nav-link',
                location.pathname === item.path && 'active'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-border">
          <div className="glass-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Versione</p>
            <p className="font-display text-primary font-bold">2.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 safe-area-bottom">
        <div className="flex justify-around py-2 px-1">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[56px]',
                location.pathname === item.path 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[56px] text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Altro</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
