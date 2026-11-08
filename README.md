# DormLaundry

Dormitory laundry booking web app with smart-plug status (SE-2622 ICT course project).
Residents see which washers are free, book a time, start the washer and report faults.
Administrators see all machines, answer fault reports, set machines out of service and read statistics.

**Team:** Iskander (front end), Medet (database and smart-plug solution), Nurdaulet (back end).

## How it works
Browser (`dist/`) → Supabase Auth + Data API (HTTPS) → PostgreSQL with row-level security.
Two Edge Functions run on the server side:
- `booking-control` – checks the signed-in user and the booking owner, handles **Start washer** and switches the outlet.
- `device-telemetry` – receives power readings from a plug, checks the device token (only its SHA-256 hash is stored) and updates the machine status.

Status rules: booked → outlet OFF (Reserved); owner presses Start → outlet ON (Starting); ≥ 8 W → In use;
< 3 W for 300 s → cycle finished (Completed, washer Available); out of service → outlet stays OFF; no signal → Offline.
Overlapping bookings are refused by the database (`bookings_no_overlap`).

The smart plugs are **simulated** by `fake_plug.py`. `device-agent/tapo_bridge.py` is a bridge for a real TP-Link Tapo P110 plug; it has not yet been tested on hardware.

## Repository layout
| Path | Content |
|---|---|
| `dist/` | Web client (HTML, CSS, JavaScript, WebP/SVG media, `sounds.js`) |
| `supabase/` | Edge Functions and SQL scripts (overlap rule, cancel rule, fault replies, analysis queries, collision test, token rotation) |
| `database/` | Core schema, security/devices migration, test data, evidence queries |
| `device-agent/` | Bridges for real plugs (Tapo, Shelly) |
| `fake_plug.py` | Smart-plug simulator (three washers) |
| `media-experiments/` | WAV/MP3 files from the Assignment 4 audio comparison |

## Run locally
Requirements: Python 3.10+, a browser, and a Supabase project (the live project's URL and public key are in `dist/config.js`).

1. Start the website:
   ```
   python -m http.server 4173 --directory dist
   ```
   Open http://localhost:4173 (or open `dist/index.html` directly).
2. Create the device tokens: run `supabase/rotate_plug_tokens.sql` in the Supabase SQL Editor. It prints a device id and a token for each washer (shown once).
3. Copy `devices.example.json` to `devices.json`, paste the ids and tokens, and put your project URL in `url`. `devices.json` is in `.gitignore` and must never be committed.
4. Start the simulator:
   ```
   python fake_plug.py
   ```
   Washer 1 and Washer 3 idle at about 0.3 W; Washer 2 always runs (a washer used without a booking).
   `python fake_plug.py wash` starts a washing cycle on Washer 1 at once.

### Fresh Supabase project
Run in this order in the SQL Editor: `database/00_core_schema_FRESH_PROJECT_ONLY.sql`, `database/01_security_and_devices.sql`,
then `supabase/prevent_overlaps.sql`, `supabase/allow_cancel.sql`, `supabase/fault_reports_update.sql`, optionally `database/02_seed_core_TEST_PROJECT_ONLY.sql`.
Deploy the functions from `supabase/functions/` and set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for them (server side only).

## Test accounts (course demo only, not real users)
| Role | E-mail | Password |
|---|---|---|
| Resident | 123@gmail.com | 123123 |
| Administrator | admin123@gmail.com | 123123 |

There is no public registration on purpose: accounts are created by an administrator in Supabase → Authentication → Users.

## Security notes
- Passwords: Supabase Auth (bcrypt hashes). Transport: HTTPS. Access: row-level security per user.
- The browser only holds the public anon key; the service-role key is used only inside Edge Functions.
- Device tokens are stored as SHA-256 hashes; plain tokens live only in the untracked `devices.json`.

## Final-project features (run `supabase/final_features.sql` once in the Supabase SQL Editor)
- **Booked time ranges** (R2): the booking window lists when each washer is already booked, without names (`machine_busy_slots()`).
- **Reschedule** (R5): `Reschedule` button on a scheduled booking (`reschedule_booking()`; the `bookings_no_overlap` constraint still protects the washer).
- **Machine management** (R8): administrator tab Machines, `Add machine` / `Edit` (`admin_save_machine()`).
- **Notification bell** (R6): list of booking and fault-report notifications with an unread counter (stored in the browser).

## Known limitations
No self-registration (accounts are created by the administrator), no e-mail/push reminders, no reminder before the start time.
Analysis data are generated test data. The real plug bridge is untested on hardware. See the final report for the full status table.
