


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ended_reason_enum" AS ENUM (
    'finished',
    'abandoned',
    'interrupted',
    'crashed'
);


ALTER TYPE "public"."ended_reason_enum" OWNER TO "postgres";


CREATE TYPE "public"."task_status_enum" AS ENUM (
    'todo',
    'in_progress',
    'done',
    'paused'
);


ALTER TYPE "public"."task_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."timer_type_enum" AS ENUM (
    'pomodoro',
    'stopwatch'
);


ALTER TYPE "public"."timer_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."work_type_enum" AS ENUM (
    'deep',
    'creative',
    'repetitive',
    'light'
);


ALTER TYPE "public"."work_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_subtask_to_task"("p_task_id" "uuid", "p_text" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_subtasks JSONB;
  v_new_subtask JSONB;
  v_next_order INT;
BEGIN
  -- Get current subtasks
  SELECT subtasks INTO v_subtasks FROM tasks WHERE id = p_task_id;
  
  -- Initialize if null
  IF v_subtasks IS NULL THEN
    v_subtasks := '[]'::jsonb;
  END IF;
  
  -- Calculate next order
  SELECT COALESCE(MAX((elem->>'order')::int) + 1, 0)
  INTO v_next_order
  FROM jsonb_array_elements(v_subtasks) elem;
  
  -- Create new subtask
  v_new_subtask := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'order', v_next_order,
    'text', p_text,
    'done', false
  );
  
  -- Append to array
  v_subtasks := v_subtasks || v_new_subtask;
  
  -- Update task
  UPDATE tasks 
  SET subtasks = v_subtasks, updated_at = NOW()
  WHERE id = p_task_id;
  
  RETURN v_new_subtask;
END;
$$;


