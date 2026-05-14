/**
 * Hook for fullscreen mode management
 *
 * Handles fullscreen state and persistence. Controls are always visible
 * (no toggle/auto-hide logic needed).
 */

import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../../stores/settings';
import type { Profile } from '../../../api/types';
import type { ProfileSettings } from '../../../stores/settings';

interface UseFullscreenModeOptions {
  currentProfile: Profile | null;
  settings: ProfileSettings;
}

interface UseFullscreenModeReturn {
  isFullscreen: boolean;
  handleToggleFullscreen: (fullscreen: boolean) => void;
}

export function useFullscreenMode({
  currentProfile,
  settings,
}: UseFullscreenModeOptions): UseFullscreenModeReturn {
  const updateSettings = useSettingsStore((state) => state.updateProfileSettings);

  const [isFullscreen, setIsFullscreen] = useState(settings.montageIsFullscreen);

  // Update fullscreen state when profile changes
  useEffect(() => {
    setIsFullscreen(settings.montageIsFullscreen);
  }, [currentProfile?.id, settings.montageIsFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
        if (currentProfile) {
          updateSettings(currentProfile.id, { montageIsFullscreen: false });
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen, currentProfile, updateSettings]);

  const handleToggleFullscreen = useCallback(
    (fullscreen: boolean) => {
      if (!currentProfile) return;

      setIsFullscreen(fullscreen);
      updateSettings(currentProfile.id, {
        montageIsFullscreen: fullscreen,
      });
    if (fullscreen) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    },
    [currentProfile, updateSettings]
  );

  return {
    isFullscreen,
    handleToggleFullscreen,
  };
}
