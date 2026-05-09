-- Clients (formerly customers)
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- Jobs
create table jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  description text not null,
  status text not null default 'Scheduled',
  job_date date,
  revenue numeric(10,2) default 0,
  notes text,
  featured boolean default false,
  referral_partner_id uuid references referral_partners(id) on delete set null,
  referral_reward_amount numeric(10,2),
  referral_reward_paid boolean not null default false,
  referral_reward_paid_date date,
  created_at timestamptz default now()
);

-- Expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  category text not null,
  description text not null,
  amount numeric(10,2) not null,
  expense_date date default current_date,
  reimbursable boolean not null default false,
  reimbursed_amount numeric(10,2),
  created_at timestamptz default now()
);

-- Media (photos + videos)
create table job_media (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  media_type text not null default 'image',
  storage_path text not null,
  thumbnail_path text,
  caption text,
  show_on_website boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Testimonials
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  quote text not null,
  rating int check (rating between 1 and 5),
  approved boolean default false,
  created_at timestamptz default now()
);

-- Referral Partners (people and organizations who send Kim business)
create table referral_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

-- Subcontractors
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

-- Leads (formerly inquiries — website form + manually entered prospects)
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text,
  status text default 'New',        -- New, Contacted, Quoted, Booked, Lost
  source text not null default 'website_form', -- website_form, manual, referral, social_media
  notes text,
  converted_client_id uuid references clients(id) on delete set null,
  referral_partner_id uuid references referral_partners(id) on delete set null,
  created_at timestamptz default now()
);
