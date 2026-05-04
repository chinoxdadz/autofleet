/**
 * ENTRY POINT — main.js
 *
 * Bootstraps the application by composing all layers:
 *   Infrastructure → AppState → UseCases → AppController
 *
 * This is the only file that imports from multiple layers.
 * Everything else talks only to its adjacent layer.
 */

import { supabase }              from './infrastructure/supabase.js';
import { SupabaseRepository }    from './infrastructure/SupabaseRepository.js';
import { AppState }              from './core/AppState.js';
import { AuthManager }           from './core/auth.js';
import { BookingUseCases }       from './application/usecases/BookingUseCases.js';
import { CarUseCases }           from './application/usecases/CarUseCases.js';
import { CustomerUseCases }      from './application/usecases/CustomerUseCases.js';
import { QuotationUseCases }     from './application/usecases/QuotationUseCases.js';
import { SeedUseCase }           from './application/usecases/SeedUseCase.js';
import { AppController }         from './presentation/controllers/AppController.js';
import { Booking }               from './domain/entities/Booking.js';
import { Car }                   from './domain/entities/Car.js';
import { Customer }              from './domain/entities/Customer.js';

// ── 1. Auth ────────────────────────────────────────────────────────────────
const auth = new AuthManager(supabase);
window._auth = auth;

const isLoggedIn = await auth.isAuthenticated();

if (!isLoggedIn) {
  // Show login overlay; the rest of the app boots but stays empty until login
  document.getElementById('login-overlay').style.display = 'flex';
}

// ── 2. Infrastructure ──────────────────────────────────────────────────────
const repo = new SupabaseRepository(supabase);

// ── 3. State ───────────────────────────────────────────────────────────────
const state = new AppState();

// ── 4. Use Cases ───────────────────────────────────────────────────────────
const bookingUC   = new BookingUseCases(state, repo);
const carUC       = new CarUseCases(state, repo);
const customerUC  = new CustomerUseCases(state, repo);
const quotationUC = new QuotationUseCases(state);

// ── 5. Controller ──────────────────────────────────────────────────────────
const ctrl = new AppController({ state, bookingUC, carUC, customerUC, quotationUC });
window._ctrl = ctrl;

// ── 6. Boot function (called after successful auth) ────────────────────────
async function bootApp() {
  // Load all data from Supabase
  const [rawBookings, rawCars, rawCustomers] = await Promise.all([
    repo.loadBookings(),
    repo.loadCars(),
    repo.loadCustomers(),
  ]);

  state.setBookings(rawBookings.map(d => new Booking(d)));
  state.setCars(rawCars.map(d => new Car(d)));
  state.setCustomers(rawCustomers.map(d => new Customer(d)));

  // Seed demo data on first run
  await new SeedUseCase(state, repo).seedIfEmpty();
  // Re-hydrate after seed so entity class methods are available
  state.setCars(state.cars.map(d => d instanceof Car ? d : new Car(d)));
  state.setCustomers(state.customers.map(d => d instanceof Customer ? d : new Customer(d)));
  state.setBookings(state.bookings.map(d => d instanceof Booking ? d : new Booking(d)));

  // Initialise UI
  ctrl.init();

  // ── 7. Realtime subscriptions ────────────────────────────────────────────
  supabase.channel('autofleet-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, async () => {
      state.setCars((await repo.loadCars()).map(d => new Car(d)));
      ctrl.refreshCurrentScreen();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async () => {
      state.setCustomers((await repo.loadCustomers()).map(d => new Customer(d)));
      ctrl.refreshCurrentScreen();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async () => {
      state.setBookings((await repo.loadBookings()).map(d => new Booking(d)));
      ctrl.refreshCurrentScreen();
    })
    .subscribe();
}

// Expose boot for the login success handler in index.html
window._bootApp = bootApp;

// If already authenticated, boot immediately and then hide the login overlay
if (isLoggedIn) {
  await bootApp();
  const overlay = document.getElementById('login-overlay');
  overlay.classList.add('hidden');
  setTimeout(() => { overlay.style.display = 'none'; }, 320);
}

