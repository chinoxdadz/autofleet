/**
 * INFRASTRUCTURE LAYER — LocalStorageRepository
 *
 * Sole place in the app allowed to touch localStorage.
 * Returns plain JS objects; upper layers wrap them in entities.
 *
 * All methods are async to share the same interface as SupabaseRepository.
 */

const KEYS = {
  bookings:  'af_bookings',
  cars:      'af_cars',
  customers: 'af_customers',
};

export class LocalStorageRepository {
  // ── Cars ──────────────────────────────────────────────────────────────────

  async loadCars() {
    return this._load(KEYS.cars);
  }

  async saveCar(car) {
    const list = this._load(KEYS.cars);
    const idx  = list.findIndex(c => c.id === car.id);
    if (idx >= 0) list[idx] = car; else list.push(car);
    this._save(KEYS.cars, list);
  }

  async deleteCar(id) {
    this._save(KEYS.cars, this._load(KEYS.cars).filter(c => c.id !== id));
  }

  // ── Customers ─────────────────────────────────────────────────────────────

  async loadCustomers() {
    return this._load(KEYS.customers);
  }

  async saveCustomer(customer) {
    const list = this._load(KEYS.customers);
    const idx  = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) list[idx] = customer; else list.push(customer);
    this._save(KEYS.customers, list);
  }

  async deleteCustomer(id) {
    this._save(KEYS.customers, this._load(KEYS.customers).filter(c => c.id !== id));
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  async loadBookings() {
    return this._load(KEYS.bookings);
  }

  async saveBooking(booking) {
    const list = this._load(KEYS.bookings);
    const idx  = list.findIndex(b => b.id === booking.id);
    if (idx >= 0) list[idx] = booking; else list.push(booking);
    this._save(KEYS.bookings, list);
  }

  async deleteBooking(id) {
    this._save(KEYS.bookings, this._load(KEYS.bookings).filter(b => b.id !== id));
  }

  // ── Seeding ───────────────────────────────────────────────────────────────

  async isEmpty() {
    return (
      this._load(KEYS.cars).length      === 0 &&
      this._load(KEYS.customers).length === 0 &&
      this._load(KEYS.bookings).length  === 0
    );
  }

  async bulkSeed(cars, customers, bookings) {
    this._save(KEYS.cars,      cars);
    this._save(KEYS.customers, customers);
    this._save(KEYS.bookings,  bookings);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  _load(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  _save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
}
