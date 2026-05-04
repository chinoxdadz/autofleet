/**
 * PRESENTATION LAYER — DashboardRenderer
 *
 * Converts data from the application layer into Dashboard HTML.
 * Receives pre-computed values; never calls use cases directly.
 */

import { php, fmtDate, MONTHS, escHtml } from '../../core/utils.js';
import { payBadge, bookBadge, statCard, barRow } from '../components/uiComponents.js';
import { ReportingService } from '../../domain/services/ReportingService.js';

export class DashboardRenderer {
  render(container, { bookings, recentBookings, cars, customers, month, year }) {
    const summary    = ReportingService.summarise(bookings);
    const revByCar   = ReportingService.revenueByCarSorted(bookings);
    const byPaySt    = ReportingService.byPayStatus(bookings);
    const maxRev     = revByCar.length ? revByCar[0][1] : 1;

    const statsHtml = `<div class="stats-grid">
      ${statCard({ label:'Bookings',         value: String(summary.count),   sub:`${MONTHS[month-1]} ${year}`, highlight:true })}
      ${statCard({ label:'Total Revenue',    value: php(summary.totalRev),   sub:`From ${summary.count} booking(s)` })}
      ${statCard({ label:'Amount Collected', value: php(summary.totalPaid),  sub:`₱${summary.outstanding.toLocaleString()} outstanding`, subColor: summary.outstanding > 0 ? 'var(--amber)' : 'var(--green-light)' })}
      ${statCard({ label:'Fleet Size',       value: String(cars.length),     sub:`${customers.length} total customers` })}
    </div>`;

    const revenueBarHtml = revByCar.length
      ? revByCar.map(([car, rev]) => barRow({ label: car, value: php(rev), pct: Math.round(rev / maxRev * 100) })).join('')
      : '<p style="color:var(--muted);font-size:13px">No bookings this month.</p>';

    const payStatusHtml = ['Fully Paid', 'Partially Paid', 'Unpaid'].map(s => {
      const cnt = byPaySt[s] || 0;
      const pct = bookings.length ? Math.round(cnt / bookings.length * 100) : 0;
      const color = s === 'Fully Paid' ? 'var(--accent)' : s === 'Partially Paid' ? 'var(--amber)' : 'var(--red)';
      return barRow({ label: s, value: `${cnt} booking(s)`, pct, color });
    }).join('');

    const recentHtml = recentBookings.length
      ? `<div class="tbl-wrap"><table>
          <thead><tr><th>Customer</th><th>Car</th><th>Pickup</th><th>Return</th><th>Total</th><th>Paid</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>${recentBookings.map(b => `<tr onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">
            <td>${escHtml(b.customer)}</td><td>${escHtml(b.car)}</td>
            <td>${fmtDate(b.pickup)}</td><td>${fmtDate(b.ret)}</td>
            <td>${php(b.total)}</td><td>${php(b.paid)}</td>
            <td>${payBadge(b.payStatus)}</td><td>${bookBadge(b.bookStatus)}</td>
          </tr>`).join('')}</tbody>
        </table></div>`
      : '<div class="empty"><div class="empty-icon">📋</div><p>No bookings yet. Add your first booking!</p><button class="btn btn-primary" onclick="window._ctrl.openBookingModal()">+ Add Booking</button></div>';

    container.innerHTML = `
      ${statsHtml}
      <div class="charts-2col">
        <div class="section-card">
          <div class="section-header"><span class="section-title">Revenue by Car — ${MONTHS[month-1]}</span></div>
          <div class="section-body">${revenueBarHtml}</div>
        </div>
        <div class="section-card">
          <div class="section-header"><span class="section-title">Payment Status — ${MONTHS[month-1]}</span></div>
          <div class="section-body">${payStatusHtml}</div>
        </div>
      </div>
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">Recent Bookings</span>
          <button class="btn btn-sm" onclick="window._ctrl.showScreen('bookings')">View All →</button>
        </div>
        ${recentHtml}
      </div>`;
  }
}
