create table consultations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  consult_date date,
  consult_time text,
  fee numeric(10,2) not null default 0,
  fee_collected boolean not null default false,
  status text not null default 'Scheduled',
  notes text,
  converted_job_id uuid references jobs(id) on delete set null,
  created_at timestamptz default now()
);
