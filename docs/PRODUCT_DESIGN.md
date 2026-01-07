# Mora - Product Design & Architecture

## Product Vision

**Mora** is an intelligent productivity companion that adapts to your mental and emotional state. Unlike traditional productivity apps that force rigid workflows, Mora works *with* you, understanding that productivity isn't just about time management—it's about energy, mood, and context.

## Core Identity

> "A productivity app that understands you're human, not a machine."

Mora combines:
- **Timer-based productivity tracking** (Pomodoro, Stopwatch)
- **Smart project/task management** (Projects → Tasks → Subtasks)
- **Mood-aware intelligence** (Energy, Mood, Context-aware suggestions)

The key differentiator: **Adaptive Intelligence** that suggests what to work on and how long to work based on your current state.

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                     (React + TypeScript)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              UI/UX Components Layer                 │    │
│  │  • Timer Views  • Task Management  • Mood Tracker   │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │           Application State Management              │    │
│  │         (Zustand Stores - Thin Adapters)           │    │
│  └────────────────────┬───────────────────────────────┘    │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS API Calls
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                         BACKEND                              │
│          (Domain-Driven Design + Clean Architecture)         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Application Layer                    │  │
│  │              (Use Cases / Services)                   │  │
│  │  • StartFocusSession  • CreateTask                   │  │
│  │  • TrackMood  • GetMoodSuggestions                   │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │                   Domain Layer                        │  │
│  │           (Business Logic - Pure Domain)              │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │  │
│  │  │   Timer     │  │   Project   │  │ MoodCompanion│ │  │
│  │  │  Aggregate  │  │  Aggregate  │  │  Aggregate   │ │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘ │  │
│  │                                                       │  │
│  │  • Aggregates  • Entities  • Value Objects           │  │
│  │  • Domain Events  • Domain Services                  │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │              Infrastructure Layer                     │  │
│  │  • Repositories (Data Access)                        │  │
│  │  • External Services (Supabase/PostgreSQL)           │  │
│  │  • Event Handlers  • Persistence                     │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Domain Model

### 1. Timer Domain

**Purpose**: Measure productive time, track sessions, predict peak performance

**Aggregates**:
- **Timer** (Root)
  - Properties: mode, status, currentTime, phase, completedSessions
  - Methods: start(), pause(), reset(), tick(), skipPhase()
  - Emits: TimerStarted, TimerCompleted, PhaseTransitioned

**Value Objects**:
- TimerDuration
- PomodoroPhase (focus, short_break, long_break)

**Domain Services**:
- TimerFormatter
- ProductivityAnalyzer (predict peak work times based on history)

**Use Cases**:
- StartTimerSession
- CompleteTimerSession
- AnalyzeProductivityPatterns

---

### 2. Project/Task Domain

**Purpose**: Organize work into hierarchical structure with context

**Aggregates**:
- **Project** (Root)
  - Properties: id, name, tasks[], notes, color, archived
  - Methods: addTask(), removeTask(), updateNotes()
  - Entities within:
    - **Task**
      - Properties: id, title, completed, deadline, urgent, important, notes, subtasks[]
      - Methods: addSubtask(), complete(), updateNotes()
      - Entities within:
        - **Subtask**
          - Properties: id, title, completed
          - Methods: complete()

**Value Objects**:
- TaskPriority (urgent/important matrix)
- Deadline
- TaskNote (rich text content)

**Domain Services**:
- TaskPrioritizer (calculate task priority based on deadlines, flags)
- TaskRecommender (suggest next task based on mood/energy)

**Use Cases**:
- CreateProject
- CreateTask
- CompleteTask
- GetTaskRecommendations

---

### 3. Mood Companion Domain (Core Innovation)

**Purpose**: Track user state and provide adaptive recommendations

**Aggregates**:
- **MoodCompanion** (Root)
  - Properties: currentMood, energyLevel, fatigueLevel, preferences
  - Methods: recordMood(), recordEnergy(), getSuggestions(), trackProductivity()

- **MoodEntry** (Entity)
  - Properties: mood, energy, fatigue, timestamp, notes
  - Methods: validate()

**Value Objects**:
- MoodState (very_low, low, neutral, high)
- EnergyLevel (low, medium, high)
- FatigueLevel (fresh, tired, overworked)
- MoodContext (time of day, recent productivity, task type)

**Domain Services**:
- **MoodAnalyzer**
  - analyzeMoodPattern()
  - predictOptimalWorkTime()
  - assessCapacity()

- **SuggestionEngine** (Most Complex)
  - suggestTask(mood, energy, availableTasks)
  - suggestTimerConfig(mood, energy, fatigue)
  - suggestBreak(fatigueLevel, timeWorked)
  - generateMotivationalMessage(mood, context)
  
- **AdaptiveScheduler**
  - matchTaskToMood(task, moodContext)
  - handleMandatoryTask(task, moodContext) // When user MUST do task despite mood
  - adjustWorkload(moodTrend, tasks)

