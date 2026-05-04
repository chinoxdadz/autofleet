/**
 * DOMAIN LAYER — Car Entity
 *
 * Represents a fleet vehicle. Encapsulates expiry-warning thresholds
 * and any computed properties about the car itself.
 * Zero dependencies on browser APIs or other layers.
 */

const WARN_DAYS = 90; // days before expiry to flag a warning

export class Car {
  constructor(data) {
    this.id           = data.id;
    this.name         = data.name;
    this.plate        = data.plate;
    this.year         = data.year         || '';
    this.rate         = Number(data.rate  || 0);
    this.mileage      = data.mileage      !== '' ? Number(data.mileage) : '';
    this.mileageDate  = data.mileageDate  || '';
    this.regExpiry    = data.regExpiry    || '';
    this.insExpiry    = data.insExpiry    || '';
    this.inspection   = data.inspection   || '';
    this.notes        = data.notes        || '';
    this.photo        = data.photo        || null;
  }

  /** Business rule: is registration expiring within warning window? */
  isRegExpiringSoon(referenceDate = new Date()) {
    if (!this.regExpiry) return false;
    const expiry = new Date(this.regExpiry);
    return (expiry - referenceDate) < WARN_DAYS * 86400000;
  }

  /** Business rule: is insurance expiring within warning window? */
  isInsExpiringSoon(referenceDate = new Date()) {
    if (!this.insExpiry) return false;
    const expiry = new Date(this.insExpiry);
    return (expiry - referenceDate) < WARN_DAYS * 86400000;
  }
}
