/**
 * APPLICATION LAYER — CustomerUseCases
 *
 * Orchestrates Customer entity persistence and lookup.
 */

import { Customer } from '../../domain/entities/Customer.js';
import { uid }      from '../../core/utils.js';

export class CustomerUseCases {
  constructor(state, repo) {
    this.state = state;
    this.repo  = repo;
  }

  /** @throws {Error} on validation failure */
  async saveCustomer(formData, editingId = null) {
    if (!formData.name) throw new Error('Customer name is required.');
    const existing = editingId
      ? this.state.customers.find(c => c.id === editingId)
      : null;

    const idDocument = formData.idDocument || existing?.idDocument || null;
    const agreementDoc = formData.agreementDoc || existing?.agreementDoc || null;

    if (!editingId && !idDocument) {
      throw new Error('Customer ID upload is required.');
    }
    if (!editingId && !agreementDoc) {
      throw new Error('Signed rental agreement is required.');
    }

    const customer = new Customer({
      id:            editingId || uid(),
      name:          formData.name.trim(),
      phone:         formData.phone         || '',
      license:       formData.license       || '',
      licenseExpiry: formData.licenseExpiry || '',
      address:       formData.address       || '',
      notes:         formData.notes         || '',
      idDocument,
      agreementDoc,
    });

    let customers = [...this.state.customers];
    if (editingId) {
      const idx = customers.findIndex(c => c.id === editingId);
      customers[idx] = customer;
    } else {
      customers.push(customer);
    }

    this.state.setCustomers(customers);
    await this.repo.saveCustomer(customer);
    return customer;
  }

  async deleteCustomer(id) {
    const customers = this.state.customers.filter(c => c.id !== id);
    this.state.setCustomers(customers);
    await this.repo.deleteCustomer(id);
  }

  /** Find a customer by case-insensitive name match. */
  findByName(name) {
    return this.state.customers.find(c =>
      c.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  /** Filter customers by a search query (name, phone, or license). */
  search(query = '') {
    const q = query.toLowerCase();
    let list = [...this.state.customers].sort((a, b) => a.name.localeCompare(b.name));
    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.license.toLowerCase().includes(q)
      );
    }
    return list;
  }
}
