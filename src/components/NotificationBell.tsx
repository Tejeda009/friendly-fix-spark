import { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, X, AlertTriangle, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CorePart, CORE_PART_TYPES, MotoProfile } from '@/types/moto';
import { differenceInDays, parseISO, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useMoto } from '@/contexts/MotoContext';

export interface Notification {
  id: string;
  type: 'overdue' | 'warning' | 'info' | 'document';
  title: string;
  message: string;
  partType?: string;
  motoId?: string;
  motoName?: string;
  createdAt: string;
  read: boolean;
}

interface Document {
  id: string;
  type: string;
  name: string;
  expiryDate: string;
}

export function NotificationBell() {
  const { motorcycles, currentMoto, getStorageKey } = useMoto();
  const { value: notifications, setValue: setNotifications } = useLocalStorage<Notification[]>('moto-notifications-global', []);
  const [isOpen, setIsOpen] = useState(false);

  // Generate notifications from all motorcycles
  const checkForNotifications = useCallback(() => {
    const newNotifications: Notification[] = [];

    motorcycles.forEach((moto) => {
      // Check core parts
      const partsKey = `moto-core-parts-${moto.id}`;
      const partsData = localStorage.getItem(partsKey);
      const parts: CorePart[] = partsData ? JSON.parse(partsData) : [];

      parts.forEach((part) => {
        const kmSinceService = moto.currentOdometer - part.lastServiceOdometer;
        const daysSinceService = differenceInDays(new Date(), parseISO(part.lastServiceDate));
        const monthsSinceService = daysSinceService / 30;

        const kmProgress = (kmSinceService / part.intervalKm) * 100;
        const timeProgress = (monthsSinceService / part.intervalMonths) * 100;
        const maxProgress = Math.max(kmProgress, timeProgress);

        const partName = CORE_PART_TYPES[part.type];
        const notificationId = `${moto.id}-${part.type}`;

        if (maxProgress >= 100) {
          const existing = notifications.find(n => n.id === `${notificationId}-overdue`);
          if (!existing) {
            newNotifications.push({
              id: `${notificationId}-overdue`,
              type: 'overdue',
              title: 'Manutenzione Scaduta!',
              message: `${partName} su ${moto.name} necessita manutenzione`,
              partType: part.type,
              motoId: moto.id,
              motoName: moto.name,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        } else if (maxProgress >= 80) {
          const existing = notifications.find(n => n.id === `${notificationId}-warning`);
          if (!existing) {
            newNotifications.push({
              id: `${notificationId}-warning`,
              type: 'warning',
              title: 'Manutenzione in Scadenza',
              message: `${partName} su ${moto.name} scade presto`,
              partType: part.type,
              motoId: moto.id,
              motoName: moto.name,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        }
      });

      // Check documents
      const docsKey = `moto-documents-${moto.id}`;
      const docsData = localStorage.getItem(docsKey);
      const docs: Document[] = docsData ? JSON.parse(docsData) : [];

      docs.forEach((doc) => {
        const daysUntilExpiry = differenceInDays(parseISO(doc.expiryDate), new Date());
        const notificationId = `${moto.id}-doc-${doc.id}`;

        if (daysUntilExpiry < 0) {
          const existing = notifications.find(n => n.id === `${notificationId}-expired`);
          if (!existing) {
            newNotifications.push({
              id: `${notificationId}-expired`,
              type: 'document',
              title: 'Documento Scaduto!',
              message: `${doc.name} su ${moto.name} è scaduto`,
              motoId: moto.id,
              motoName: moto.name,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        } else if (daysUntilExpiry <= 30) {
          const existing = notifications.find(n => n.id === `${notificationId}-expiring`);
          if (!existing) {
            newNotifications.push({
              id: `${notificationId}-expiring`,
              type: 'warning',
              title: 'Documento in Scadenza',
              message: `${doc.name} su ${moto.name} scade tra ${daysUntilExpiry} giorni`,
              motoId: moto.id,
              motoName: moto.name,
              createdAt: new Date().toISOString(),
              read: false,
            });
          }
        }
      });
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));
      
      // Request push notification if enabled
      if ('Notification' in window && Notification.permission === 'granted') {
        newNotifications.forEach(n => {
          new Notification(n.title, {
            body: n.message,
            icon: '/favicon.ico',
            tag: n.id,
          });
        });
      }
    }
  }, [motorcycles, notifications, setNotifications]);

  // Check notifications on mount and every 5 minutes
  useEffect(() => {
    checkForNotifications();
    const interval = setInterval(checkForNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkForNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'document':
        return <Calendar className="w-5 h-5 text-destructive" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-success" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          {unreadCount > 0 ? (
            <>
              <BellRing className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display font-bold">Notifiche</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Segna tutte lette
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nessuna notifica</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 transition-colors hover:bg-secondary/50',
                    !notification.read && 'bg-primary/5'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(notification.createdAt), 'd MMM, HH:mm', { locale: it })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border">
            <Link to="/core-parts" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full" size="sm">
                Vai a Parti Essenziali
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}