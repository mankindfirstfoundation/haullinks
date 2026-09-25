# HaulLinks Training Load Board

A browser-based truck-freight dispatch training simulation with Supabase authentication.

## Deploy it

Upload the complete folder to GitHub Pages or another static host. Authentication requires the configured Supabase project, so opening `index.html` as a disconnected local file is not the supported production workflow.

No build step or package manager is required. The Supabase browser library is included locally as `supabase.min.js`.

## Secure login and private administration

HaulLinks now uses Supabase email/password authentication. Public signup is not included. Authenticated users can change their password and log out the current device from the account menu.

All user creation and access administration stays in the protected Supabase dashboard; there is no admin link on the HaulLinks site. Run `SUPABASE_SETUP.sql` once before the first login, then follow `AUTH_SETUP.md`. Administrators can force a user out by setting that account's `active` value to `false` in the `haullinks_user_access` table.

## Public carrier contacts

The `COMPANIES` block in `index.html` contains the 20 supplied public U.S. freight brokerages. Each record includes its company name, public carrier phone, public business email, carrier portal, email purpose, notes, portal URL, and contact-source URL.

Expanded load details provide copy, call, email, Carrier portal, and Contact page actions. Phone notes such as menu options and extensions are displayed separately so the `tel:` links contain only the dialable public number. Recheck current contact details and carrier eligibility before live use; the dashboard does not fabricate company ratings, reviews, MC numbers, or DOT numbers.

## Logo

Place the supplied `logo.png` beside `index.html` (in the same folder). The header loads that relative image automatically and falls back to the built-in HaulLinks truck mark if the image is missing.

## Included behavior

- Compact, data-first professional dispatcher interface
- Persistent light/dark mode with automatic system-theme detection
- Search-first workflow: no load rows or market totals appear until the student runs a search
- 30-minute simulated load lifetime with visible countdown bars
- 2–4 new loads every two minutes and bell notifications
- Cross-tab consistency through `localStorage`
- USA-only location database with all 50 states plus Washington, D.C.; pickup and delivery dropdowns display both abbreviation and full name (`TX — Texas`)
- City autocomplete for pickup and delivery; any custom U.S. city can be entered and paired with its state dropdown
- Search-aware simulation that creates matching training supply for recognized city/state routes
- Pickup-from, pickup-by and delivery-by date filters
- Maximum deadhead, freight-weight, truck type, load size, rate, loaded-distance, loading-method and age filters
- Deadhead miles and pickup/drop dates displayed directly on each load
- Listed price plus an AI-modeled target price
- Route-density, season, mileage, freight weight, truck type and loading-method pricing logic
- Freight capacity checks and common load-board abbreviations for dry van, reefer, flatbed, step deck, double drop, RGN, conestoga, power only, hot shot, box truck, sprinter van, cargo van, lowboy, tanker, hopper bottom, dump trailer, curtain side, intermodal, chassis, pneumatic and livestock equipment
- Expandable pickup, delivery, commodity, weight, truck-type, pricing and company details
- Public contact copy, call, email, carrier-portal and contact-page actions
- Dispatch-verification checklist
- Student watchlist and background market-cycle notifications
- Local AI training coach for rate explanations, capacity checks and call scripts

## Student-posted loads dashboard

The dashboard now includes **Post load** and **My loads** pages. Students can enter complete load, route, freight, rate, company, and contact details. Posted loads:

- Appear in normal Load Search results
- Remain permanently until manually deleted from My Loads
- Can be viewed, edited, copied, exported to CSV, or deleted
- Use city recommendations that automatically select the matching state
- Show and require the temperature input only when `R — Reefer` is selected
- Are protected from the simulated 30-minute expiry, market reset, and dispatch-removal logic

## Important architecture note

This version stores simulated and student-posted loads in the browser through `localStorage`, namespaced by the authenticated Supabase user ID. Tabs signed in as the same user on the same browser and site share those loads. Different users and different devices do **not** share posted loads.

A classroom-wide board where every student sees every other student’s posts requires a shared backend, database, user accounts, and permissions. Do not place private API or database credentials directly in this HTML file.

## Safety and branding

HaulLinks is intentionally distinct from third-party load-board products. The interface is labeled as a training simulation and should not be presented as a live marketplace. Generated loads and load identifiers are fictional. The named brokerage contacts are public business details supplied for this build and should be verified before live use.
