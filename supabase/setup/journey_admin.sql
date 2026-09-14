-- Run in this project's Supabase SQL editor after the journey migrations.
-- This is project-specific setup, not a migration for every environment.
insert into public.journey_admins(user_id)
values ('d250eafd-540f-40be-be0b-e24fd860a3b3')
on conflict (user_id) do nothing;

-- Expect admin_allowlisted = true. Sign in at /admin with this user's email/password.
select exists (
  select 1 from public.journey_admins
  where user_id = 'd250eafd-540f-40be-be0b-e24fd860a3b3'
) as admin_allowlisted;
