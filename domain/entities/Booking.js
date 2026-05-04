/**
 * DOMAIN LAYER — Booking Entity
 *
 * Pure data structure + business rules. No DOM, no localStorage, no imports.
 * Encapsulates what a valid booking looks like and computes derived properties.
 */

export class Booking {
  constructor(data) {
    this.id          = data.id;
    this.customer    = data.customer;
    this.contact     = data.contact    || '';
    this.license     = data.license    || '';
    this.car         = data.car;
    this.plate       = data.plate      || '';
    this.serviceType = data.serviceType || 'Self-drive';
    this.driver      = data.driver     || '';
    this.pickup      = data.pickup;
    this.ret         = data.ret;
    this.rate        = Number(data.rate    || 0);
    this.fees        = Number(data.fees    || 0);
    this.days        = Number(data.days    || 0);
    this.subtotal    = Number(data.subtotal || 0);
    this.total       = Number(data.total   || 0);
    this.paid        = Number(data.paid    || 0);
    this.payStatus   = data.payStatus  || 'Unpaid';
    this.bookStatus  = data.bookStatus || 'Active';
    this.notes       = data.notes      || '';
  }

  /** Business rule: derive payment status from amounts */
  static derivePayStatus(paid, total) {
    if (paid <= 0)        return 'Unpaid';
    if (paid >= total)    return 'Fully Paid';
    return 'Partially Paid';
  }

  /** Business rule: number of rental days between two date strings */
  static daysBetween(pickupStr, retStr) {
    const d1 = new Date(pickupStr);
    const d2 = new Date(retStr);
    return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  }

  /** Business rule: compute all totals given raw form values */
  static calculate({ pickup, ret, rate, fees, paid }) {
    const days     = (pickup && ret) ? Booking.daysBetween(pickup, ret) : 0;
    const subtotal = days * rate;
    const total    = subtotal + fees;
    const payStatus = Booking.derivePayStatus(paid, total);
    return { days, subtotal, total, payStatus };
  }

  get balance() {
    return this.total - this.paid;
  }
}
