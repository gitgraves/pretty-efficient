-- Rename inquiries table to leads
alter table inquiries rename to leads;

-- Add source column (website_form for existing rows, manual for new ones Kim enters)
alter table leads add column source text not null default 'website_form';

-- Add notes column for Kim's internal follow-up notes
alter table leads add column notes text;

-- Add converted_client_id to track which client this lead became
alter table leads add column converted_client_id uuid references clients(id) on delete set null;

-- Expand status values — existing data stays valid, new values available going forward
-- Valid statuses: New, Contacted, Quoted, Booked, Lost
-- (No enum constraint — kept as free text for flexibility)
