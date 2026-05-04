/**
 * PRESENTATION LAYER — SummaryRenderer
 *
 * Renders the Monthly Summary and Annual Summary screens.
 * Receives pre-computed data from ReportingService.
 */

import { php, MONTHS, MONTHS_SHORT, escHtml } from '../../core/utils.js';
import { barRow, statCard } from '../components/uiComponents.js';
import { ReportingService } from '../../domain/services/ReportingService.js';

export class SummaryRenderer {
  renderMonthly(container, { bookings, month, year }) {
    const summary     = ReportingService.summarise(bookings);
    const revByCar    = ReportingService.revenueByCarSorted(bookings);
    const maxRev      = revByCar.length ? revByCar[0][1] : 1;
    const dailyMap    = ReportingService.dailySummary(bookings);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyBks = Array(daysInMonth + 1).fill(0);
    bookings.forEach(b => { dailyBks[new Date(b.pickup).getDate()]++; });
    const maxDaily = Math.max(...dailyBks, 1);

    container.innerHTML = `
      <div class="stats-grid">
        ${statCard({ label:'Bookings',    value: String(summary.count),    highlight:true })}
        ${statCard({ label:'Total Revenue', value: php(summary.totalRev) })}
        ${statCard({ label:'Collected',   value: php(summary.totalPaid) })}
        ${statCard({ label:'Outstanding', value: php(summary.outstanding),
          subColor: summary.outstanding > 0 ? 'var(--amber)' : 'var(--accent)' })}
      </div>
      <div class="charts-2col">
        <div class="section-card">
          <div class="section-header"><span class="section-title">Daily Booking Trend</span></div>
          <div style="padding:14px 18px 8px">
            <div style="display:flex;align-items:flex-end;gap:2px;height:80px">
              ${Array.from({ length: daysInMonth }, (_, i) => {
                const cnt = dailyBks[i + 1];
                const h   = cnt ? Math.max(Math.round(cnt / maxDaily * 70), 6) : 3;
                return `<div style="flex:1;height:${h}px;border-radius:2px 2px 0 0;background:${cnt ? 'var(--accent)' : 'var(--border)'}"></div>`;
              }).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:4px">
              <span>1</span><span>${Math.ceil(daysInMonth / 2)}</span><span>${daysInMonth}</span>
            </div>
          </div>
        </div>
        <div class="section-card">
          <div class="section-header"><span class="section-title">Revenue by Car</span></div>
          <div class="section-body">
            ${revByCar.length
              ? revByCar.map(([car, rev]) => barRow({ label: car, value: php(rev), pct: Math.round(rev / maxRev * 100) })).join('')
              : '<p style="color:var(--muted);font-size:13px">No bookings this month.</p>'}
          </div>
        </div>
      </div>
      <div class="charts-2col">
        <div class="section-card">
          <div class="section-header"><span class="section-title">Daily Breakdown</span></div>
          <div class="tbl-wrap"><table>
            <thead><tr><th>Day</th><th>Bookings</th><th>Revenue</th></tr></thead>
            <tbody>
              ${Object.entries(dailyMap).sort(([a],[b]) => a-b).map(([d, v]) =>
                `<tr><td>${MONTHS[month-1]} ${d}, ${year}</td><td>${v.cnt}</td><td>${php(v.rev)}</td></tr>`
              ).join('')}
              ${!Object.keys(dailyMap).length ? '<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:20px">No bookings this month</td></tr>' : ''}
            </tbody>
          </table></div>
        </div>
        <div class="section-card">
          <div class="section-header"><span class="section-title">Detail by Car</span></div>
          <div class="tbl-wrap"><table>
            <thead><tr><th>Car</th><th>Bookings</th><th>Revenue</th></tr></thead>
            <tbody>
              ${revByCar.map(([car, rev]) =>
                `<tr><td>${escHtml(car)}</td><td>${bookings.filter(b => b.car === car).length}</td><td>${php(rev)}</td></tr>`
              ).join('')}
              ${!revByCar.length ? '<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:20px">No bookings this month</td></tr>' : ''}
            </tbody>
          </table></div>
        </div>
      </div>`;
  }

  renderAnnual(container, { bookings, year }) {
    const summary    = ReportingService.summarise(bookings);
    const monthly    = ReportingService.monthlySummary(bookings);
    const revByCar   = ReportingService.revenueByCarSorted(bookings);
    const maxMonthRev = Math.max(...monthly.map(m => m.rev), 1);

    container.innerHTML = `
      <div class="stats-grid">
        ${statCard({ label:'Total Bookings', value: String(summary.count), sub:`Year ${year}`, highlight:true })}
        ${statCard({ label:'Total Revenue',  value: php(summary.totalRev) })}
        ${statCard({ label:'Collected',      value: php(summary.totalPaid) })}
        ${statCard({ label:'Outstanding',    value: php(summary.outstanding),
          subColor: summary.outstanding > 0 ? 'var(--amber)' : 'var(--accent)' })}
      </div>
      <div class="section-card">
        <div class="section-header"><span class="section-title">Monthly Revenue Trend — ${year}</span></div>
        <div style="padding:16px 18px 8px">
          <div class="month-trend">
            ${monthly.map((mo, i) => {
              const h = mo.rev ? Math.max(Math.round(mo.rev / maxMonthRev * 90), 5) : 3;
              return `<div class="month-col">
                <div class="month-bar" style="height:${h}px;background:${mo.rev ? 'var(--accent)' : 'var(--border)'}"></div>
                <div class="month-lbl">${MONTHS_SHORT[i]}</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="charts-2col">
        <div class="section-card">
          <div class="section-header"><span class="section-title">Monthly Breakdown</span></div>
          <div class="tbl-wrap"><table>
            <thead><tr><th>Month</th><th>Bookings</th><th>Revenue</th></tr></thead>
            <tbody>
              ${monthly.map((mo, i) => mo.cnt
                ? `<tr><td>${MONTHS[i]}</td><td>${mo.cnt}</td><td style="color:var(--accent)">${php(mo.rev)}</td></tr>`
                : ''
              ).join('')}
              ${!bookings.length ? '<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:20px">No bookings this year</td></tr>' : ''}
            </tbody>
          </table></div>
        </div>
        <div class="section-card">
          <div class="section-header"><span class="section-title">Revenue by Car</span></div>
          <div class="tbl-wrap"><table>
            <thead><tr><th>Car</th><th>Bookings</th><th>Revenue</th></tr></thead>
            <tbody>
              ${revByCar.map(([car, rev]) =>
                `<tr><td>${escHtml(car)}</td><td>${bookings.filter(b => b.car === car).length}</td><td style="color:var(--accent)">${php(rev)}</td></tr>`
              ).join('')}
              ${!revByCar.length ? '<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:20px">No bookings this year</td></tr>' : ''}
            </tbody>
          </table></div>
        </div>
      </div>`;
  }
}
