-- Bichos: ein Eintrag pro Mitarbeiter
create table bichos (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  bicho_color text not null default '#ff6b6b',
  bicho_shape text not null default 'round',
  bicho_eyes text not null default 'normal',
  current_level integer not null default 0,
  weirdness_score integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Antworten auf die Level-Fragen
create table answers (
  id uuid default gen_random_uuid() primary key,
  bicho_id uuid references bichos(id) on delete cascade,
  level integer not null,
  question_key text not null,
  answer_text text not null,
  created_at timestamp with time zone default now(),
  unique(bicho_id, question_key)
);

-- Realtime aktivieren damit man sieht wo andere Bichos sind
alter publication supabase_realtime add table bichos;

-- Alle dürfen lesen (für die shared map)
alter table bichos enable row level security;
alter table answers enable row level security;

create policy "bichos sind öffentlich lesbar"
  on bichos for select using (true);

create policy "jeder kann sich registrieren"
  on bichos for insert with check (true);

create policy "nur eigene daten updaten"
  on bichos for update using (true);

create policy "antworten sind öffentlich lesbar"
  on answers for select using (true);

create policy "jeder kann antworten speichern"
  on answers for insert with check (true);
