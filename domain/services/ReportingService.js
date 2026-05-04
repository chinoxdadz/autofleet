/**
 * DOMAIN SERVICE — ReportingService
 *
 * Aggregates booking data into reporting summaries.
 * No DOM, no storage. Pure functions over entity arrays.
 */

export class ReportingService {
  /**
   * Filter bookings to a specific month/year by pickup date.
   */
  static forMonth(bookings, year, month) {
    return bookings.filter(b => {
      const d = new Date(b.pickup);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }

  /**
   * Filter bookings to a specific year by pickup date.
   */
  static forYear(bookings, year) {
    return bookings.filter(b => new Date(b.pickup).getFullYear() === year);
  }

  /**
   * Summarise a set of bookings into key financial totals.
   */
  static summarise(bookings) {
    return {
      count:       bookings.length,
      totalRev:    bookings.reduce((s, b) => s + Number(b.total  || 0), 0),
      totalPaid:   bookings.reduce((s, b) => s + Number(b.paid   || 0), 0),
      outstanding: bookings.reduce((s, b) => s + (Number(b.total || 0) - Number(b.paid || 0)), 0),
    };
  }

  /**
   * Group bookings by car and sum revenue.
   * @returns {[string, number][]} sorted descending by revenue
   */
  static revenueByCarSorted(bookings) {
    const map = {};
    bookings.forEach(b => {
      map[b.car] = (map[b.car] || 0) + Number(b.total || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  /**
   * Count bookings by payment status.
   * @returns {{ 'Fully Paid': n, 'Partially Paid': n, 'Unpaid': n }}
   */
  static byPayStatus(bookings) {
    const result = { 'Fully Paid': 0, 'Partially Paid': 0, 'Unpaid': 0 };
    bookings.forEach(b => { if (b.payStatus in result) result[b.payStatus]++; });
    return result;
  }

  /**
   * Build a per-day summary for a month.
   * @returns {Object.<number, {cnt: number, rev: number}>}
   */
  static dailySummary(bookings) {
    const map = {};
    bookings.forEach(b => {
      const day = new Date(b.pickup).getDate();
      if (!map[day]) map[day] = { cnt: 0, rev: 0 };
      map[day].cnt++;
      map[day].rev += Number(b.total || 0);
    });
    return map;
  }

  /**
   * Build a 12-element monthly summary array for an annual view.
   * @returns {{ month: number, cnt: number, rev: number }[]}
   */
  static monthlySummary(bookings) {
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i, cnt: 0, rev: 0 }));
    bookings.forEach(b => {
      const mo = new Date(b.pickup).getMonth();
      months[mo].cnt++;
      months[mo].rev += Number(b.total || 0);
    });
    return months;
  }

  /**
   * Collect all years represented in bookings plus a ±2 window from today.
   */
  static availableYears(bookings) {
    const now = new Date().getFullYear();
    const years = new Set();
    for (let y = now - 2; y <= now + 2; y++) years.add(y);
    bookings.forEach(b => { if (b.pickup) years.add(new Date(b.pickup).getFullYear()); });
    return [...years].sort((a, b) => b - a);
  }

  /**
   * Compute per-customer stats: total bookings, total spent, last booking.
   */
  static customerStats(customer, bookings) {
    const cBks = bookings.filter(b => b.customer.toLowerCase() === customer.name.toLowerCase());
    const totalSpent = cBks.reduce((s, b) => s + Number(b.total || 0), 0);
    const lastBk     = [...cBks].sort((a, b) => new Date(b.pickup) - new Date(a.pickup))[0] || null;
    return { totalBookings: cBks.length, totalSpent, lastBk };
  }

  /**
   * Total revenue earned by a specific car.
   */
  static carRevenue(car, bookings) {
    return bookings
      .filter(b => b.car === car.name)
      .reduce((s, b) => s + Number(b.total || 0), 0);
  }

  /**
   * Total booked days for a car in a given year (excludes Cancelled bookings).
   */
  static carBookedDays(car, bookings, year) {
    return bookings
      .filter(b => b.car === car.name && b.bookStatus !== 'Cancelled' && new Date(b.pickup).getFullYear() === year)
      .reduce((s, b) => s + (Number(b.days) || 0), 0);
  }

  /**
   * Count distinct customers currently with an Active booking.
   */
  static activeCustomersCount(customers, bookings) {
    const activeNames = new Set(
      bookings.filter(b => b.bookStatus === 'Active').map(b => b.customer.toLowerCase())
    );
    return customers.filter(c => activeNames.has(c.name.toLowerCase())).length;
  }
}
