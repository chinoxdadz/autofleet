/**
 * CORE — AppState
 *
 * Replaces the global `DB` object with a proper reactive state container.
 * Subscribers are notified whenever a collection changes, enabling any
 * presentation component to stay in sync without polling.
 *
 * Usage:
 *   state.subscribe('bookings', () => renderBookings());
 *   state.setBookings([...]);  // triggers all 'bookings' subscribers
 */

export class AppState {
  constructor() {
    this._state = {
      bookings:  [],
      cars:      [],
      customers: [],
    };
    this._listeners = {
      bookings:  [],
      cars:      [],
      customers: [],
      any:       [], // fires on any change
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get bookings()  { return this._state.bookings;  }
  get cars()      { return this._state.cars;       }
  get customers() { return this._state.customers;  }

  // ── Setters (trigger subscriptions) ───────────────────────────────────────

  setBookings(list) {
    this._state.bookings = list;
    this._notify('bookings');
  }

  setCars(list) {
    this._state.cars = list;
    this._notify('cars');
  }

  setCustomers(list) {
    this._state.customers = list;
    this._notify('customers');
  }

  // ── Subscription ──────────────────────────────────────────────────────────

  /**
   * @param {'bookings'|'cars'|'customers'|'any'} key
   * @param {Function} fn
   * @returns {Function} unsubscribe function
   */
  subscribe(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
    return () => {
      this._listeners[key] = this._listeners[key].filter(f => f !== fn);
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _notify(key) {
    this._listeners[key].forEach(fn => fn(this._state[key]));
    this._listeners.any.forEach(fn => fn(this._state));
  }
}
