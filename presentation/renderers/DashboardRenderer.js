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
  render(container, { bookings, recentBookings, allBookings, cars, customers, month, year }) {
    const summary  = ReportingService.summarise(bookings);
    const revByCar = ReportingService.revenueByCarSorted(bookings);
    const byPaySt  = ReportingService.byPayStatus(bookings);
    const maxRev   = revByCar.length ? revByCar[0][1] : 1;

    // Active bookings this month
    const activeCount = bookings.filter(b => b.bookStatus === 'Active').length;
    // Collection rate
    const collectionPct = summary.totalRev > 0
      ? Math.round(summary.totalPaid / summary.totalRev * 100) : 0;

    // Today's pickups & returns (scan all bookings, not just selected month)
    const src = allBookings || recentBookings;
    const todayStr = new Date().toDateString();
    const todayPickups = src.filter(b => new Date(b.pickup).toDateString() === todayStr);
    const todayReturns = src.filter(b => new Date(b.ret).toDateString()    === todayStr);

    // ── Stat cards ──────────────────────────────────────────────────────────
    const statsHtml = `<div class="stats-grid">
      ${statCard({ label:'Bookings',        value: String(summary.count),  sub:`${MONTHS[month-1]} ${year}`, highlight: true })}
      ${statCard({ label:'Revenue',         value: php(summary.totalRev),  sub:`${summary.count} booking(s)` })}
      ${statCard({ label:'Outstanding',     value: php(summary.outstanding), sub: summary.outstanding > 0 ? `${100 - collectionPct}% uncollected` : 'Fully collected ✓', subColor: summary.outstanding > 0 ? 'var(--amber)' : 'var(--green-light)' })}
      ${statCard({ label:'Active Now',      value: String(activeCount),    sub:`of ${cars.length} cars in fleet` })}
    </div>`;

    // ── Revenue by car bars ──────────────────────────────────────────────────
    const revenueBarHtml = revByCar.length
      ? revByCar.slice(0, 6).map(([car, rev]) =>
          barRow({ label: car, value: php(rev), pct: Math.round(rev / maxRev * 100) })
        ).join('')
      : '<p style="color:var(--muted);font-size:13px;padding:4px 0">No bookings this month.</p>';

    // ── Payment status bars ──────────────────────────────────────────────────
    const payStatusHtml = ['Fully Paid', 'Partially Paid', 'Unpaid'].map(s => {
      const cnt = byPaySt[s] || 0;
      const pct = bookings.length ? Math.round(cnt / bookings.length * 100) : 0;
      const color = s === 'Fully Paid' ? 'var(--accent)' : s === 'Partially Paid' ? 'var(--amber)' : 'var(--red)';
      return barRow({ label: s, value: `${cnt}`, pct, color });
    }).join('');

    // ── Today panel ──────────────────────────────────────────────────────────
    const todayItemHtml = (b, type) => `
      <div class="dash-today-item">
        <div class="dash-today-dot dash-today-dot-${type}"></div>
        <div class="dash-today-info">
          <span class="dash-today-name">${escHtml(b.customer)}</span>
          <span class="dash-today-car">${escHtml(b.car)}</span>
        </div>
        <div class="dash-today-badge">${type === 'pickup' ? '🚗 Pickup' : '🏁 Return'}</div>
      </div>`;

    const allToday = [
      ...todayPickups.map(b => todayItemHtml(b, 'pickup')),
      ...todayReturns.map(b => todayItemHtml(b, 'return')),
    ];
    const todayHtml = allToday.length
      ? allToday.join('')
      : `<div style="color:var(--muted);font-size:13px;padding:6px 0">No pickups or returns today.</div>`;

    // ── Recent bookings (trimmed columns) ────────────────────────────────────
    const recentHtml = recentBookings.length
      ? `<div class="tbl-wrap"><table>
          <thead><tr>
            <th>Customer</th><th>Car</th><th>Pickup</th><th>Return</th>
            <th>Total</th><th>Payment</th><th>Status</th>
          </tr></thead>
          <tbody>${recentBookings.slice(0, 8).map(b => `
            <tr onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">
              <td><strong>${escHtml(b.customer)}</strong></td>
              <td>${escHtml(b.car)}</td>
              <td>${fmtDate(b.pickup)}</td>
              <td>${fmtDate(b.ret)}</td>
              <td>${php(b.total)}</td>
              <td>${payBadge(b.payStatus)}</td>
              <td>${bookBadge(b.bookStatus)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>`
      : `<div class="empty">
          <div class="empty-icon">📋</div>
          <p>No bookings yet. Add your first one!</p>
          <button class="btn btn-primary" onclick="window._ctrl.openBookingModal()">+ Add Booking</button>
        </div>`;

    // ── Assemble ─────────────────────────────────────────────────────────────
    container.innerHTML = `
      ${statsHtml}

      <div class="charts-2col">
        <div class="section-card">
          <div class="section-header">
            <span class="section-title">Revenue by Car</span>
            <span style="font-size:11px;color:var(--muted)">${MONTHS[month-1]} ${year}</span>
          </div>
          <div class="section-body">${revenueBarHtml}</div>
        </div>
        <div class="section-card">
          <div class="section-header">
            <span class="section-title">Payment Status</span>
            <span style="font-size:11px;color:var(--muted)">${bookings.length} booking(s)</span>
          </div>
          <div class="section-body">
            ${payStatusHtml}
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:20px;font-size:12px">
              <span style="color:var(--muted)">Collected</span>
              <span style="color:var(--accent);font-weight:600">${php(summary.totalPaid)}</span>
              <span style="color:var(--muted);margin-left:auto">Outstanding</span>
              <span style="color:${summary.outstanding > 0 ? 'var(--amber)' : 'var(--green-light)'};font-weight:600">${php(summary.outstanding)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="charts-2col" style="margin-bottom:18px">
        <div class="section-card">
          <div class="section-header">
            <span class="section-title">Today</span>
            <span style="font-size:11px;color:var(--muted)">${new Date().toLocaleDateString('en-PH',{weekday:'long',month:'short',day:'numeric'})}</span>
          </div>
          <div class="section-body" style="padding-top:10px">${todayHtml}</div>
        </div>
        <div class="section-card">
          <div class="section-header"><span class="section-title">Fleet & Customers</span></div>
          <div class="section-body">
            <div class="dash-kpi-grid">
              <div class="dash-kpi">
                <div class="dash-kpi-val">${cars.length}</div>
                <div class="dash-kpi-lbl">Total Cars</div>
              </div>
              <div class="dash-kpi">
                <div class="dash-kpi-val">${activeCount}</div>
                <div class="dash-kpi-lbl">Active</div>
              </div>
              <div class="dash-kpi">
                <div class="dash-kpi-val">${cars.filter(c => c.status === 'Available').length}</div>
                <div class="dash-kpi-lbl">Available</div>
              </div>
              <div class="dash-kpi">
                <div class="dash-kpi-val">${customers.length}</div>
                <div class="dash-kpi-lbl">Customers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <span class="section-title">Recent Bookings</span>
          <button class="btn btn-sm btn-ghost" onclick="window._ctrl.showScreen('bookings')">View All →</button>
        </div>
        ${recentHtml}
      </div>`;
  }
}
