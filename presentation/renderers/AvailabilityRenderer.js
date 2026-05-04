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
    const todayDay = this._getTodayDay(year, month);

    const carStats = cars.map(car => this._buildCarStats(car, days, occupancy, doubleBooked));
    const occupancyPct = this._getFleetOccupancyPct(carStats, daysInMonth);
    const tableHtml = this._buildCalendarTable(cars, days, todayDay, occupancy, doubleBooked);
    const statsHtml = this._buildStatsSection(carStats, daysInMonth);

    container.innerHTML = `<div class="section-card">
      <div class="avail-header">
        <span class="avail-header-title">${MONTHS[month-1].toUpperCase()} ${year}</span>
        <span class="avail-header-occ">Fleet occupancy: <strong>${occupancyPct}%</strong></span>
      </div>
      <div class="avail-legend">
        <div class="leg-item"><span class="leg-dot" style="background:linear-gradient(135deg,rgba(29,158,117,.6),rgba(29,158,117,.4))"></span><span>Booked</span></div>
        <div class="leg-item"><span class="leg-dot" style="background:linear-gradient(135deg,rgba(226,75,74,.7),rgba(226,75,74,.5))"></span><span>Double Booked</span></div>
        ${todayDay > 0 ? `<div class="leg-item"><span class="leg-dot today"></span><span>Today (${todayDay})</span></div>` : ''}
        <div class="leg-item avail-legend-tip">📅 Hover cells for details</div>
      </div>
      ${tableHtml}
      ${statsHtml}
    </div>`;
  }

  _getTodayDay(year, month) {
    const now = new Date();
    if (now.getFullYear() !== year || now.getMonth() + 1 !== month) {
      return -1;
    }
    return now.getDate();
  }

  _buildCarStats(car, days, occupancy, doubleBooked) {
    let booked = 0;
    let conflicts = 0;

    for (const day of days) {
      if (doubleBooked.has(`${car.id}-${day}`)) {
        conflicts++;
      } else if (occupancy.get(car.id)?.has(day)) {
        booked++;
      }
    }

    return { car, booked, conflicts };
  }

  _getFleetOccupancyPct(carStats, daysInMonth) {
    const totalCells = carStats.length * daysInMonth;
    if (!totalCells) return 0;

    const occupiedCells = carStats.reduce(
      (sum, stats) => sum + stats.booked + stats.conflicts,
      0,
    );
    return Math.round((occupiedCells / totalCells) * 100);
  }

  _buildCalendarTable(cars, days, todayDay, occupancy, doubleBooked) {
    let html = `<div class="avail-scroll"><table class="avail-tbl"><thead><tr>
      <th class="lh">Car</th><th class="ph">Plate</th>
      ${days.map(d => this._buildDayHeaderCell(d, todayDay)).join('')}
    </tr></thead><tbody>`;

    for (const car of cars) {
      html += `<tr><td class="ln">${escHtml(car.name)}</td><td class="pn">${escHtml(car.plate)}</td>`;
      for (const day of days) {
        html += this._buildCalendarCell(car.id, day, todayDay, occupancy, doubleBooked);
      }
      html += '</tr>';
    }

    html += '</tbody></table></div>';
    return html;
  }

  _buildDayHeaderCell(day, todayDay) {
    const isToday = day === todayDay;
    const todayMarker = isToday ? '<br>●' : '';
    return `<th class="${isToday ? 'today-col' : ''}"><span class="avail-day-head">${day}${todayMarker}</span></th>`;
  }

  _buildCalendarCell(carId, day, todayDay, occupancy, doubleBooked) {
    const isConflict = doubleBooked.has(`${carId}-${day}`);
    const isBooked = occupancy.get(carId)?.has(day);
    const isToday = day === todayDay;
    const stateClass = isConflict ? 'cal-double' : isBooked ? 'cal-booked' : '';
    const todayClass = isToday ? 'cal-today' : '';
    const title = isConflict
      ? `Double booked on ${day}`
      : isBooked
        ? `Booked on ${day}`
        : `Available on ${day}`;

    return `<td><div class="cal-cell ${stateClass} ${todayClass}" title="${title}"></div></td>`;
  }

  _buildStatsSection(carStats, daysInMonth) {
    let html = '<div class="avail-stats">';

    for (const { car, booked, conflicts } of carStats) {
      const occupancyPct = daysInMonth ? Math.round(((booked + conflicts) / daysInMonth) * 100) : 0;
      html += `
        <div class="avail-stat-item">
          <div class="avail-stat-label">${escHtml(car.name)}</div>
          <div class="avail-stat-value">${occupancyPct}%</div>
          <div class="avail-stat-meta">${booked} booked${conflicts ? ` · ${conflicts} conflicts` : ''}</div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }
}
