
-- ============================================================================
-- PRODUCTIVITY METRICS (AGGREGATE ONLY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS productivity_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  total_work_time INTEGER DEFAULT 0, -- minutes
  total_break_time INTEGER,           -- aggregate only

  sessions_completed INTEGER DEFAULT 0,
  sessions_abandoned INTEGER DEFAULT 0,

  tasks_completed INTEGER DEFAULT 0,
  tasks_abandoned INTEGER DEFAULT 0,

  average_effectiveness DECIMAL(3,2),

  is_off_day BOOLEAN DEFAULT FALSE,
  is_partial_day BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE POLICY "Users can manage own productivity metrics"
ON productivity_metrics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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
