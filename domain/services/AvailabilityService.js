/**
 * DOMAIN SERVICE — AvailabilityService
 *
 * Pure business logic for computing fleet availability and detecting
 * double-bookings. Operates only on entity data; no DOM or storage access.
 */

export class AvailabilityService {
  /**
   * Build an occupancy map for a given month/year.
   * @param {Car[]} cars
   * @param {Booking[]} bookings
   * @param {number} year
   * @param {number} month  1-based
   * @returns {{ occupancy: Map<string, Set<number>>, doubleBooked: Set<string> }}
   *   occupancy: carId → Set of booked day-of-month numbers
   *   doubleBooked: Set of "carId-day" keys that have >1 booking
   */
  static buildOccupancy(cars, bookings, year, month) {
    // carId → Set<dayNumber>
    const occupancy = new Map(cars.map(c => [c.id, new Set()]));
    // "carId-day" → count
    const dayCount  = new Map();

    bookings.forEach(b => {
      if (b.bookStatus === 'Cancelled') return;
      const car = cars.find(c => c.name === b.car);
      if (!car) return;

      const start = new Date(b.pickup);
      const end   = new Date(b.ret);

      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
        const day = d.getDate();
        occupancy.get(car.id).add(day);
        const key = `${car.id}-${day}`;
        dayCount.set(key, (dayCount.get(key) || 0) + 1);
      }
    });

    const doubleBooked = new Set(
      [...dayCount.entries()].filter(([, v]) => v > 1).map(([k]) => k)
    );

    return { occupancy, doubleBooked };
  }
}
