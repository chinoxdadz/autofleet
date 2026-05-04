/**
 * APPLICATION LAYER — CarUseCases
 *
 * Orchestrates Car entity persistence. Validates inputs before writing.
 */

import { Car } from '../../domain/entities/Car.js';
import { uid } from '../../core/utils.js';

export class CarUseCases {
  constructor(state, repo) {
    this.state = state;
    this.repo  = repo;
  }

  /** @throws {Error} on validation failure */
  async saveCar(formData, editingId = null) {
    if (!formData.name)  throw new Error('Make & model is required.');
    if (!formData.plate) throw new Error('Plate number is required.');
    const existing = editingId
      ? this.state.cars.find(c => c.id === editingId)
      : null;
    const photo = formData.photo || existing?.photo || null;

    if (!editingId && !photo) {
      throw new Error('Fleet photo is required when adding a car.');
    }

    const car = new Car({
      id:          editingId || uid(),
      name:        formData.name.trim(),
      plate:       formData.plate.trim(),
      year:        parseInt(formData.year) || '',
      rate:        parseFloat(formData.rate) || 0,
      mileage:     parseFloat(formData.mileage) || '',
      mileageDate: formData.mileageDate || '',
      regExpiry:   formData.regExpiry   || '',
      insExpiry:   formData.insExpiry   || '',
      inspection:  formData.inspection  || '',
      notes:       formData.notes       || '',
      photo,
    });

    let cars = [...this.state.cars];
    if (editingId) {
      const idx = cars.findIndex(c => c.id === editingId);
      cars[idx] = car;
    } else {
      cars.push(car);
    }

    this.state.setCars(cars);
    await this.repo.saveCar(car);
    return car;
  }

  async deleteCar(id) {
    const cars = this.state.cars.filter(c => c.id !== id);
    this.state.setCars(cars);
    await this.repo.deleteCar(id);
  }

  getCarByName(name) {
    return this.state.cars.find(c => c.name === name) || null;
  }
}
