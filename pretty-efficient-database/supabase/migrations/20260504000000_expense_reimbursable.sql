alter table expenses add column if not exists reimbursable boolean not null default false;
alter table expenses add column if not exists reimbursed_amount numeric(10,2);
