# Timer System Usage

This document explains how to use the timer system with Zustand for optimal performance.

## Architecture

The timer system is split across three layers:

### 1. Core (`@workspace/core/timer`)
Pure TypeScript logic with no React dependencies:
- **Types** (`types.ts`): Timer modes, states, and phases
- **Schema** (`schema.ts`): Zod schemas for configuration validation
- **Constants** (`constants.ts`): Default configs and presets
- **Engine** (`engine.ts`): Pure functions for timer operations

### 2. Store (`frontend/stores/timer-store.ts`)
Zustand store that holds timer state:
- Manages timer state globally
- Provides actions to control the timer
- Uses core engine functions for state transitions
- Optimized for performance (no unnecessary re-renders)

### 3. Hook (`frontend/hooks/use-timer.ts`)
React hook for easy component integration:
- Manages the interval for ticking
- Provides formatted values
- Exposes all timer actions

## Basic Usage

```tsx
import useTimer from '@/hooks/use-timer';

function TimerComponent() {
  const {
    formattedTime,
    progress,
    isRunning,
    isPaused,
    timerState,
    start,
    pause,
    reset,
    skipPhase,
  } = useTimer();

  return (
    <div>
      <h1>{formattedTime}</h1>
      <div>Progress: {progress.toFixed(0)}%</div>
      
      {timerState.mode === 'pomodoro' && timerState.pomodoro && (
        <div>
          <p>Phase: {timerState.pomodoro.phase}</p>
          <p>Session: {timerState.pomodoro.session}</p>
          <p>Completed: {timerState.pomodoro.completedSessions}</p>
        </div>
      )}

      <button onClick={start} disabled={isRunning}>
        Start
      </button>
      <button onClick={pause} disabled={!isRunning}>
        Pause
      </button>
      <button onClick={reset}>
        Reset
      </button>
      {timerState.mode === 'pomodoro' && (
        <button onClick={skipPhase}>
          Skip Phase
        </button>
      )}
    </div>
  );
}
```

## Advanced Configuration

```tsx
import useTimer from '@/hooks/use-timer';
import { POMODORO_PRESETS } from '../../../core/src/timer/index.js';

function SettingsComponent() {
  const { config, updateConfig, setMode, setAutoWork, setAutoBreak } = useTimer();

  const handlePresetChange = (preset: keyof typeof POMODORO_PRESETS) => {
    updateConfig({
      pomodoro: POMODORO_PRESETS[preset],
    });
  };

  return (
    <div>
      <h2>Timer Settings</h2>
      
      {/* Mode Selection */}
      <select onChange={(e) => setMode(e.target.value as 'pomodoro' | 'stopwatch')}>
        <option value="pomodoro">Pomodoro</option>
        <option value="stopwatch">Stopwatch</option>
      </select>

      {/* Pomodoro Presets */}
      <select onChange={(e) => handlePresetChange(e.target.value as any)}>
        <option value="classic">Classic (25/5/15)</option>
        <option value="mini">Mini (15/3/10)</option>
        <option value="extended">Extended (50/10/30)</option>
        <option value="cycle52_17">52/17 Cycle</option>
        <option value="cycle90_30">90/30 Cycle</option>
      </select>

      {/* Auto Transitions */}
      <label>
        <input
          type="checkbox"
          checked={timerState.autoWork}
          onChange={(e) => setAutoWork(e.target.checked)}
        />
        Auto-start work sessions
      </label>
      <label>
        <input
          type="checkbox"
          checked={timerState.autoBreak}
          onChange={(e) => setAutoBreak(e.target.checked)}
        />
        Auto-start breaks
      </label>

      {/* Custom Configuration */}
      <div>
        <h3>Custom Pomodoro Settings</h3>
        <input
          type="number"
          value={config.pomodoro.workDuration}
          onChange={(e) => updateConfig({
            pomodoro: {
              ...config.pomodoro,
              workDuration: parseInt(e.target.value),
            },
          })}
        />
        <label>Work Duration (minutes)</label>
      </div>
    </div>
  );
}
```

## Direct Store Access

For advanced use cases, you can access the store directly:

```tsx
import { useTimerStore } from '../stores/timer-store.js';

function AdvancedComponent() {
  // Select only what you need to avoid unnecessary re-renders
  const currentTime = useTimerStore((state) => state.timerState.currentTime);
  const status = useTimerStore((state) => state.timerState.status);
  const start = useTimerStore((state) => state.start);

  // Only re-renders when currentTime or status changes
  return (
    <div>
      <p>Time: {currentTime}s</p>
      <p>Status: {status}</p>
      <button onClick={start}>Start</button>
    </div>
  );
}
```

## Performance Optimization

The timer uses Zustand for optimal performance:

1. **No Context Re-renders**: Unlike Context API, Zustand doesn't cause full tree re-renders
2. **Selective Subscriptions**: Components only re-render when their selected state changes
3. **Pure Functions**: Core logic is pure and easy to test
4. **Single Source of Truth**: All timer state is in one store

## Timer Flow

### Pomodoro Mode
1. Start with focus phase (default 25 minutes)
2. Count down each second
3. When complete:
   - If auto-break enabled: automatically start break
   - Otherwise: wait for manual start
4. After break:
   - If auto-work enabled: automatically start next focus
   - Otherwise: wait for manual start
5. Every N sessions (default 4): long break instead of short break

### Stopwatch Mode
1. Start at 0
2. Count up each second
3. Optional max duration (stops automatically)

## State Shape

```typescript
{
  timerState: {
    mode: 'pomodoro' | 'stopwatch',
    status: 'idle' | 'running' | 'paused' | 'completed',
    currentTime: number,        // seconds
    totalTime: number,          // seconds
    startTime: number,          // timestamp
    pausedTime: number,         // seconds
    autoWork: boolean,
    autoBreak: boolean,
    pomodoro: {
      phase: 'focus' | 'short_break' | 'long_break',
      session: number,
      completedSessions: number,
    } | null
  },
  config: {
    pomodoro: {
      workDuration: number,             // minutes
      shortBreakDuration: number,       // minutes
      longBreakDuration: number,        // minutes
      sessionsUntilLongBreak: number,
    },
    stopwatch: {
      maxDuration: number | undefined,  // minutes
    }
  }
}
```

## Validation with Zod

All timer configurations are validated with Zod:

```typescript
import { TimerConfigSchema } from '../../../core/src/timer/index.js';

// This will throw if invalid
const validatedConfig = TimerConfigSchema.parse({
  pomodoro: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  stopwatch: {
    maxDuration: 60,
  },
});
```

## Available Core Functions

All exported from `@workspace/core/timer`:

- `createInitialTimerState(mode, config)` - Create fresh timer state
- `tickTimer(state, config)` - Advance timer by 1 second
- `startTimer(state)` - Start/resume timer
- `pauseTimer(state)` - Pause timer
- `resetTimer(state, config)` - Reset to initial state
- `skipPomodoroPhase(state, config)` - Skip to next phase
- `formatTime(seconds, format)` - Format seconds to string
- `calculateProgress(state)` - Get progress percentage
- `getPhaseDuration(phase, config)` - Get phase duration
- `getNextPomodoroPhase(state, config)` - Get next phase
- `validateTimerConfig(config)` - Validate config with Zod
