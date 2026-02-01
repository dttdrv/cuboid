-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  encryption_salt text not null
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "Users can all own projects" on projects for all using (auth.uid() = owner_id);

-- Documents
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects not null,
  owner_id uuid references auth.users not null,
  title text not null,
  content_encrypted text not null,
  iv text not null,
  salt text not null,
  created_at timestamptz default now()
);
alter table public.documents enable row level security;
create policy "Users can all own documents" on documents for all using (auth.uid() = owner_id);