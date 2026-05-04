/**
 * infrastructure/SupabaseRepository.js
 *
 * Supabase-backed implementation of the repository interface.
 * Mirrors the same async API as LocalStorageRepository so use cases
 * are unaware of which backend is in use.
 *
 * Table schemas are defined in supabase-schema.sql.
 */

// ── Field mappers: JS entities ↔ Supabase rows ────────────────────────────

function carToRow(c) {
  return {
    id:           c.id,
    name:         c.name         || '',
    plate:        c.plate        || '',
    year:         c.year != null ? String(c.year) : '',
    rate:         Number(c.rate) || 0,
    mileage:      c.mileage != null ? String(c.mileage) : '',
    mileage_date: c.mileageDate  || '',
    reg_expiry:   c.regExpiry    || '',
    ins_expiry:   c.insExpiry    || '',
    inspection:   c.inspection   || '',
    notes:        c.notes        || '',
    photo:        c.photo ? JSON.stringify(c.photo) : null,
  };
}

function rowToCar(row) {
  return {
    id:          row.id,
    name:        row.name,
    plate:       row.plate,
    year:        row.year,
    rate:        Number(row.rate),
    mileage:     row.mileage,
    mileageDate: row.mileage_date,
    regExpiry:   row.reg_expiry,
    insExpiry:   row.ins_expiry,
    inspection:  row.inspection,
    notes:       row.notes,
    photo:        row.photo ? (() => { try { return JSON.parse(row.photo); } catch { return null; } })() : null,
  };
}

function customerToRow(c) {
  return {
    id:            c.id,
    name:          c.name            || '',
    phone:         c.phone           || '',
    license:       c.license         || '',
    license_expiry: c.licenseExpiry  || '',
    address:       c.address         || '',
    notes:         c.notes           || '',
    id_document:   c.idDocument      || null,
    agreement_doc: c.agreementDoc    || null,
  };
}

function rowToCustomer(row) {
  return {
    id:            row.id,
    name:          row.name,
    phone:         row.phone,
    license:       row.license,
    licenseExpiry: row.license_expiry,
    address:       row.address,
    notes:         row.notes,
    idDocument:    row.id_document,
    agreementDoc:  row.agreement_doc,
  };
}

function bookingToRow(b) {
  return {
    id:           b.id,
    customer:     b.customer     || '',
    contact:      b.contact      || '',
    license:      b.license      || '',
    car:          b.car          || '',
    plate:        b.plate        || '',
    service_type: b.serviceType  || 'Self-drive',
    driver:       b.driver       || '',
    pickup:       b.pickup,
    return_date:  b.ret,
    rate:         Number(b.rate)     || 0,
    fees:         Number(b.fees)     || 0,
    book_status:  b.bookStatus   || 'Active',
    notes:        b.notes        || '',
    paid:         Number(b.paid)     || 0,
    days:         Number(b.days)     || 0,
    subtotal:     Number(b.subtotal) || 0,
    total:        Number(b.total)    || 0,
    pay_status:   b.payStatus    || 'Unpaid',
  };
}

function rowToBooking(row) {
  return {
    id:          row.id,
    customer:    row.customer,
    contact:     row.contact,
    license:     row.license,
    car:         row.car,
    plate:       row.plate,
    serviceType: row.service_type,
    driver:      row.driver,
    pickup:      row.pickup,
    ret:         row.return_date,
    rate:        Number(row.rate),
    fees:        Number(row.fees),
    bookStatus:  row.book_status,
    notes:       row.notes,
    paid:        Number(row.paid),
    days:        Number(row.days),
    subtotal:    Number(row.subtotal),
    total:       Number(row.total),
    payStatus:   row.pay_status,
  };
}

// ── Repository class ──────────────────────────────────────────────────────

export class SupabaseRepository {
  /** @param {import('@supabase/supabase-js').SupabaseClient} sb */
  constructor(sb) {
    this.sb = sb;
  }

  // ── Cars ────────────────────────────────────────────────────────────────

  async loadCars() {
    const { data, error } = await this.sb.from('cars').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCar);
  }

  async saveCar(car) {
    const { error } = await this.sb.from('cars').upsert(carToRow(car));
    if (error) throw new Error(error.message);
  }

  async deleteCar(id) {
    const { error } = await this.sb.from('cars').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ── Customers ────────────────────────────────────────────────────────────

  async loadCustomers() {
    const { data, error } = await this.sb.from('customers').select('*').order('name');
    if (error) throw new Error(error.message);
    return (data || []).map(rowToCustomer);
  }

  async saveCustomer(customer) {
    const { error } = await this.sb.from('customers').upsert(customerToRow(customer));
    if (error) throw new Error(error.message);
  }

  async deleteCustomer(id) {
    const { error } = await this.sb.from('customers').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ── Bookings ─────────────────────────────────────────────────────────────

  async loadBookings() {
    const { data, error } = await this.sb.from('bookings').select('*').order('pickup', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToBooking);
  }

  async saveBooking(booking) {
    const { error } = await this.sb.from('bookings').upsert(bookingToRow(booking));
    if (error) throw new Error(error.message);
  }

  async deleteBooking(id) {
    const { error } = await this.sb.from('bookings').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ── Seeding ──────────────────────────────────────────────────────────────

  async isEmpty() {
    const { count, error } = await this.sb
      .from('cars')
      .select('id', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return (count || 0) === 0;
  }

  async bulkSeed(cars, customers, bookings) {
    const { error: e1 } = await this.sb.from('cars').insert(cars.map(carToRow));
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await this.sb.from('customers').insert(customers.map(customerToRow));
    if (e2) throw new Error(e2.message);
    const { error: e3 } = await this.sb.from('bookings').insert(bookings.map(bookingToRow));
    if (e3) throw new Error(e3.message);
  }
}