**Domain Events**:
- MoodRecorded
- EnergyChanged
- SuggestionGenerated
- ProductivityPatternDetected
- BurnoutRiskDetected

**Use Cases**:
- RecordMoodAndEnergy
- GetAdaptiveSuggestions
- HandleMandatoryTaskScenario
- AnalyzeMoodProductivityCorrelation
- GenerateWeeklyInsights

---

## Key Workflows

### Workflow 1: Normal Flow (Without Mood)

User can use Mora as a traditional productivity app:

```
User → Select Project/Task → Start Timer → Work → Complete
```

- No mood tracking required
- Standard Pomodoro timer
- Simple task management
- Basic productivity stats

### Workflow 2: Mood-Assisted Flow (With Mora Companion)

User leverages adaptive intelligence:

```
User → Record Mood/Energy
     → Mora suggests: 
        • Which task to work on (matches mood)
        • Timer configuration (25min vs 15min based on energy)
        • Motivational message
     → User follows or overrides
     → Mora tracks correlation
     → Learns patterns over time
```

### Workflow 3: Mandatory Task Scenario

User has urgent task that doesn't match mood:

```
User: "I must finish this report but I'm exhausted"
     ↓
Mora: "I understand. Let's break it down:
       • 15 min focused session (shorter than usual)
       • Work on easiest part first
       • Take 10 min break after
       • Here's a tip: [coffee break, walk, etc.]"
     ↓
Mora: Adjusts expectations, suggests coping strategies
Tracks this as "forced productivity" session
```

### Workflow 4: Adaptive Suggestions

```
Context: User feeling creative, high energy, morning time
Mora suggests:
  ✓ "Work on: Design UI mockups (creative task)"
  ✓ "Timer: 50 min focus / 10 min break"
  ✓ "Your creative peak time is 9-11 AM"

Context: User feeling tired, low energy, late afternoon  
Mora suggests:
  ✓ "Work on: Code review (low-effort task)"
  ✓ "Timer: 15 min focus / 10 min break"
  ✓ "Consider a 20-min power nap first?"
```

---

## Domain Boundaries & Contexts

### Bounded Context 1: Time Tracking
- Timer Aggregate
- Session History
- Productivity Metrics

### Bounded Context 2: Work Organization
- Project Aggregate
- Task/Subtask Entities
- Notes, Deadlines

### Bounded Context 3: Mood Intelligence (Core)
- MoodCompanion Aggregate
- Mood/Energy/Fatigue tracking
- Suggestion Engine
- Pattern Analysis

### Bounded Context 4: Analytics & Insights
- Productivity Reports
- Mood-Productivity Correlation
- Peak Performance Times
- Weekly/Monthly Trends

**Context Integration**:
- MoodCompanion reads from Timer (completed sessions)
- MoodCompanion reads from Project (available tasks)
- SuggestionEngine combines all contexts
- Domain Events coordinate across boundaries

---

## Data Architecture

### Infrastructure - Supabase/PostgreSQL

**Tables Structure**:

```sql
-- Timer Domain
- timer_sessions (id, user_id, mode, duration, completed_at, phase)
- pomodoro_cycles (session_id, cycle_number, completed)

-- Project Domain  
- projects (id, user_id, name, notes, color, created_at)
- tasks (id, project_id, title, notes, completed, deadline, urgent, important)
- subtasks (id, task_id, title, completed)

-- Mood Domain
- mood_entries (id, user_id, mood, energy, fatigue, notes, recorded_at)
- productivity_patterns (user_id, day_of_week, hour, avg_productivity)
- mood_task_correlations (mood, energy, task_type, completion_rate)

-- Suggestions / History
- suggestions_given (id, user_id, context, suggestion, accepted, timestamp)
- user_preferences (user_id, auto_mood_tracking, preferred_work_duration, ...)
```

**Repositories**:
- TimerRepository
- ProjectRepository  
- TaskRepository
- MoodRepository
- SuggestionRepository
- AnalyticsRepository

---

## Technical Implementation Strategy

### Layer 1: Domain Layer (Pure TypeScript)
- No framework dependencies
- Pure business logic
- Aggregate roots with methods
- Domain events
- Value objects validation

### Layer 2: Application Layer
- Use cases orchestrate domain operations
- Application services coordinate multiple aggregates
- Handle transactions
- Emit integration events

### Layer 3: Infrastructure Layer  
- Supabase client implementation
- Repository implementations
- Event handlers (analytics, notifications)
- External service integrations

### Layer 4: Presentation Layer
- React components (UI/UX)
- Zustand stores (thin state management)
- React hooks (component integration)
- API client (HTTP communication)

---

## Mood Intelligence - Detailed Design

### Mood Tracking Inputs

**Explicit** (User provides):
- Mood selection (energized, focused, creative, tired, stressed, neutral)
- Energy level (1-5 scale)
- Optional note

