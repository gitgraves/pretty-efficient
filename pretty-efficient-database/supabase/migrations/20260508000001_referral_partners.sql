-- Roll back the incorrect column from the previous migration
alter table leads drop column if exists referred_by_client_id;

-- People and organizations who send Kim business
create table referral_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

-- Track which referral partner sent a lead
alter table leads add column referral_partner_id uuid references referral_partners(id) on delete set null;

-- Track referral rewards on jobs
alter table jobs add column referral_partner_id uuid references referral_partners(id) on delete set null;
alter table jobs add column referral_reward_amount numeric(10,2);
alter table jobs add column referral_reward_paid boolean not null default false;
alter table jobs add column referral_reward_paid_date date;