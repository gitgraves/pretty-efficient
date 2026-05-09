create table subcontractors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  contractor_type text not null default 'Other',
  notes text,
  created_at timestamptz default now()
);

create table job_subcontractors (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  subcontractor_id uuid references subcontractors(id) on delete cascade,
  role text,
  amount numeric(10,2) not null default 0,
  created_at timestamptz default now()
);
