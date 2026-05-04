/**
 * PRESENTATION LAYER — AvailabilityRenderer
 *
 * Renders the availability calendar grid. Receives pre-computed occupancy
 * data from the domain service.
 */

import { MONTHS, escHtml } from '../../core/utils.js';

export class AvailabilityRenderer {
  render(container, { cars, occupancy, doubleBooked, month, year }) {
    if (!cars.length) {
      container.innerHTML = `<div class="section-card"><div class="empty">
        <div class="empty-icon">🗓</div>
        <p>Add cars to your fleet to see availability.</p>
      </div></div>`;
      return;
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const now = new Date();
    const todayDay = (now.getFullYear() === year && now.getMonth() + 1 === month)
      ? now.getDate() : -1;

    // Count booked days across all cars for occupancy %
    let totalCells = cars.length * daysInMonth;
    let bookedCells = 0;
    cars.forEach(c => { days.forEach(d => { if (occupancy.get(c.id)?.has(d)) bookedCells++; }); });
    const occupancyPct = totalCells ? Math.round(bookedCells / totalCells * 100) : 0;

    let tbl = `<div class="avail-scroll"><table class="avail-tbl"><thead><tr>
      <th class="lh">Car</th><th class="ph">Plate</th>
      ${days.map(d => `<th class="${d === todayDay ? 'today-col' : ''}">${d}${d === todayDay ? '●' : ''}</th>`).join('')}
    </tr></thead><tbody>`;

    cars.forEach(c => {
      tbl += `<tr><td class="ln">${escHtml(c.name)}</td><td class="pn">${escHtml(c.plate)}</td>`;
      days.forEach(d => {
        const booked = occupancy.get(c.id)?.has(d);
        const dbl    = doubleBooked.has(`${c.id}-${d}`);
        const isToday = d === todayDay;
        tbl += `<td><div class="cal-cell ${dbl ? 'cal-double' : booked ? 'cal-booked' : ''} ${isToday ? 'cal-today' : ''}"></div></td>`;
      });
      tbl += '</tr>';
    });
    tbl += '</tbody></table></div>';

    container.innerHTML = `<div class="section-card">
      <div class="section-header">
        <span class="section-title">${MONTHS[month-1]} ${year} — Fleet Availability</span>
        <span style="font-size:12px;color:var(--muted)">Fleet occupancy: <strong style="color:var(--accent)">${occupancyPct}%</strong></span>
      </div>
      <div class="avail-legend">
        <span><span class="leg-dot" style="background:rgba(29,158,117,.5)"></span>Booked</span>
        <span><span class="leg-dot" style="background:rgba(226,75,74,.5)"></span>Double Booked</span>
        ${todayDay > 0 ? `<span><span class="leg-dot" style="background:transparent;outline:2px solid var(--accent);outline-offset:-1px"></span>Today (${todayDay})</span>` : ''}
      </div>
      ${tbl}
    </div>`;
  }
}
