/**
 * PRESENTATION LAYER — AvailabilityRenderer
 *
 * Premium availability calendar with enhanced visual design.
 * Shows occupancy grid with per-car statistics.
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

    // Calculate overall fleet occupancy
    let totalCells = cars.length * daysInMonth;
    let bookedCells = 0;
    let doubleBookedCells = 0;
    cars.forEach(c => {
      days.forEach(d => {
        if (doubleBooked.has(`${c.id}-${d}`)) doubleBookedCells++;
        else if (occupancy.get(c.id)?.has(d)) bookedCells++;
      });
    });
    const occupancyPct = totalCells ? Math.round((bookedCells + doubleBookedCells) / totalCells * 100) : 0;

    // Build calendar table
    let tbl = `<div class="avail-scroll"><table class="avail-tbl"><thead><tr>
      <th class="lh">Car</th><th class="ph">Plate</th>
      ${days.map(d => `<th class="${d === todayDay ? 'today-col' : ''}"><span style="display:inline-block;min-width:20px">${d}${d === todayDay ? '<br>●' : ''}</span></th>`).join('')}
    </tr></thead><tbody>`;

    cars.forEach(c => {
      let carBooked = 0, carDouble = 0;
      tbl += `<tr><td class="ln">${escHtml(c.name)}</td><td class="pn">${escHtml(c.plate)}</td>`;
      days.forEach(d => {
        const booked = occupancy.get(c.id)?.has(d);
        const dbl    = doubleBooked.has(`${c.id}-${d}`);
        const isToday = d === todayDay;
        if (dbl) carDouble++; else if (booked) carBooked++;
        const title = dbl ? `Double booked on ${d}` : booked ? `Booked on ${d}` : `Available on ${d}`;
        tbl += `<td><div class="cal-cell ${dbl ? 'cal-double' : booked ? 'cal-booked' : ''} ${isToday ? 'cal-today' : ''}" title="${title}"></div></td>`;
      });
      tbl += '</tr>';
    });
    tbl += '</tbody></table></div>';

    // Per-car stats
    let stats = '<div class="avail-stats">';
    cars.forEach(c => {
      let carBooked = 0, carDouble = 0;
      days.forEach(d => {
        if (doubleBooked.has(`${c.id}-${d}`)) carDouble++;
        else if (occupancy.get(c.id)?.has(d)) carBooked++;
      });
      const carOccupancy = daysInMonth ? Math.round((carBooked + carDouble) / daysInMonth * 100) : 0;
      stats += `
        <div class="avail-stat-item">
          <div class="avail-stat-label">${escHtml(c.name)}</div>
          <div class="avail-stat-value">${carOccupancy}%</div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px">${carBooked} booked${carDouble ? ` · ${carDouble} conflicts` : ''}</div>
        </div>
      `;
    });
    stats += '</div>';

    container.innerHTML = `<div class="section-card">
      <div class="avail-header">
        <span class="avail-header-title">${MONTHS[month-1].toUpperCase()} ${year}</span>
        <span class="avail-header-occ">Fleet occupancy: <strong>${occupancyPct}%</strong></span>
      </div>
      <div class="avail-legend">
        <div class="leg-item"><span class="leg-dot" style="background:linear-gradient(135deg,rgba(29,158,117,.6),rgba(29,158,117,.4))"></span><span>Booked</span></div>
        <div class="leg-item"><span class="leg-dot" style="background:linear-gradient(135deg,rgba(226,75,74,.7),rgba(226,75,74,.5))"></span><span>Double Booked</span></div>
        ${todayDay > 0 ? `<div class="leg-item"><span class="leg-dot today"></span><span>Today (${todayDay})</span></div>` : ''}
        <div class="leg-item" style="margin-left:auto;color:var(--accent)">📅 Hover cells for details</div>
      </div>
      ${tbl}
      ${stats}
    </div>`;
  }
}
