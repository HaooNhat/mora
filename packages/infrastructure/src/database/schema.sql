-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LAYER 1: IDENTITY & CONFIGURATION
-- ============================================================================

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  preferred_session_duration INTEGER DEFAULT 25, -- minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User peak energy tracking (normalized to avoid array query pain)
CREATE TABLE IF NOT EXISTS user_peak_hours (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hour INTEGER CHECK (hour BETWEEN 0 AND 23),
  is_peak BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, hour)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LAYER 2: TASKS (Static Identity + Optional Learning Fields)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Core identity
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  
  -- Work classification (required - this is the semantic anchor)
  work_type TEXT NOT NULL CHECK (work_type IN (
    'creative',      -- writing, designing, brainstorming
    'structural',    -- building, coding, system design
    'administrative',-- emails, paperwork, planning
    'maintenance',   -- refactoring, cleaning, organizing
    'passive'        -- reading, learning, watching
  )) DEFAULT 'structural',
  
  -- Priority (Eisenhower Matrix)
  is_important BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,
  
  -- Cognitive profile (optional - learned/inferred over time)
  mental_load INTEGER CHECK (mental_load BETWEEN 1 AND 5), -- nullable, can be inferred
  energy_required INTEGER CHECK (energy_required BETWEEN 1 AND 5), -- nullable, can be inferred
  
  -- Lifecycle
  status TEXT NOT NULL CHECK (status IN (
    'todo',       -- not started
    'in_progress',-- actively working
    'paused',     -- context switched
    'done',       -- completed successfully
    'abandoned',  -- gave up / wrong task
    'deferred'    -- explicitly postponed
  )) DEFAULT 'todo',
  
  -- Scheduling
  deadline TIMESTAMP WITH TIME ZONE,
  scheduled_for DATE, -- when user plans to work on this
  estimated_duration INTEGER, -- minutes (user estimate or learned average)
  
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LAYER 3: DAILY CONTEXT (Ephemeral Planning & Reflection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_intentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Morning planning
  focus_theme TEXT, -- "Ship MVP", "Learning day", "Admin catch-up"
  morning_mood TEXT CHECK (morning_mood IN ('bad', 'neutral', 'good')),
  morning_energy TEXT CHECK (morning_energy IN ('bad', 'neutral', 'good')),
  planned_task_ids UUID[] DEFAULT ARRAY[]::UUID[], -- tasks user wants to attempt
  target_focus_minutes INTEGER DEFAULT 120, -- 2 hours default
  
  -- Evening reflection (filled later in the day)
  evening_mood TEXT CHECK (evening_mood IN ('bad', 'neutral', 'good')),
  evening_energy TEXT CHECK (evening_energy IN ('bad', 'neutral', 'good')),
  perceived_productivity INTEGER CHECK (perceived_productivity BETWEEN 1 AND 5),
  what_went_well TEXT,
  what_was_hard TEXT,
  tomorrow_note TEXT,
  
  -- Context flags
  is_off_day BOOLEAN DEFAULT FALSE, -- intentional rest
  reflected_at TIMESTAMP WITH TIME ZONE, -- when evening reflection completed
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Mood entries (standalone check-ins, not tied to daily intentions)
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('bad', 'neutral', 'good')),
  energy_level TEXT NOT NULL CHECK (energy_level IN ('bad', 'neutral', 'good')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LAYER 4: EXECUTION & FEEDBACK
-- ============================================================================

-- Timer sessions with effectiveness tracking
CREATE TABLE IF NOT EXISTS timer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- nullable for ambient focus
  
  -- Session config
  mode TEXT NOT NULL CHECK (mode IN ('pomodoro', 'stopwatch', 'countdown')),
  phase TEXT CHECK (phase IN ('focus', 'short_break', 'long_break')),
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  planned_duration INTEGER NOT NULL, -- seconds
  actual_duration INTEGER, -- seconds (computed on completion)
  paused_duration INTEGER DEFAULT 0, -- seconds
  
  -- Session state before starting (captured at session start)
  mood_before TEXT CHECK (mood_before IN ('bad', 'neutral', 'good')),
  energy_before TEXT CHECK (energy_before IN ('bad', 'neutral', 'good')),
  
  -- Effectiveness (captured after session)
  completed BOOLEAN DEFAULT FALSE,
  interruptions INTEGER DEFAULT 0,
  perceived_focus INTEGER CHECK (perceived_focus BETWEEN 1 AND 5),
  perceived_productivity INTEGER CHECK (perceived_productivity BETWEEN 1 AND 5),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session reflections (optional deeper check-in after session)
CREATE TABLE IF NOT EXISTS session_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Quick ratings
  focus_quality INTEGER CHECK (focus_quality BETWEEN 1 AND 5),
  output_quality INTEGER CHECK (output_quality BETWEEN 1 AND 5),
  energy_after TEXT CHECK (energy_after IN ('bad', 'neutral', 'good')),
  
  -- Qualitative
  what_worked TEXT,
  what_blocked TEXT,
  would_recommend BOOLEAN, -- would you do this task at this time/mood again?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LAYER 5: LEARNING & ANALYTICS
-- ============================================================================

-- Task-mood correlations (learns which work types succeed when)
CREATE TABLE IF NOT EXISTS task_mood_correlations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Context dimensions
  work_type TEXT NOT NULL CHECK (work_type IN ('creative', 'structural', 'administrative', 'maintenance', 'passive')),
  mood TEXT NOT NULL CHECK (mood IN ('bad', 'neutral', 'good')),
  energy TEXT NOT NULL CHECK (energy IN ('bad', 'neutral', 'good')),
  time_of_day_bucket INTEGER CHECK (time_of_day_bucket BETWEEN 0 AND 23), -- hour of day
  
  -- Learned effectiveness
  sessions_count INTEGER DEFAULT 0,
  avg_perceived_focus DECIMAL(3,2),
  avg_perceived_productivity DECIMAL(3,2),
  avg_completion_rate DECIMAL(3,2),
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, work_type, mood, energy, time_of_day_bucket)
);

