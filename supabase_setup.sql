-- ============================================================
-- SystemFit: Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. AUTO-CREATE PROFILE ON SIGN-UP
--    Fires server-side whenever a new auth.users row is inserted.
--    This handles both email/password and OAuth sign-ups reliably.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, onboarding_complete, created_at)
  values (
    new.id,
    new.email,
    false,
    now()
  )
  on conflict (id) do nothing; -- safe if profile already exists
  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. RLS POLICIES
--    RLS is already enabled on the profiles table.
--    These policies ensure each user can only access their own row.

-- Allow users to read their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow users to update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow users to insert their own profile (fallback for edge cases)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
