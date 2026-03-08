CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,

  default_focus_duration INTEGER DEFAULT 25 CHECK (default_focus_duration > 0), -- UI hint only

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT project_color_hex
  CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,

  work_type TEXT NOT NULL CHECK (work_type IN (
    'deep',
    'creative',
    'repetitive',
    'light'
  )),

  is_important BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,

  status TEXT NOT NULL CHECK (status IN (
    'todo',
    'in_progress',
    'paused',
    'done'
  )) DEFAULT 'todo',

  deferred_until DATE,
  abandoned_at TIMESTAMP WITH TIME ZONE,

  estimated_duration INTEGER CHECK (estimated_duration IS NULL OR estimated_duration > 0),

  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT task_project_same_user
  CHECK (
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_id
        AND p.user_id = user_id
    )
  ),

  CONSTRAINT task_status_completed_consistency
  CHECK (
    (status = 'done' AND completed_at IS NOT NULL)
    OR
    (status <> 'done' AND completed_at IS NULL)
  ),

  CONSTRAINT task_abandoned_logic
  CHECK (
    abandoned_at IS NULL
    OR status IN ('todo', 'paused')
  )
);

CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TIMER SESSIONS (AROUSAL-BASED)
-- ============================================================================

CREATE TABLE IF NOT EXISTS timer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  timer_type TEXT NOT NULL CHECK (timer_type IN ('pomodoro', 'stopwatch')),

  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,

  arousal_start DECIMAL(3,2) CHECK (arousal_start BETWEEN 0 AND 1),
  arousal_end DECIMAL(3,2) CHECK (arousal_end BETWEEN 0 AND 1),

  effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 5),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT timer_task_same_user
  CHECK (
    task_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM tasks t
      WHERE t.id = task_id
        AND t.user_id = user_id
    )
  ),

  CONSTRAINT timer_end_consistency
  CHECK (
    (ended_at IS NULL AND ended_reason IS NULL)
    OR
    (ended_at IS NOT NULL AND ended_reason IS NOT NULL)
  ),

  CONSTRAINT timer_end_after_start
  CHECK (ended_at IS NULL OR ended_at >= started_at),

  CONSTRAINT interruption_only_when_interrupted
CHECK (
  interruption_type IS NULL
  OR ended_reason = 'interrupted'
)
);

CREATE TABLE IF NOT EXISTS timer_session_pauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,

  paused_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resumed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT resumed_at_after_paused_at
  CHECK (resumed_at IS NULL OR resumed_at >= paused_at);
);


create table user_cognitive_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,

  optimal_arousal_center NUMERIC(3,2) NOT NULL CHECK (optimal_arousal_center BETWEEN 0 AND 1) DEFAULT 0.5,
  arousal_spread NUMERIC(3,2) NOT NULL CHECK (arousal_spread > 0 AND arousal_spread <= 1) DEFAULT 0.25,

  task_type_offsets JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
  jsonb_typeof(task_type_offsets) = 'object'
),

  confidence NUMERIC(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1) DEFAULT 0.0,
    updated_at timestamptz not null default now()
);


CREATE OR REPLACE VIEW timer_session_durations AS
SELECT
  s.id,
  s.user_id,
  s.task_id,
  EXTRACT(EPOCH FROM (s.ended_at - s.started_at))
  - COALESCE((
    SELECT SUM(EXTRACT(EPOCH FROM (p.resumed_at - p.paused_at)))
    FROM timer_session_pauses p
    WHERE p.session_id = s.id
      AND p.resumed_at IS NOT NULL
  ), 0) AS actual_duration_seconds
FROM timer_sessions s
WHERE s.ended_at IS NOT NULL;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

create function init_user_cognitive_preference()
returns trigger
language plpgsql
as $$
begin
  insert into user_cognitive_preferences (user_id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at
BEFORE UPDATE ON subtasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id);


CREATE POLICY "Users can manage own projects"
ON projects
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can manage own tasks"
ON tasks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own subtasks"
ON subtasks
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM tasks
    WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tasks
    WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage own timer sessions"
ON timer_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own timer pauses"
ON timer_session_pauses
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM timer_sessions
    WHERE timer_sessions.id = timer_session_pauses.session_id
      AND timer_sessions.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM timer_sessions
    WHERE timer_sessions.id = timer_session_pauses.session_id
      AND timer_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage own cognitive preferences"
ON user_cognitive_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

create trigger on_user_created_preference
after insert on users
for each row
execute function init_user_cognitive_preference();

CREATE INDEX ON projects(user_id);
CREATE INDEX ON tasks(user_id);
CREATE INDEX ON tasks(project_id);
CREATE INDEX ON timer_sessions(user_id);
CREATE INDEX ON timer_sessions(task_id);
CREATE INDEX ON timer_session_pauses(session_id);
CREATE INDEX ON subtasks(task_id);
CREATE UNIQUE INDEX one_open_pause_per_session
ON timer_session_pauses(session_id)
WHERE resumed_at IS NULL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_session_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cognitive_preferences ENABLE ROW LEVEL SECURITY;
