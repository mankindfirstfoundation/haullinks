# HaulLinks Supabase Login Setup

The HaulLinks files are configured for this Supabase project:

- Project URL: `https://olphgrjrqrfmzvjcdouv.supabase.co`
- Browser credential: a public `sb_publishable_...` key in `auth-config.js`

No secret key is stored in the site. Never add an `sb_secret_...` or legacy `service_role` key to GitHub.

## 1. Create the access-control table

This step is required once.

1. Open the Supabase project dashboard.
2. Open **SQL Editor**.
3. Open `SUPABASE_SETUP.sql` from this folder.
4. Copy the entire SQL file into the SQL Editor.
5. Click **Run**.

The script creates `public.haullinks_user_access`, enables Row Level Security, adds a user-safe read policy, creates access rows for existing Auth users, and automatically creates a row for every future Auth user.

## 2. Create authorized users

1. Open **Authentication > Users** in Supabase.
2. Click **Add user**.
3. Create the account or send an invitation.

There is no public registration form in HaulLinks. Keep **Allow new users to sign up** disabled under the Email provider.

The originally supplied password was shared in a conversation and should be replaced with a new strong password before production.

## 3. Deploy all required files to GitHub Pages

Keep these files together in the same published folder:

- `index.html`
- `haullinks-dashboard.html`
- `login.html`
- `auth-config.js`
- `auth.js`
- `supabase.min.js`
- `logo.png` (when available)

`supabase.min.js` is a local browser build of `@supabase/supabase-js` v2.117.1, so the authentication code does not depend on a third-party CDN at runtime.

## 4. Configure the GitHub Pages URL

In **Supabase > Authentication > URL Configuration**:

1. Set **Site URL** to:
   `https://mankindfirstfoundation.github.io/haullinks/`
2. Add the same site to **Redirect URLs**. Also permit:
   `https://mankindfirstfoundation.github.io/haullinks/login.html`

Password login itself works without an email redirect, but correct URLs are required for invitations and recovery links.

## User controls inside HaulLinks

After authentication, the account menu in the upper-right corner provides:

- **Change password** — verifies the current password and updates the Supabase account password.
- **Log out this device** — ends only the current browser session.

Load-board state and posting-profile data are namespaced by the authenticated Supabase user ID. Two different accounts using the same browser do not share their HaulLinks local-storage board.

## Private administration with no site link

There is no HaulLinks admin page or admin button. Administration remains inside the protected Supabase dashboard.

### Add or remove accounts

Use **Supabase > Authentication > Users**.

### Force a user out of HaulLinks

1. Open **Supabase > Table Editor > haullinks_user_access**.
2. Find the user's email.
3. Change `active` from `true` to `false`.

HaulLinks checks account access every 30 seconds and whenever the browser tab regains focus. A disabled account is signed out and cannot sign back in. Change `active` to `true` to restore access.

Temporary Supabase Auth bans alone do not immediately revoke an already-open session, which is why HaulLinks also performs this access-table check.

## Important GitHub Pages limitation

GitHub Pages is public static hosting. Login protection prevents normal unauthorized dashboard access, but the HTML, JavaScript, and simulated training data remain downloadable from the public repository/site. Any future confidential records should be stored in Supabase tables with Row Level Security rather than embedded in HTML or browser local storage.