ALTER FUNCTION "public"."add_subtask_to_task"("p_task_id" "uuid", "p_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_subtask_to_task"("p_task_id" "uuid", "p_text" "text") IS 'Add a new subtask to a task. Returns the created subtask object.';



CREATE OR REPLACE FUNCTION "public"."delete_subtask"("p_task_id" "uuid", "p_subtask_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_subtasks JSONB;
  v_new_subtasks JSONB;
  v_reordered JSONB;
BEGIN
  -- Get current subtasks
  SELECT subtasks INTO v_subtasks FROM tasks WHERE id = p_task_id;
  
  IF v_subtasks IS NULL THEN
    RAISE EXCEPTION 'Task has no subtasks';
  END IF;
  
  -- Remove the subtask
  SELECT jsonb_agg(elem)
  INTO v_new_subtasks
  FROM jsonb_array_elements(v_subtasks) elem
  WHERE elem->>'id' != p_subtask_id;
  
  -- Reorder remaining subtasks
  SELECT jsonb_agg(
    jsonb_set(elem, '{order}', to_jsonb((row_number() OVER ()) - 1))
  )
  INTO v_reordered
  FROM jsonb_array_elements(v_new_subtasks) elem;
  
  -- Update task
  UPDATE tasks 
  SET subtasks = COALESCE(v_reordered, '[]'::jsonb), updated_at = NOW()
  WHERE id = p_task_id;
END;
$$;


ALTER FUNCTION "public"."delete_subtask"("p_task_id" "uuid", "p_subtask_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_subtask"("p_task_id" "uuid", "p_subtask_id" "text") IS 'Delete a subtask and reorder remaining subtasks.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- Insert into public.users table
  -- INSERT INTO public.users (
  --   id,
  --   name,              -- Changed from full_name to name
  --   avatar_url,
  --   default_focus_duration,
  --   created_at,
  --   updated_at
  -- )
  -- VALUES (
  --   new.id,
  --   -- Try multiple metadata fields for name
  --   COALESCE(
  --     new.raw_user_meta_data->>'full_name',
  --     new.raw_user_meta_data->>'name',
  --     new.email,  -- Fallback to email if no name
  --     "Users"
  --   ),
  --   -- Try multiple metadata fields for avatar
  --   COALESCE(
  --     new.raw_user_meta_data->>'avatar_url',
  --     new.raw_user_meta_data->>'picture'  -- Google uses 'picture'
  --   ),
  --   25,
  --   NOW(),
  --   NOW()
  -- );

  -- Also create default cognitive preferences
  -- INSERT INTO public.user_cognitive_preferences (
  --   user_id,
  --   optimal_arousal_center,
  --   arousal_spread,
  --   task_type_offsets,
  --   confidence,
  --   updated_at
  -- )
  -- VALUES (
  --   new.id,
  --   0.6,      -- Default optimal arousal
  --   0.2,      -- Default spread
  --   '{
  --     "deep": 0,
  --     "creative": 0,
  --     "repetitive": 0,
  --     "light": 0
  --   }'::jsonb,
  --   0.0,      -- No confidence yet
  --   NOW()
  -- );

  RETURN new;
END;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Automatically creates a public.users record and default cognitive preferences when a new auth.users record is created';



CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_updated_at"() IS 'Automatically updates the updated_at timestamp on row updates';



CREATE OR REPLACE FUNCTION "public"."init_user_cognitive_preference"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into user_cognitive_preferences (user_id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."init_user_cognitive_preference"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_subtask"("p_task_id" "uuid", "p_subtask_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_subtasks JSONB;
  v_subtask JSONB;
  v_index INT := 0;
BEGIN
  -- Get current subtasks
  SELECT subtasks INTO v_subtasks FROM tasks WHERE id = p_task_id;
  
  IF v_subtasks IS NULL THEN
    RAISE EXCEPTION 'Task has no subtasks';
  END IF;
  
  -- Find and toggle the subtask
  FOR v_subtask IN SELECT * FROM jsonb_array_elements(v_subtasks)
  LOOP
    IF v_subtask->>'id' = p_subtask_id THEN
      v_subtasks := jsonb_set(
        v_subtasks,
        ARRAY[v_index::text, 'done'],
        to_jsonb(NOT (v_subtask->>'done')::boolean)
      );
      
      -- Update task
      UPDATE tasks 
      SET subtasks = v_subtasks, updated_at = NOW()
      WHERE id = p_task_id;
      
      RETURN;
    END IF;
    
    v_index := v_index + 1;
  END LOOP;
  
  RAISE EXCEPTION 'Subtask not found';
END;
$$;


ALTER FUNCTION "public"."toggle_subtask"("p_task_id" "uuid", "p_subtask_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."toggle_subtask"("p_task_id" "uuid", "p_subtask_id" "text") IS 'Toggle the done status of a subtask by its ID.';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_color_hex" CHECK ((("color" IS NULL) OR ("color" ~ '^#[0-9A-Fa-f]{6}$'::"text")))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "note" "text",
    "is_important" boolean DEFAULT false,
    "is_urgent" boolean DEFAULT false,
    "deferred_until" "date",
    "abandoned_at" timestamp with time zone,
    "estimated_duration" integer,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "work_type" "public"."work_type_enum" NOT NULL,
    "status" "public"."task_status_enum" NOT NULL,
    "deadline" "date",
    "subtasks" "jsonb",
    CONSTRAINT "tasks_estimated_duration_check" CHECK ((("estimated_duration" IS NULL) OR ("estimated_duration" > 0)))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."subtasks" IS 'Embedded subtasks as JSONB array: [{"id": "uuid", "order": 0, "text": "...", "done": false}]';



CREATE TABLE IF NOT EXISTS "public"."timer_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "arousal_start" numeric(3,2),
    "arousal_end" numeric(3,2),
    "effectiveness" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "timer_type" "public"."timer_type_enum" NOT NULL,
    "ended_reason" "public"."ended_reason_enum",
    "actual_duration" numeric,
    CONSTRAINT "timer_end_after_start" CHECK ((("ended_at" IS NULL) OR ("ended_at" >= "started_at"))),
    CONSTRAINT "timer_sessions_arousal_end_check" CHECK ((("arousal_end" >= 0.1) AND ("arousal_end" <= 0.9))),
    CONSTRAINT "timer_sessions_arousal_start_check" CHECK ((("arousal_start" >= 0.1) AND ("arousal_start" <= 0.9))),
    CONSTRAINT "timer_sessions_effectiveness_check" CHECK ((("effectiveness" >= 1) AND ("effectiveness" <= 5)))
);


ALTER TABLE "public"."timer_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_cognitive_preferences" (
    "user_id" "uuid" NOT NULL,
    "optimal_arousal_center" numeric(3,2) DEFAULT 0.5 NOT NULL,
    "arousal_spread" numeric(3,2) DEFAULT 0.25 NOT NULL,
    "task_type_offsets" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confidence" numeric(3,2) DEFAULT 0.0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_cognitive_preferences_arousal_spread_check" CHECK ((("arousal_spread" > (0)::numeric) AND ("arousal_spread" <= (1)::numeric))),
    CONSTRAINT "user_cognitive_preferences_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "user_cognitive_preferences_optimal_arousal_center_check" CHECK ((("optimal_arousal_center" >= (0)::numeric) AND ("optimal_arousal_center" <= (1)::numeric))),
    CONSTRAINT "user_cognitive_preferences_task_type_offsets_check" CHECK (("jsonb_typeof"("task_type_offsets") = 'object'::"text"))
);


ALTER TABLE "public"."user_cognitive_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "user_id" "uuid" NOT NULL,
    "name" "text",
    "default_focus_duration" integer DEFAULT 25,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "avatar_url" "text",
    CONSTRAINT "users_default_focus_duration_check" CHECK (("default_focus_duration" > 0))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_id_user_unique" UNIQUE ("id", "user_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timer_sessions"
    ADD CONSTRAINT "timer_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_cognitive_preferences"
    ADD CONSTRAINT "user_cognitive_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_tasks_subtasks_gin" ON "public"."tasks" USING "gin" ("subtasks" "jsonb_path_ops");



CREATE INDEX "projects_user_id_idx" ON "public"."projects" USING "btree" ("user_id");



CREATE INDEX "tasks_project_id_idx" ON "public"."tasks" USING "btree" ("project_id");



CREATE INDEX "tasks_user_id_idx" ON "public"."tasks" USING "btree" ("user_id");



CREATE INDEX "timer_sessions_task_id_idx" ON "public"."timer_sessions" USING "btree" ("task_id");



CREATE INDEX "timer_sessions_user_id_idx" ON "public"."timer_sessions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_user_created_preference" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."init_user_cognitive_preference"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_cognitive_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_same_user" FOREIGN KEY ("project_id", "user_id") REFERENCES "public"."projects"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timer_sessions"
    ADD CONSTRAINT "timer_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."timer_sessions"
    ADD CONSTRAINT "timer_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_cognitive_preferences"
    ADD CONSTRAINT "user_cognitive_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Enable users to view their own data only" ON "public"."users" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own cognitive preferences" ON "public"."user_cognitive_preferences" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own projects" ON "public"."projects" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own tasks" ON "public"."tasks" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own timer sessions" ON "public"."timer_sessions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "allow trigger inserts" ON "public"."users" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timer_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_cognitive_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert_self" ON "public"."users" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";





















































drop extension if exists "pg_net";

revoke delete on table "public"."projects" from "anon";

revoke insert on table "public"."projects" from "anon";

revoke references on table "public"."projects" from "anon";

revoke select on table "public"."projects" from "anon";

revoke trigger on table "public"."projects" from "anon";

revoke truncate on table "public"."projects" from "anon";

revoke update on table "public"."projects" from "anon";

revoke delete on table "public"."projects" from "authenticated";

revoke insert on table "public"."projects" from "authenticated";

revoke references on table "public"."projects" from "authenticated";

revoke select on table "public"."projects" from "authenticated";

revoke trigger on table "public"."projects" from "authenticated";

revoke truncate on table "public"."projects" from "authenticated";

revoke update on table "public"."projects" from "authenticated";

revoke delete on table "public"."projects" from "service_role";

revoke insert on table "public"."projects" from "service_role";

revoke references on table "public"."projects" from "service_role";

revoke select on table "public"."projects" from "service_role";

revoke trigger on table "public"."projects" from "service_role";

revoke truncate on table "public"."projects" from "service_role";

revoke update on table "public"."projects" from "service_role";

revoke delete on table "public"."tasks" from "anon";

revoke insert on table "public"."tasks" from "anon";

revoke references on table "public"."tasks" from "anon";

revoke select on table "public"."tasks" from "anon";

revoke trigger on table "public"."tasks" from "anon";

revoke truncate on table "public"."tasks" from "anon";

revoke update on table "public"."tasks" from "anon";

revoke delete on table "public"."tasks" from "authenticated";

revoke insert on table "public"."tasks" from "authenticated";

revoke references on table "public"."tasks" from "authenticated";

revoke select on table "public"."tasks" from "authenticated";

revoke trigger on table "public"."tasks" from "authenticated";

revoke truncate on table "public"."tasks" from "authenticated";

revoke update on table "public"."tasks" from "authenticated";

revoke delete on table "public"."tasks" from "service_role";

revoke insert on table "public"."tasks" from "service_role";

revoke references on table "public"."tasks" from "service_role";

revoke select on table "public"."tasks" from "service_role";

revoke trigger on table "public"."tasks" from "service_role";

revoke truncate on table "public"."tasks" from "service_role";

revoke update on table "public"."tasks" from "service_role";

revoke delete on table "public"."timer_sessions" from "anon";

revoke insert on table "public"."timer_sessions" from "anon";

revoke references on table "public"."timer_sessions" from "anon";

revoke select on table "public"."timer_sessions" from "anon";

revoke trigger on table "public"."timer_sessions" from "anon";

revoke truncate on table "public"."timer_sessions" from "anon";

revoke update on table "public"."timer_sessions" from "anon";

revoke delete on table "public"."timer_sessions" from "authenticated";

revoke insert on table "public"."timer_sessions" from "authenticated";

revoke references on table "public"."timer_sessions" from "authenticated";

revoke select on table "public"."timer_sessions" from "authenticated";

revoke trigger on table "public"."timer_sessions" from "authenticated";

revoke truncate on table "public"."timer_sessions" from "authenticated";

revoke update on table "public"."timer_sessions" from "authenticated";

revoke delete on table "public"."timer_sessions" from "service_role";

revoke insert on table "public"."timer_sessions" from "service_role";

revoke references on table "public"."timer_sessions" from "service_role";

revoke select on table "public"."timer_sessions" from "service_role";

revoke trigger on table "public"."timer_sessions" from "service_role";

revoke truncate on table "public"."timer_sessions" from "service_role";

revoke update on table "public"."timer_sessions" from "service_role";

revoke delete on table "public"."user_cognitive_preferences" from "anon";

revoke insert on table "public"."user_cognitive_preferences" from "anon";

revoke references on table "public"."user_cognitive_preferences" from "anon";

revoke select on table "public"."user_cognitive_preferences" from "anon";

revoke trigger on table "public"."user_cognitive_preferences" from "anon";

revoke truncate on table "public"."user_cognitive_preferences" from "anon";

revoke update on table "public"."user_cognitive_preferences" from "anon";

revoke delete on table "public"."user_cognitive_preferences" from "authenticated";

revoke insert on table "public"."user_cognitive_preferences" from "authenticated";

revoke references on table "public"."user_cognitive_preferences" from "authenticated";

revoke select on table "public"."user_cognitive_preferences" from "authenticated";

revoke trigger on table "public"."user_cognitive_preferences" from "authenticated";

revoke truncate on table "public"."user_cognitive_preferences" from "authenticated";

revoke update on table "public"."user_cognitive_preferences" from "authenticated";

revoke delete on table "public"."user_cognitive_preferences" from "service_role";

revoke insert on table "public"."user_cognitive_preferences" from "service_role";

revoke references on table "public"."user_cognitive_preferences" from "service_role";

revoke select on table "public"."user_cognitive_preferences" from "service_role";

revoke trigger on table "public"."user_cognitive_preferences" from "service_role";

revoke truncate on table "public"."user_cognitive_preferences" from "service_role";

revoke update on table "public"."user_cognitive_preferences" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