**Implicit** (System infers):
- Time of day
- Recent productivity (completed sessions)
- Task completion rate
- Break patterns
- Day of week

### Suggestion Algorithm (Simplified)

```typescript
function getSuggestions(context: MoodContext, tasks: Task[]): Suggestion {
  // 1. Assess capacity
  const capacity = assessCapacity(context.mood, context.energy, context.fatigue);
  
  // 2. Match tasks to current state
  const matchedTasks = tasks
    .map(task => ({
      task,
      score: calculateMoodTaskMatch(task, context)
    }))
    .sort((a, b) => b.score - a.score);
  
  // 3. Suggest timer configuration
  const timerConfig = suggestTimerDuration(capacity);
  
  // 4. Generate motivational message
  const message = generateMessage(context.mood, capacity);
  
  return {
    recommendedTask: matchedTasks[0],
    timerConfig,
    message,
    rationale: explainWhy(context, matchedTasks[0])
  };
}
```

### Task-Mood Matching Rules

**Creative mood + High energy** → Suggest:
- Design tasks
- Brainstorming
- Writing/content creation
- Complex problem solving

**Focused mood + Medium energy** → Suggest:
- Coding/development
- Analysis work
- Reading/research
- Planning

**Tired/Low energy** → Suggest:
- Code review
- Simple bug fixes
- Organizing notes
- Admin tasks
- Or: Take a break!

**Stressed/Anxious** → Suggest:
- Small, achievable tasks
- Repetitive/mechanical work
- Short sessions (15 min)
- Or: Breathing exercise, walk

---

## User Experience Flows

### First Time User

1. **Onboarding**
   - "How do you want to work today?"
   - Option A: "Just timer & tasks" (normal mode)
   - Option B: "With mood companion" (adaptive mode)

2. **If Mood Companion selected**
   - "How are you feeling right now?"
   - Quick mood + energy input
   - Get first suggestion
   - Experience adaptive recommendation

### Daily Usage - Mood Mode

1. **Morning check-in**
   - "Good morning! How are you feeling?"
   - Mood + Energy input
   - See recommended tasks
   - Get personalized timer config

2. **During work**
   - Timer runs
   - Periodic check-ins (optional)
   - Break suggestions

3. **Task completion**
   - Celebrate wins
   - Record productivity
   - Update mood if changed

4. **End of day**
   - Summary of productivity
   - Mood pattern visualization
   - Insights: "You're most productive 9-11 AM on Tuesdays"

### Edge Cases

**Case 1: Urgent task, bad mood**
- User: "I must finish X but I'm exhausted"
- Mora: Break it down, adjust expectations, suggest coping strategies
- Track as special scenario

**Case 2: User ignores suggestions**
- Learn from it
- Don't be pushy
- Analyze: Did user make better choice?

**Case 3: Burnout detection**
- Pattern: Multiple low energy days
- Proactive: "You seem tired lately. Consider lighter workload?"
- Suggest: Rest day, delegation

---

## Success Metrics

**Productivity Metrics**:
- Completed pomodoro sessions
- Task completion rate
- Productive time vs. available time

**Mood Intelligence Metrics**:
- Suggestion acceptance rate
- Mood-productivity correlation strength
- User satisfaction with recommendations
- Pattern detection accuracy

**Engagement Metrics**:
- Daily active usage
- Mood tracking consistency
- Task completion velocity
- User retention

---

## Future Enhancements

**Phase 1** (Current): Core timer, tasks, mood tracking
**Phase 2**: Advanced analytics, pattern detection
**Phase 3**: Team features, shared projects
**Phase 4**: AI-powered insights, natural language task input
**Phase 5**: Integration with calendars, Slack, etc.

---

## Technical Considerations

### Scalability
- Separate read/write models (CQRS) for analytics
- Event sourcing for mood/productivity history
- Caching for suggestions

### Privacy
- All mood data encrypted
- User controls data retention
- Optional anonymous analytics

### Performance  
- Offline-first for timer
- Sync mood data when online
- Precompute suggestions

### Testing
- Domain logic: Unit tests (pure functions)
- Use cases: Integration tests
- UI: E2E tests (Playwright/Cypress)

---

## Conclusion

Mora is not just another productivity app—it's a companion that understands productivity is human. By combining proven time management techniques with mood intelligence, we create a system that adapts to users rather than forcing them into rigid workflows.

The DDD architecture ensures the core business logic (especially mood intelligence) remains clean, testable, and maintainable as the product evolves.

**Core Principles**:
1. **Adaptive over Prescriptive**: Suggest, don't dictate
2. **Human-centered**: Acknowledge energy, mood, fatigue
3. **Flexible**: Support both normal and mood-assisted workflows
4. **Intelligent**: Learn patterns, predict optimal work times
5. **Respectful**: Handle mandatory tasks with empathy

This is productivity that works *with* you, not against you.
