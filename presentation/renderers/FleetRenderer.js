/**
 * PRESENTATION LAYER — FleetRenderer
 *
 * Renders the fleet grid and the car modal form.
 */

import { php, fmtDate, escHtml } from '../../core/utils.js';
import { ReportingService } from '../../domain/services/ReportingService.js';

export class FleetRenderer {
  render(container, { cars, allCars, bookings, sort = { field: 'name', dir: 'asc' }, isFiltered = false }) {
    if (!cars.length) {
      container.innerHTML = `<div class="section-card"><div class="empty">
        <div class="empty-icon">🚗</div>
        <p>${isFiltered ? 'No cars match your search.' : 'No cars in your fleet yet.'}</p>
        ${!isFiltered ? '<button class="btn btn-primary" onclick="window._ctrl.openCarModal()">+ Add Car</button>' : ''}
      </div></div>`;
      return;
    }

    const today      = new Date();
    const year       = today.getFullYear();
    const daysInYear = (new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / 86400000;

    // Pre-compute per-car stats to avoid O(n²) in sort comparators
    const revenueMap    = new Map(cars.map(c => [c.id, ReportingService.carRevenue(c, bookings)]));
    const bookedDaysMap = new Map(cars.map(c => [c.id, ReportingService.carBookedDays(c, bookings, year)]));
    const activeMap     = new Map(cars.map(c => [c.id, bookings.filter(b => b.car === c.name && b.bookStatus === 'Active').length]));

    // Sort
    const sorted = [...cars].sort((a, b) => {
      const mul = sort.dir === 'asc' ? 1 : -1;
      if (sort.field === 'rate')    return (a.rate - b.rate) * mul;
      if (sort.field === 'revenue') return (revenueMap.get(a.id) - revenueMap.get(b.id)) * mul;
      if (sort.field === 'status')  return (activeMap.get(a.id) - activeMap.get(b.id)) * mul;
      return a.name.localeCompare(b.name) * mul;
    });

    // Summary stats from full fleet (not just filtered subset)
    const src         = allCars || cars;
    const totalActive = bookings.filter(b => b.bookStatus === 'Active').length;
    const totalAvail  = src.filter(c => !bookings.some(b => b.car === c.name && b.bookStatus === 'Active')).length;
    const allTimeRev  = bookings.reduce((s, b) => s + Number(b.total || 0), 0);
    const withWarns   = src.filter(c => c.isRegExpiringSoon?.(today) || c.isInsExpiringSoon?.(today)).length;

    const summaryHtml = `<div class="summary-bar">
      <div class="summary-stat">
        <div class="summary-stat-val">${src.length}</div>
        <div class="summary-stat-lbl">Total Cars</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val" style="color:var(--accent)">${totalActive}</div>
        <div class="summary-stat-lbl">Active Bookings</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val" style="color:var(--green-light)">${totalAvail}</div>
        <div class="summary-stat-lbl">Cars Available</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val" style="color:var(--green-light)">${php(allTimeRev)}</div>
        <div class="summary-stat-lbl">All-time Revenue</div>
      </div>
      ${withWarns ? `<div class="summary-stat">
        <div class="summary-stat-val" style="color:var(--amber)">${withWarns} ⚠</div>
        <div class="summary-stat-lbl">Expiry Warnings</div>
      </div>` : ''}
    </div>`;

    container.innerHTML = summaryHtml + `<div class="fleet-grid">${sorted.map(c => {
      const regWarn    = c.isRegExpiringSoon?.(today) ?? false;
      const insWarn    = c.isInsExpiringSoon?.(today) ?? false;
      const inspWarn   = c.inspection && new Date(c.inspection) < today;
      const totalRevCar  = revenueMap.get(c.id);
      const totalBkgs    = bookings.filter(b => b.car === c.name).length;
      const activeBkgs   = activeMap.get(c.id);
      const pendingBkgs  = bookings.filter(b => b.car === c.name && b.bookStatus === 'Pending').length;
      const bookedDays   = bookedDaysMap.get(c.id);
      const utilPct      = Math.min(Math.round(bookedDays / daysInYear * 100), 100);

      const statusBadge = activeBkgs > 0
        ? `<span class="badge badge-green" style="font-size:10px">${activeBkgs} Active</span>`
        : pendingBkgs > 0
          ? `<span class="badge badge-amber" style="font-size:10px">${pendingBkgs} Pending</span>`
          : `<span class="badge badge-gray" style="font-size:10px">Available</span>`;

      const pendingExtra = activeBkgs > 0 && pendingBkgs > 0
        ? `<span class="badge badge-amber" style="font-size:10px">${pendingBkgs} Pending</span>`
        : '';
      const photoHtml = c.photo?.dataUrl
        ? `<img class="fleet-photo-img" src="${escHtml(c.photo.dataUrl)}" alt="${escHtml(c.name)}">`
        : `<div class="fleet-photo-empty">No Photo<button class="btn btn-sm" onclick="window._ctrl.openCarModal('${c.id}')">Upload</button></div>`;

      return `<div class="fleet-card">
        <div class="fleet-photo">${photoHtml}</div>
        <div class="fleet-card-body">
          <div class="fleet-card-top">
            <div style="flex:1;min-width:0">
              <div class="fleet-car-name">${escHtml(c.name)}</div>
              <div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">${statusBadge}${pendingExtra}</div>
            </div>
            <span class="plate-tag">${escHtml(c.plate)}</span>
          </div>
          <div class="fleet-card-meta">
            <span class="fleet-card-rate">${c.rate ? php(c.rate) : '—'}<span style="font-family:'DM Sans',sans-serif;font-size:10px;color:var(--muted);margin-left:2px">/day</span></span>
            <span style="font-size:11px;color:var(--muted)">${c.year || ''}</span>
          </div>

          <div class="fleet-details" id="fleet-details-${c.id}">
            <div class="fleet-row"><span>Mileage</span><span class="fleet-val">${c.mileage !== '' && c.mileage !== undefined ? Number(c.mileage).toLocaleString() + ' km' : '—'}</span></div>
            <div class="fleet-row"><span>Reg. Expiry</span>
              <span class="fleet-val" style="color:${regWarn ? 'var(--amber)' : 'var(--text)'}">${c.regExpiry ? fmtDate(c.regExpiry) : '—'}${regWarn ? ' ⚠' : ''}</span>
            </div>
            <div class="fleet-row"><span>Ins. Expiry</span>
              <span class="fleet-val" style="color:${insWarn ? 'var(--amber)' : 'var(--text)'}">${c.insExpiry ? fmtDate(c.insExpiry) : '—'}${insWarn ? ' ⚠' : ''}</span>
            </div>
            <div class="fleet-row"><span>Next Inspection</span>
              <span class="fleet-val" style="color:${inspWarn ? 'var(--red)' : 'var(--text)'}">${c.inspection ? fmtDate(c.inspection) : '—'}${inspWarn ? ' ⚠' : ''}</span>
            </div>
            <div class="fleet-row"><span>Total Bookings</span><span class="fleet-val">${totalBkgs}</span></div>
            <div class="fleet-row"><span>Total Revenue</span><span class="fleet-val" style="color:var(--green-light)">${php(totalRevCar)}</span></div>
            <div class="fleet-util-row">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px">
                <span>Utilization ${year}</span><span style="color:var(--accent)">${utilPct}%</span>
              </div>
              <div class="util-track"><div class="util-fill" style="width:${utilPct}%"></div></div>
            </div>
            ${c.notes ? `<div class="fleet-row"><span>Notes</span><span class="fleet-val" style="font-size:11px;text-align:right;max-width:160px">${escHtml(c.notes)}</span></div>` : ''}
          </div>

          <div class="fleet-actions">
            <button class="btn btn-sm fleet-details-btn" onclick="toggleFleetDetails('${c.id}', this)">View Details ▾</button>
            <button class="btn btn-sm" onclick="window._ctrl.openCarModal('${c.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="window._ctrl.deleteCar('${c.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  fillModal({ car }) {
    const photoHint = document.getElementById('c-photo-upload-hint');

    if (car) {
      document.getElementById('c-name').value        = car.name        || '';
      document.getElementById('c-plate').value       = car.plate       || '';
      document.getElementById('c-year').value        = car.year        || '';
      document.getElementById('c-rate').value        = car.rate        || '';
      document.getElementById('c-mileage').value     = car.mileage     || '';
      document.getElementById('c-mileage-date').value = car.mileageDate || '';
      document.getElementById('c-reg-expiry').value  = car.regExpiry   || '';
      document.getElementById('c-ins-expiry').value  = car.insExpiry   || '';
      document.getElementById('c-inspection').value  = car.inspection  || '';
      document.getElementById('c-notes').value       = car.notes       || '';
      document.getElementById('c-photo-upload').value = '';
      photoHint.textContent = car.photo?.name
        ? `Current file: ${car.photo.name}`
        : 'No photo uploaded yet.';
    } else {
      ['c-name','c-plate','c-year','c-rate','c-mileage','c-mileage-date','c-reg-expiry','c-ins-expiry','c-inspection','c-notes','c-photo-upload']
        .forEach(id => { document.getElementById(id).value = ''; });
      photoHint.textContent = 'Required for new cars. Upload an actual photo of this vehicle.';
    }
  }
}
