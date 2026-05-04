# AutoFleet — Car Rental Manager

A modern, client-side SPA for managing car rentals with real-time sync powered by Supabase.

## Features

- 📅 Booking management (Self-drive, With driver)
- 🚗 Fleet management with photo uploads
- 👥 Customer profiles with ID & agreement documents
- 📊 Real-time analytics & reporting
- 💰 Quotation maker with automatic fee computation
- 🔐 Email + password authentication (Supabase Auth)
- ⚡ Real-time data sync across devices

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES Modules, no bundler)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Deployment**: Vercel
- **Currency**: Philippine Peso (₱)

## Local Development

```bash
# Clone and open in browser
git clone https://github.com/YOUR_USERNAME/autofleet.git
cd autofleet

# Open index.html in a browser
# (or use `python -m http.server 8000` for CORS)
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the SQL Editor
3. Enable direct email sign-up (Authentication → Email → toggle off "Confirm email")
4. Copy your **Project URL** and **anon key**
5. Fill in `core/config.js`:
   ```javascript
   export const SUPABASE_URL      = 'https://your-project.supabase.co';
   export const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

## Deployment (Vercel)

```bash
# Push to GitHub
git push origin main

# Go to vercel.com → Import Project
# Select your GitHub repo
# Deploy (no build step needed!)
```

Environment variables are already in the code, so no secrets are required.

## Architecture

```
domain/
  entities/          # Business objects (Booking, Car, Customer)
  services/          # Domain logic (Reporting, Availability)
application/
  usecases/          # Business workflows (CRUDs, Quotation)
infrastructure/
  SupabaseRepository # Supabase adapter
core/
  auth.js            # Supabase Auth wrapper
  config.js          # Supabase credentials
presentation/
  controllers/       # Event handlers
  renderers/         # HTML generators
  components/        # Reusable UI atoms
```

## License

MIT
