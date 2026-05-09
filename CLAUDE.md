You are helping develop a two-app system for Pretty Efficient, a home organizing
sole proprietorship run by Kim Graves in the DFW area of Texas. Her Instagram
is @prettyefficientorg.

## Project Structure

The project lives in a single IntelliJ multi-module workspace with three folders:

pretty-efficient-wpa/          ← PWA job tracker (React + Vite)
pretty-efficient-website/  ← Public customer-facing website (plain HTML/JS)
pretty-efficient-database/                  ← Supabase schema and migrations
schema.sql
migrations/
001_initial.sql

## Infrastructure

- **Database:** Supabase
    - Project: pretty-efficient
    - URL: https://bfuunlrugixhqdjtzfre.supabase.co
    - Anon key: sb_publishable_LzJglgvg_L9mGQwJIwE4SA_a-Kw8ZXC

- **Hosting:** Netlify
    - Both apps are deployed directly to Netlify using the Netlify CLI
    - PWA deploy: npm run build → netlify deploy --prod --dir=dist
    - Website deploy: netlify deploy --prod --dir=pretty-efficient-website
    - No local dev server is used; changes are tested by deploying directly

- **Media storage:** Supabase Storage bucket called job-media (public)

## Database Schema

Six tables in Supabase:

customers        id, name, phone, email, notes, created_at
jobs             id, customer_id (FK), description, status, job_date,
revenue, notes, featured, created_at
expenses         id, job_id (FK), category, description, amount,
expense_date, created_at
job_media        id, job_id (FK), media_type, storage_path, thumbnail_path,
caption, show_on_website, sort_order, created_at
testimonials     id, customer_id (FK), job_id (FK), quote, rating,
approved, created_at
inquiries        id, name, email, phone, message, status, created_at

Key relationships:
- customers → jobs (one to many)
- jobs → expenses (one to many)
- jobs → job_media (one to many)
- jobs → testimonials (one to one)
- customers → testimonials (one to many)
- inquiries is standalone (website contact form submissions)

## App 1: Pretty Efficient PWA (pretty-efficient/)

A mobile-first Progressive Web App installed on Kim's iPhone home screen.
She is the only user. No authentication yet (planned for later).

Tech stack:
- React 18 + Vite
- @supabase/supabase-js for all data access
- vite-plugin-pwa for PWA manifest and service worker
- No UI component library — all styles are custom inline styles
- Fonts: Playfair Display (headings) + DM Sans (body) from Google Fonts

CSS design tokens (defined in src/index.css):
--ink, --ink2, --ink3        dark neutrals
--paper, --paper2, --paper3  light backgrounds
--gold, --gold-lt            primary accent
--sage, --sage-lt            success/profit
--rose, --rose-lt            error/expense
--border, --radius, --shadow

File structure:
src/
main.jsx              entry point
App.jsx               root component, routing, data loading
index.css             global styles and CSS variables
lib/
supabase.js         all Supabase queries (get, upsert, delete)
components/
ui.jsx              shared components: Modal, Field, StatusBadge,
Spinner, Toast, ConfirmDialog, StarRating
pages/
Dashboard.jsx       home tab: stats cards + recent jobs
Jobs.jsx            job list with search and status filter
JobDetail.jsx       job detail: financials, expenses, media, testimonials
NewJob.jsx          create job form (new or existing customer)
Inquiries.jsx       website leads from contact form

Navigation is a fixed bottom tab bar with three tabs:
Home (Dashboard) | Jobs | Leads (Inquiries)

Key behaviors:
- All data fetched from Supabase on mount; no local state persistence
- Media uploads go to Supabase Storage bucket job-media
- show_on_website toggle on job_media feeds the public website gallery
- approved toggle on testimonials feeds the public website reviews section
- featured flag on jobs is reserved for website portfolio highlighting

## App 2: Pretty Efficient Website (pretty-efficient-website/)

A single index.html file — no build step, no framework, vanilla JS.
Customer-facing public site.

Tech stack:
- Plain HTML + CSS + vanilla JavaScript
- Supabase JS SDK loaded via unpkg CDN
- Fonts: Cormorant Garamond (headings) + Jost (body) from Google Fonts

Design tokens (CSS variables in <style>):
--cream, --warm, --sand, --stone   neutral backgrounds
--bark, --ink                      text colors
--sage, --blush, --gold, --gold-lt accents

Sections in order:
1. Nav          fixed top bar with smooth scroll links
2. Hero         two-column: headline/CTA left, photo right
3. About        two-column: Kim's photo left, bio right
4. Services     six-card grid (Kitchen, Closets, Whole-Home,
   Office, Garage, Move-In/Out)
5. Portfolio    pulls from job_media where show_on_website = true
6. Instagram    links to @prettyefficientorg + LightWidget embed placeholder
7. Testimonials pulls from testimonials where approved = true;
   falls back to three hardcoded sample reviews if empty
8. Contact      form submits to Supabase inquiries table
9. Footer

Two placeholder images currently need to be replaced:
- Hero image (organized pantry stock photo)
- About image (Kim's photo — kim.jpg will be added to the folder)

## Conventions to follow

- All Supabase queries live in pretty-efficient/src/lib/supabase.js —
  never query Supabase directly from components
- When adding a new database column or table, also update database/schema.sql
  and create a new numbered file in database/migrations/
- Keep the website as a single HTML file unless there is a compelling reason
  to convert it to a framework
- Match the existing inline style approach in the PWA — do not introduce
  a CSS-in-JS library or Tailwind
- When adding a new PWA page, add it to the pages/ folder and wire it into
  App.jsx navigation
- The PWA is mobile-first — all new UI must work well on iPhone Safari
  at 390px wide

## What has NOT been built yet (planned)

- Authentication / login for the PWA
- Password protection or PIN screen
- Reporting: monthly P&L view, year-to-date summary, export to CSV
- Customer management page (currently customers are created inline during
  new job flow only)
- Push notifications
- Custom domain (currently on Netlify free URLs)
- Converting the website from plain HTML to Vite/React to match PWA stack
- LightWidget Instagram feed integration (placeholder exists in website)