/**
 * APPLICATION LAYER — BookingUseCases
 *
 * Orchestrates domain entities + infrastructure to fulfill booking workflows.
 * Receives raw form data; returns results or throws validation errors.
 * Never touches the DOM.
 */

import { Booking }  from '../../domain/entities/Booking.js';
import { Customer } from '../../domain/entities/Customer.js';
import { uid }      from '../../core/utils.js';

export class BookingUseCases {
  /**
   * @param {AppState}               state
   * @param {LocalStorageRepository} repo
   */
  constructor(state, repo) {
    this.state = state;
    this.repo  = repo;
  }

  /**
   * Preview calculated totals from form values — no persistence.
   */
  calculateTotals(formData) {
    return Booking.calculate({
      pickup: formData.pickup,
      ret:    formData.ret,
      rate:   Number(formData.rate  || 0),
      fees:   Number(formData.fees  || 0),
      paid:   Number(formData.paid  || 0),
    });
  }

  /**
   * Create or update a booking. Auto-adds unknown customers.
   * @throws {Error} on validation failure
   */
  async saveBooking(formData, editingId = null) {
    // ── Validation ──
    if (!formData.customer) throw new Error('Customer name is required.');
    if (!formData.car)      throw new Error('Please select a car.');
    if (!formData.pickup)   throw new Error('Pickup date is required.');
    if (!formData.ret)      throw new Error('Return date is required.');
    if (new Date(formData.ret) <= new Date(formData.pickup)) {
      throw new Error('Return date must be after pickup date.');
    }
    const serviceType = formData.serviceType === 'With driver' ? 'With driver' : 'Self-drive';
    if (serviceType === 'With driver' && !String(formData.driver || '').trim()) {
      throw new Error('Driver/Operator is required for "With driver" bookings.');
    }

    // ── Build entity ──
    const calcs = this.calculateTotals(formData);
    const carObj = this.state.cars.find(c => c.name === formData.car);

    const booking = new Booking({
      id:          editingId || uid(),
      customer:    formData.customer,
      contact:     formData.contact   || '',
      license:     formData.license   || '',
      car:         formData.car,
      plate:       carObj ? carObj.plate : (formData.plate || ''),
      serviceType,
      driver:      serviceType === 'With driver' ? String(formData.driver || '').trim() : '',
      pickup:      formData.pickup,
      ret:         formData.ret,
      rate:        Number(formData.rate  || 0),
      fees:        Number(formData.fees  || 0),
      bookStatus:  formData.bookStatus || 'Active',
      notes:       formData.notes     || '',
      paid:        Number(formData.paid || 0),
      ...calcs,
    });

    // ── Persist ──
    let bookings = [...this.state.bookings];
    if (editingId) {
      const idx = bookings.findIndex(b => b.id === editingId);
      bookings[idx] = booking;
    } else {
      bookings.push(booking);
      // Auto-add customer if not known
      const exists = this.state.customers.find(c =>
        c.matchesName ? c.matchesName(formData.customer) :
          c.name.toLowerCase() === formData.customer.toLowerCase()
      );
      if (!exists) {
        const newCustomer = new Customer({
          id: uid(), name: formData.customer,
          phone: formData.contact, license: formData.license,
        });
        const customers = [...this.state.customers, newCustomer];
        this.state.setCustomers(customers);
        await this.repo.saveCustomer(newCustomer);
      }
    }

    this.state.setBookings(bookings);
    await this.repo.saveBooking(booking);

    return booking;
  }

  /**
   * Delete a booking by ID.
   */
  async deleteBooking(id) {
    const bookings = this.state.bookings.filter(b => b.id !== id);
    this.state.setBookings(bookings);
    await this.repo.deleteBooking(id);
  }

  /**
   * Return bookings filtered by optional status string and search query.
   */
  getFilteredBookings(statusFilter = '', searchQuery = '', serviceTypeFilter = '') {
    let list = [...this.state.bookings].sort(
      (a, b) => new Date(b.pickup) - new Date(a.pickup)
    );
    if (statusFilter) list = list.filter(b => b.bookStatus === statusFilter);
    if (serviceTypeFilter) {
      list = list.filter(b => (b.serviceType || 'Self-drive') === serviceTypeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.customer.toLowerCase().includes(q) ||
        b.car.toLowerCase().includes(q) ||
        ((b.serviceType || 'Self-drive').toLowerCase().includes(q)) ||
        (b.plate && b.plate.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }

  /**
   * Return the N most recent bookings across all time.
   */
  getRecentBookings(n = 8) {
    return [...this.state.bookings]
      .sort((a, b) => new Date(b.pickup) - new Date(a.pickup))
      .slice(0, n);
  }
}