-- Productivity metrics (realistic, nullable computed metrics)
CREATE TABLE IF NOT EXISTS productivity_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Raw counts (always present)
  total_focus_time INTEGER DEFAULT 0, -- minutes
  sessions_completed INTEGER DEFAULT 0,
  sessions_abandoned INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_abandoned INTEGER DEFAULT 0,
  
  -- Computed metrics (nullable - may not be meaningful)
  average_session_duration INTEGER, -- minutes, null if no sessions
  completion_rate INTEGER, -- percentage, null if no tasks
  average_focus_rating DECIMAL(3,2), -- null if no ratings
  average_productivity_rating DECIMAL(3,2), -- null if no ratings
  
  -- Context
  is_off_day BOOLEAN DEFAULT FALSE,
  is_partial_day BOOLEAN DEFAULT FALSE, -- incomplete data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Core lookups
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_work_type ON tasks(work_type);
CREATE INDEX idx_tasks_scheduled_for ON tasks(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Task recommendation queries
CREATE INDEX idx_tasks_cognitive_profile ON tasks(work_type, mental_load, energy_required) 
  WHERE status IN ('todo', 'in_progress', 'paused');

-- Subtasks
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);

-- Sessions and reflections
CREATE INDEX idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX idx_timer_sessions_started_at ON timer_sessions(started_at);
CREATE INDEX idx_timer_sessions_task_id ON timer_sessions(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_session_reflections_session_id ON session_reflections(session_id);
CREATE INDEX idx_session_reflections_user_id ON session_reflections(user_id);

-- Daily context
CREATE INDEX idx_daily_intentions_user_date ON daily_intentions(user_id, date);
CREATE INDEX idx_daily_intentions_unreflected ON daily_intentions(user_id, date) 
  WHERE reflected_at IS NULL;
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);

-- Learning tables
CREATE INDEX idx_task_mood_correlations_lookup ON task_mood_correlations(user_id, work_type, mood, energy);
CREATE INDEX idx_productivity_metrics_user_date ON productivity_metrics(user_id, date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_intentions_updated_at BEFORE UPDATE ON daily_intentions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-learn from completed sessions
CREATE OR REPLACE FUNCTION update_task_mood_correlation()
RETURNS TRIGGER AS $$
DECLARE
  task_work_type TEXT;
  session_mood TEXT;
  session_energy TEXT;
  time_bucket INTEGER;
BEGIN
  -- Only process completed sessions with ratings
  IF NEW.completed AND NEW.perceived_focus IS NOT NULL AND NEW.perceived_productivity IS NOT NULL THEN
    -- Get task work type (skip if no task)
    IF NEW.task_id IS NOT NULL THEN
      SELECT work_type INTO task_work_type FROM tasks WHERE id = NEW.task_id;
      
      IF task_work_type IS NOT NULL AND NEW.mood_before IS NOT NULL AND NEW.energy_before IS NOT NULL THEN
        session_mood := NEW.mood_before;
        session_energy := NEW.energy_before;
        time_bucket := EXTRACT(HOUR FROM NEW.started_at);
        
        -- Upsert correlation data
        INSERT INTO task_mood_correlations (
          user_id, work_type, mood, energy, time_of_day_bucket,
          sessions_count, avg_perceived_focus, avg_perceived_productivity
        )
        VALUES (
          NEW.user_id, task_work_type, session_mood, session_energy, time_bucket,
          1, NEW.perceived_focus, NEW.perceived_productivity
        )
        ON CONFLICT (user_id, work_type, mood, energy, time_of_day_bucket)
        DO UPDATE SET
          sessions_count = task_mood_correlations.sessions_count + 1,
          avg_perceived_focus = (
            task_mood_correlations.avg_perceived_focus * task_mood_correlations.sessions_count + NEW.perceived_focus
          ) / (task_mood_correlations.sessions_count + 1),
          avg_perceived_productivity = (
            task_mood_correlations.avg_perceived_productivity * task_mood_correlations.sessions_count + NEW.perceived_productivity
          ) / (task_mood_correlations.sessions_count + 1),
          last_updated = NOW();
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_correlation_after_session
AFTER UPDATE ON timer_sessions
FOR EACH ROW
WHEN (NEW.completed = true AND OLD.completed = false)
EXECUTE FUNCTION update_task_mood_correlation();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_peak_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_mood_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reflections ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User peak hours policies
CREATE POLICY "Users can manage own peak hours" ON user_peak_hours
  FOR ALL USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Subtasks policies
CREATE POLICY "Users can view own subtasks" ON subtasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can create own subtasks" ON subtasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can update own subtasks" ON subtasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own subtasks" ON subtasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );

-- Timer sessions policies
CREATE POLICY "Users can manage own timer sessions" ON timer_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Mood entries policies
CREATE POLICY "Users can manage own mood entries" ON mood_entries
  FOR ALL USING (auth.uid() = user_id);

-- Daily intentions policies
CREATE POLICY "Users can manage own daily intentions" ON daily_intentions
  FOR ALL USING (auth.uid() = user_id);

-- Productivity metrics policies
CREATE POLICY "Users can manage own productivity metrics" ON productivity_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Task-mood correlations policies
CREATE POLICY "Users can manage own correlations" ON task_mood_correlations
  FOR ALL USING (auth.uid() = user_id);

-- Session reflections policies
CREATE POLICY "Users can manage own reflections" ON session_reflections
  FOR ALL USING (auth.uid() = user_id);
