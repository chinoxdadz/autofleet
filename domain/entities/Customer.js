/**
 * DOMAIN LAYER — Customer Entity
 *
 * Represents a rental customer. Pure data + identity rules only.
 */

export class Customer {
  constructor(data) {
    this.id            = data.id;
    this.name          = data.name;
    this.phone         = data.phone         || '';
    this.license       = data.license       || '';
    this.licenseExpiry = data.licenseExpiry || '';
    this.address       = data.address       || '';
    this.notes         = data.notes         || '';
    this.idDocument    = data.idDocument    || null;
    this.agreementDoc  = data.agreementDoc  || null;
  }

  /** Business rule: name-based equality (case-insensitive) */
  matchesName(name) {
    return this.name.toLowerCase() === name.toLowerCase();
  }
}
