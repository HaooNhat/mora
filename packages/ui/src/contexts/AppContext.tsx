/**
 * Global application context for managing cross-feature state
 * Coordinates timer, music, settings, and UI states
 */

import { useMusic } from "@workspace/features/music/hooks/useMusic";
import { useTimer } from "@workspace/features/timer/hooks/useTimer";
import type { TimerConfig } from "@workspace/types/Timer";
import React, { createContext, ReactNode, useContext, useEffect } from "react";

// ============================================================================
// Types
// ============================================================================

interface AppSettings {
  /** Backdrop blur amount (0-10, higher = more blur) */
  backdropBlur: number;
  /** Enable animations */
  enableAnimations: boolean;
  /** Auto-start timer after break */
  autoStartTimer: boolean;
  /** Auto-play music when timer starts */
  autoPlayMusic: boolean;
  /** Show notifications */
  showNotifications: boolean;
}

interface AppContextValue {
  // Timer state
  timer: ReturnType<typeof useTimer>;

  // Music state
  music: ReturnType<typeof useMusic>;

  // App settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // UI coordination
  isSessionActive: boolean;
  currentFocusLevel: "low" | "medium" | "high";
}

// ============================================================================
// Context
// ============================================================================

const AppContext = createContext<AppContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialTimerConfig?: Partial<TimerConfig>;
}

export function AppProvider({
  children,
  initialTimerConfig,
}: AppProviderProps) {
  // Initialize hooks
  const timer = useTimer({
    config: initialTimerConfig,
    onComplete: (mode) => {
      console.log(`Timer completed: ${mode}`);
      // Trigger notifications, sound effects, etc.
    },
    onPhaseChange: (phase) => {
      console.log(`Phase changed: ${phase}`);
      // Adjust music, blur, etc.
    },
  });

  const music = useMusic({
    autoPlay: false,
    onTrackChange: (track) => {
      console.log(`Now playing: ${track?.title}`);
    },
  });

  const defaultSettings: AppSettings = {
    backdropBlur: 5,
    enableAnimations: true,
    autoStartTimer: false,
    autoPlayMusic: false,
    showNotifications: true,
  };

  // App settings with localStorage persistence
  const [settings, setSettings] = React.useState<AppSettings>(() => {
    if (typeof window === "undefined") {
      return {
        backdropBlur: 5,
        enableAnimations: true,
        autoStartTimer: false,
        autoPlayMusic: false,
        showNotifications: true,
      };
    }

    try {
      const saved = localStorage.getItem("app_settings");
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("Failed to load app settings:", error);
    }

    return defaultSettings;
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("app_settings", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save app settings:", error);
    }
  }, [settings]);

  // Update settings helper
  const updateSettings = React.useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Derive computed state
  const isSessionActive = timer.isRunning;

  const currentFocusLevel = React.useMemo(() => {
    if (!timer.isRunning) return "low";

    // Adjust focus level based on timer mode and phase
    if (timer.state.mode === "pomodoro") {
      if (timer.pomodoroPhase === "focus") return "high";
      return "low";
    }

    if (timer.state.mode === "countdown") return "high";
    return "medium";
  }, [timer.isRunning, timer.state.mode, timer.pomodoroPhase]);

  // Coordinate blur with timer state
  useEffect(() => {
    if (isSessionActive) {
      // Reduce blur when focusing
      updateSettings({ backdropBlur: 0 });
    } else {
      // Restore blur when idle
      updateSettings({ backdropBlur: 5 });
    }
  }, [isSessionActive, updateSettings]);

  // Coordinate music with timer (optional)
  useEffect(() => {
    if (settings.autoPlayMusic) {
      if (isSessionActive && !music.playbackState.isPlaying) {
        // Start music when timer starts
        const focusPlaylist = music.playlists.find(
          (p) => p.type === "focus" || p.type === "lofi",
        );
        if (focusPlaylist && focusPlaylist.trackIds.length > 0) {
          const track = music.tracks.find(
            (t) => t.id === focusPlaylist.trackIds[0],
          );
          if (track) {
            music.playTrack(track, focusPlaylist);
          }
        }
      } else if (!isSessionActive && music.playbackState.isPlaying) {
        // Pause music when timer stops
        music.pause();
      }
    }
  }, [isSessionActive, settings.autoPlayMusic, music]);

  // Context value
  const value: AppContextValue = {
    timer,
    music,
    settings,
    updateSettings,
    isSessionActive,
    currentFocusLevel,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access global app context
 * @throws Error if used outside AppProvider
 */
export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return context;
}

// ============================================================================
// Convenience hooks for specific features
// ============================================================================

/** Access timer state only */
export function useAppTimer() {
  return useAppContext().timer;
}

/** Access music state only */
export function useAppMusic() {
  return useAppContext().music;
}

/** Access settings only */
export function useAppSettings() {
  const { settings, updateSettings } = useAppContext();
  return { settings, updateSettings };
}
