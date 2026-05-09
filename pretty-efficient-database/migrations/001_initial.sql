-- Customers
create table customers (
                           id uuid primary key default gen_random_uuid(),
                           name text not null,
                           phone text,
                           email text,
                           notes text,
                           created_at timestamptz default now()
);

-- Jobs
create table jobs (
                      id uuid primary key default gen_random_uuid(),
                      customer_id uuid references customers(id) on delete set null,
                      description text not null,
                      status text not null default 'Scheduled',
                      job_date date,
                      revenue numeric(10,2) default 0,
                      notes text,
                      featured boolean default false,
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
                              customer_id uuid references customers(id) on delete set null,
                              job_id uuid references jobs(id) on delete set null,
                              quote text not null,
                              rating int check (rating between 1 and 5),
                              approved boolean default false,
                              created_at timestamptz default now()
);

-- Inquiries (from website contact form)
create table inquiries (
                           id uuid primary key default gen_random_uuid(),
                           name text not null,
                           email text,
                           phone text,
                           message text,
                           status text default 'New',
                           created_at timestamptz default now()
);