/**
 * Fullscreen Controls
 *
 * Persistent thin top bar for fullscreen montage mode.
 * Always visible — no hide/show toggle, no gesture conflicts.
 * Sits in the safe-area-inset-top space (free space on notch devices).
 */

import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { RefreshCw, Minimize, Menu, Lock, RotateCcw, Timer, TimerOff, Power } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useKioskLock } from '../../hooks/useKioskLock';
import { PinPad } from '../kiosk/PinPad';

interface FullscreenControlsProps {
  onRefetch: () => void;
  onExitFullscreen: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onAppReload: () => void;
  onResetStreams: () => void;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
}

export function FullscreenControls({
  onRefetch,
  onExitFullscreen,
  showLabels,
  onToggleLabels,
  onAppReload,
  onResetStreams,
  autoRefreshEnabled,
  onToggleAutoRefresh,
}: FullscreenControlsProps) {
  const { t } = useTranslation();
  const {
    isLocked, showSetPin, setPinMode, pinError,
    handleLockToggle, handleSetPinSubmit, handleSetPinCancel,
  } = useKioskLock();

  return (
    <>
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
      <div className="h-8 flex items-center justify-between px-3">
        <span className="text-white/70 font-medium text-xs">{t('montage.title')}</span>
        <div className="flex items-center gap-1">
          <Button onClick={onAppReload} variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7" title="Reload App">
            <Power className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={onToggleAutoRefresh} variant="ghost" size="icon" className={cn("h-7 w-7", autoRefreshEnabled ? "text-green-400 hover:text-green-300" : "text-white/70 hover:text-white hover:bg-white/10")} title="Auto Reset (5m)">
            {autoRefreshEnabled ? <Timer className="h-3.5 w-3.5" /> : <TimerOff className="h-3.5 w-3.5" />}
          </Button>
          <Button onClick={onResetStreams} variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7" title="Reset Streams">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={onToggleLabels} variant="ghost" size="icon" className={cn("h-7 w-7", showLabels ? "text-white bg-white/20 hover:bg-white/30" : "text-white/70 hover:text-white hover:bg-white/10")}>
            <Menu className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={onRefetch} variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={handleLockToggle} variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7">
            <Lock className="h-3.5 w-3.5" />
          </Button>
          {!isLocked && (
            <Button onClick={onExitFullscreen} variant="ghost" size="sm" className="bg-red-600/80 hover:bg-red-600 text-white h-7 px-2 text-xs">
              <Minimize className="h-3.5 w-3.5 mr-1" />
              {t('montage.exit')}
            </Button>
          )}
        </div>
      </div>
    </div>
    {showSetPin && (
      <PinPad
        mode={setPinMode}
        onSubmit={handleSetPinSubmit}
        onCancel={handleSetPinCancel}
        error={pinError}
      />
    )}
    </>
  );
}
