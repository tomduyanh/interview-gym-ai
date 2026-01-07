-- Create the table for storing interview sessions
create table if not exists interview_sessions (
  id uuid default gen_random_uuid() primary key,
  questions jsonb not null,
  resume_snapshot text not null,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table interview_sessions enable row level security;

-- Create policy to allow all access for now (consistent with labeled_examples)
create policy "Enable all access for all users" on interview_sessions
for all using (true) with check (true);
