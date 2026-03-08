drop policy "allow trigger inserts" on "public"."users";

drop policy "users_insert_self" on "public"."users";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (
    user_id,
    name,
    avatar_url
  )
  VALUES (
    new.id,
    -- Try multiple metadata fields for name
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.email,  -- Fallback to email if no name
      'Users'
    ),
    -- Try multiple metadata fields for avatar
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'  -- Google uses 'picture'
    )
  --   -- 25,
  --   -- NOW(),
  --   -- NOW()
  );

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
END;$function$
;

CREATE OR REPLACE FUNCTION public.init_user_cognitive_preference()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$begin
  -- insert into user_cognitive_preferences (user_id)
  -- values (new.user_id)
  -- on conflict do nothing;
  return new;
end;$function$
;


  create policy "Enable insert for users based on user_id"
  on "public"."users"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



