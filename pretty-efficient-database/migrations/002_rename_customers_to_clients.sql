-- Rename customers table to clients
alter table customers rename to clients;

-- Rename customer_id FK column on jobs
alter table jobs rename column customer_id to client_id;

-- Rename customer_id FK column on testimonials
alter table testimonials rename column customer_id to client_id;
