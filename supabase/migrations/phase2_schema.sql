-- Create the table for storing training data
create table if not exists labeled_examples (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  answer text not null,
  persona_type text not null, -- 'perfect', 'junior', 'rambler', etc.
  scores jsonb null, -- e.g. {"clarity": 3, "relevance": 5, "star": 2}
  feedback text null, -- Human explanation for the score
  is_corrected boolean default false, -- False = Generated/Raw, True = Human Reviewed
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table labeled_examples enable row level security;

-- Create policy to allow read/write for authenticated users (or public if strictly dev)
-- For this MVP/Dev phase, we'll allow public access to make the Admin UI easier to test
-- independent of complex auth states. Secure this in production.
create policy "Enable all access for all users" on labeled_examples
for all using (true) with check (true);
