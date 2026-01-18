# Timer Domain - DDD-Lite Architecture

This document explains the Domain-Driven Design (DDD) architecture implemented for the Timer domain.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│              (React Components + Hooks)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ use-timer hook
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 State Management Layer                   │
│                   (timer-store.ts)                       │
│                  Zustand Store (thin)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ delegates to
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│            (TimerApplicationService.ts)                  │
│  • Orchestrates domain operations                       │
│  • Handles persistence via repository                   │
│  • Emits domain events                                  │
└────────────────────┬────────────────────────────────────┘
                     │
           ┌─────────┴─────────┐
           ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│  Domain Layer    │  │ Infrastructure   │
│    (Timer.ts)    │  │ (Repository.ts)  │
│                  │  │                  │
│ • Timer Agg Root │  │ • localStorage   │
│ • Domain Events  │  │ • Persistence    │
│ • Business Logic │  │                  │
└──────────────────┘  └──────────────────┘
```

## Layer Responsibilities

### 1. Domain Layer (`packages/domain/src/timer/`)

**Purpose**: Pure business logic, framework-agnostic

**Key Components**:

- **Timer.ts** (Aggregate Root)
  - Encapsulates timer state and behavior
  - Methods: `start()`, `pause()`, `reset()`, `tick()`, `skipPhase()`
  - Factory methods: `createPomodoro()`, `createStopwatch()`
  - Validates business invariants
  - Emits domain events
  - Immutable - returns new instances

- **timer.events.ts** (Domain Events)
  - `TimerStartedEvent`, `TimerPausedEvent`, `TimerCompletedEvent`
  - `PhaseTransitionedEvent`, etc.
  - Named in past tense (things that happened)

- **TimerFormatter.ts** (Domain Service)
  - `formatTime()`: Format seconds to human-readable
  - `parseTimeString()`: Parse time strings
  - Domain logic that doesn't belong to aggregate

- **types.ts, schema.ts, constants.ts**
  - Type definitions
  - Configuration schemas
  - Domain constants

### 2. Application Layer (`packages/application/src/timer/`)

**Purpose**: Orchestrate use cases, coordinate domain & infrastructure

**Key Components**:

- **TimerApplicationService.ts**
  - Coordinates timer operations
  - Calls domain aggregate methods
  - Persists via repository
  - Emits events to handlers
  - Manages application state

- **TimerRepository.ts** (Infrastructure implementation)
  - Implements `ITimerRepository` interface
  - Saves/loads timer state to/from localStorage
  - Serialization/deserialization logic

### 3. State Management (`packages/application/src/stores/`)

**Purpose**: Bridge between React and Application Service

- **timer-store.ts** (Zustand Store)
  - Thin adapter - NO business logic
  - Delegates all operations to `TimerApplicationService`
  - Manages React state updates

### 4. Presentation Layer (`packages/application/src/hooks/`)

- **use-timer.ts**
  - React hook for components
  - Initializes timer on mount
  - Manages timer interval
  - Provides formatted values

## Key DDD Concepts Applied

### 1. Aggregate Root Pattern

```typescript
const timer = Timer.createPomodoro(config);
const updatedTimer = timer.start(); // Returns new instance
const tickedTimer = updatedTimer.tick();
```

### 2. Domain Events

```typescript
const timer = timer.start();
const events = timer.getDomainEvents();
// [TimerStartedEvent { occurredAt: 123456, mode: 'pomodoro' }]
```

### 3. Repository Pattern

```typescript
interface ITimerRepository {
  save(timer: Timer): Promise<void>;
  load(): Promise<Timer | null>;
  clear(): Promise<void>;
}
```

### 4. Application Service Pattern

```typescript
const service = new TimerApplicationService(repository, eventHandlers);
await service.start(); // Coordinates domain + persistence
```

## Migration from Old Architecture

### Old (Procedural)

```typescript
// Stateless functions
const newState = tickTimer(state, config);
const started = startTimer(state);
```

### New (DDD)

```typescript
// Aggregate with encapsulated behavior
const timer = Timer.createPomodoro(config);
const started = timer.start();
const ticked = started.tick();
```

## Benefits

1. **Encapsulation**: Timer behavior is in one place
2. **Testability**: Pure domain logic, easy to test
3. **Maintainability**: Clear separation of concerns
4. **Extensibility**: Easy to add new features
5. **Type Safety**: Strong typing throughout
6. **Event-Driven**: Can add event handlers for analytics, notifications, etc.

## Usage Examples

### Basic Timer Flow

```typescript
// Create timer
const timer = Timer.createPomodoro(config);

// Start timer
const running = timer.start();

// Tick every second
const ticked = running.tick();

// Pause
const paused = ticked.pause();

// Resume
const resumed = paused.start();
```

### Using Application Service

```typescript
const repository = new LocalStorageTimerRepository();
const service = new TimerApplicationService(repository);

await service.initialize();
await service.start();
await service.tick();
await service.pause();
```

### Using in React

```typescript
function TimerComponent() {
  const {
    timer,
    progress,
    formattedTime,
    start,
    pause
  } = useTimer();

  return (
    <div>
      <div>{formattedTime}</div>
      <button onClick={start}>Start</button>
      <button onClick={pause}>Pause</button>
    </div>
  );
}
```

## Testing

Domain layer can be tested in isolation:

```typescript
test("timer starts from idle", () => {
  const timer = Timer.createPomodoro(config);
  expect(timer.status).toBe("idle");

  const started = timer.start();
  expect(started.status).toBe("running");

  const events = started.getDomainEvents();
  expect(events[0]).toBeInstanceOf(TimerStartedEvent);
});
```

## Future Enhancements

1. **Event Sourcing**: Store all events for replay
2. **Command Pattern**: Wrap operations in command objects
3. **Sagas**: Handle complex workflows
4. **Integration Events**: Publish to external systems
5. **CQRS**: Separate read/write models
