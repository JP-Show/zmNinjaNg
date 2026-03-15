/**
 * Navigation Settings Component
 *
 * Allows reordering sidebar menu items via up/down buttons.
 * Order is saved per profile.
 */

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Video, LayoutGrid, Clock, ChartGantt,
  Bell, Users, Settings, Server, FileText, GripVertical,
  ChevronUp, ChevronDown, RotateCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useSettingsStore } from '../../stores/settings';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { cn } from '../../lib/utils';

interface NavItemDef {
  path: string;
  labelKey: string;
  icon: LucideIcon;
}

const DEFAULT_NAV_ITEMS: NavItemDef[] = [
  { path: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  { path: '/monitors', labelKey: 'sidebar.monitors', icon: Video },
  { path: '/montage', labelKey: 'sidebar.montage', icon: LayoutGrid },
  { path: '/events', labelKey: 'sidebar.events', icon: Clock },
  { path: '/timeline', labelKey: 'sidebar.timeline', icon: ChartGantt },
  { path: '/notifications', labelKey: 'sidebar.notifications', icon: Bell },
  { path: '/profiles', labelKey: 'sidebar.profiles', icon: Users },
  { path: '/settings', labelKey: 'sidebar.settings', icon: Settings },
  { path: '/server', labelKey: 'sidebar.server', icon: Server },
  { path: '/logs', labelKey: 'sidebar.logs', icon: FileText },
];

function getOrderedItems(savedOrder: string[]): NavItemDef[] {
  if (!savedOrder || savedOrder.length === 0) return DEFAULT_NAV_ITEMS;
  const orderMap = new Map(savedOrder.map((path, idx) => [path, idx]));
  return [...DEFAULT_NAV_ITEMS].sort((a, b) => {
    const ai = orderMap.get(a.path) ?? 999;
    const bi = orderMap.get(b.path) ?? 999;
    return ai - bi;
  });
}

export function NavigationSettings() {
  const { t } = useTranslation();
  const { currentProfile, settings } = useCurrentProfile();
  const updateSettings = useSettingsStore((state) => state.updateProfileSettings);

  const [items, setItems] = useState<NavItemDef[]>(() =>
    getOrderedItems(settings.sidebarNavOrder)
  );

  // Sync when profile changes
  useEffect(() => {
    setItems(getOrderedItems(settings.sidebarNavOrder));
  }, [settings.sidebarNavOrder]);

  const saveOrder = (newItems: NavItemDef[]) => {
    if (!currentProfile) return;
    const order = newItems.map((item) => item.path);
    updateSettings(currentProfile.id, { sidebarNavOrder: order });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
    saveOrder(newItems);
  };

  const resetOrder = () => {
    setItems(DEFAULT_NAV_ITEMS);
    if (currentProfile) {
      updateSettings(currentProfile.id, { sidebarNavOrder: [] });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.nav_order')}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetOrder}
            className="h-7 text-xs"
            data-testid="nav-order-reset"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {t('settings.nav_order_reset')}
          </Button>
        </div>
        <CardDescription>{t('settings.nav_order_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1" data-testid="nav-order-list">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/50"
                data-testid={`nav-order-item-${item.path.replace('/', '')}`}
              >
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{t(item.labelKey)}</span>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", index === 0 && "opacity-30 pointer-events-none")}
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    aria-label={t('settings.nav_order_move_up')}
                    data-testid={`nav-order-up-${item.path.replace('/', '')}`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", index === items.length - 1 && "opacity-30 pointer-events-none")}
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={t('settings.nav_order_move_down')}
                    data-testid={`nav-order-down-${item.path.replace('/', '')}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
