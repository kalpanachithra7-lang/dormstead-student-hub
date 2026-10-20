create type public.app_role as enum ('admin', 'student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  roll_no text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  block text not null default 'A',
  capacity int not null default 2 check (capacity > 0),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.rooms to authenticated;
grant all on public.rooms to service_role;
alter table public.rooms enable row level security;
create policy "rooms read" on public.rooms for select to authenticated using (true);
create policy "rooms admin write" on public.rooms for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.allocations to authenticated;
grant all on public.allocations to service_role;
alter table public.allocations enable row level security;
create policy "alloc read" on public.allocations for select to authenticated using (student_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "alloc admin write" on public.allocations for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.complaints to authenticated;
grant all on public.complaints to service_role;
alter table public.complaints enable row level security;
create policy "complaints read" on public.complaints for select to authenticated using (student_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "complaints insert" on public.complaints for insert to authenticated with check (student_id = auth.uid() and status = 'open');
create policy "complaints admin update" on public.complaints for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  check (to_date >= from_date)
);
grant select, insert, update, delete on public.leave_requests to authenticated;
grant all on public.leave_requests to service_role;
alter table public.leave_requests enable row level security;
create policy "leave read" on public.leave_requests for select to authenticated using (student_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "leave insert" on public.leave_requests for insert to authenticated with check (student_id = auth.uid() and status = 'pending');
create policy "leave admin update" on public.leave_requests for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, roll_no, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''),
          coalesce(new.raw_user_meta_data->>'roll_no',''), coalesce(new.raw_user_meta_data->>'phone',''));
  if lower(new.email) = 'kalpanachithra7@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'student');
  end if;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.rooms (room_number, block, capacity) values
('A-101','A',2),('A-102','A',2),('A-103','A',3),('B-201','B',2),('B-202','B',4);