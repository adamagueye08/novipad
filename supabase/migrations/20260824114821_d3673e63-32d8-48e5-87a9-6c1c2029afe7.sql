insert into public.user_roles (user_id, role)
select id, 'super_admin'::app_role from auth.users where email = 'adamagueye8113@gmail.com'
on conflict (user_id, role) do nothing;