/**
 * PRESENTATION LAYER — CustomerRenderer
 *
 * Renders the customer grid and modal form.
 */

import { php, fmtDate, escHtml } from '../../core/utils.js';
import { ReportingService } from '../../domain/services/ReportingService.js';

function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function tier(totalBookings, totalSpent) {
  if (totalBookings === 0)                                return { label: 'New',     cls: 'tier-new' };
  if (totalBookings >= 5 || totalSpent >= 50000)          return { label: 'VIP ★',  cls: 'tier-vip' };
  return                                                         { label: 'Regular', cls: 'tier-regular' };
}

function docLink(doc, label) {
  if (!doc?.dataUrl) return '<span style="color:var(--muted)">Missing</span>';
  // Only allow data: URLs (base64 files); block javascript: and other schemes
  if (!doc.dataUrl.startsWith('data:')) return '<span style="color:var(--muted)">Invalid</span>';
  return `<a href="${escHtml(doc.dataUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--blue);text-decoration:none">${escHtml(label)}</a>`;
}

/** Sanitize a phone number to a safe tel: href (digits, +, spaces, dashes only) */
function safeTelHref(phone) {
  return /^[0-9+\-\s()]+$/.test(phone) ? `tel:${phone}` : null;
}

export class CustomerRenderer {
  render(container, { customers, allCustomers, bookings, sort = { field: 'name', dir: 'asc' }, isFiltered = false }) {
    if (!customers.length) {
      container.innerHTML = `<div class="section-card"><div class="empty">
        <div class="empty-icon">👤</div>
        <p>${isFiltered ? 'No customers match your search.' : 'No customers found.'}</p>
        ${!isFiltered ? '<button class="btn btn-primary" onclick="window._ctrl.openCustomerModal()">+ Add Customer</button>' : ''}
      </div></div>`;
      return;
    }

    // Pre-compute stats to avoid O(n²) in sort comparators
    const statsMap = new Map(customers.map(c => [c.id, ReportingService.customerStats(c, bookings)]));

    // Sort
    const sorted = [...customers].sort((a, b) => {
      const mul = sort.dir === 'asc' ? 1 : -1;
      if (sort.field === 'spent')    return (statsMap.get(a.id).totalSpent    - statsMap.get(b.id).totalSpent)    * mul;
      if (sort.field === 'bookings') return (statsMap.get(a.id).totalBookings - statsMap.get(b.id).totalBookings) * mul;
      if (sort.field === 'lastBk') {
        const la = statsMap.get(a.id).lastBk?.pickup || '';
        const lb = statsMap.get(b.id).lastBk?.pickup || '';
        return la < lb ? -1 * mul : la > lb ? mul : 0;
      }
      return a.name.localeCompare(b.name) * mul;
    });

    // Summary stats from full dataset
    const src          = allCustomers || customers;
    const srcStats     = src.map(c => ReportingService.customerStats(c, bookings));
    const totalRevenue = srcStats.reduce((s, st) => s + st.totalSpent, 0);
    const activeCnt    = ReportingService.activeCustomersCount(src, bookings);
    const vipCnt       = srcStats.filter(st => st.totalBookings >= 5 || st.totalSpent >= 50000).length;

    const summaryHtml = `<div class="summary-bar">
      <div class="summary-stat">
        <div class="summary-stat-val">${src.length}</div>
        <div class="summary-stat-lbl">Total Customers</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val" style="color:var(--accent)">${activeCnt}</div>
        <div class="summary-stat-lbl">Currently Active</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val" style="color:var(--green-light)">${php(totalRevenue)}</div>
        <div class="summary-stat-lbl">All-time Revenue</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val" style="color:var(--amber)">${vipCnt}</div>
        <div class="summary-stat-lbl">VIP Customers</div>
      </div>
    </div>`;

    container.innerHTML = summaryHtml + `<div class="cust-grid">${sorted.map(c => {
      const { totalBookings, totalSpent, lastBk } = statsMap.get(c.id);
      const licExpired = c.licenseExpiry && new Date(c.licenseExpiry) < new Date();
      const t          = tier(totalBookings, totalSpent);
      const isActive   = bookings.some(b => b.customer.toLowerCase() === c.name.toLowerCase() && b.bookStatus === 'Active');

      return `<div class="cust-card">
        <div class="cust-header">
          <div class="cust-avatar">${initials(c.name)}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
              <div class="cust-name">${escHtml(c.name)}</div>
              <span class="badge ${t.cls}" style="font-size:9px;padding:2px 6px">${t.label}</span>
              ${isActive ? `<span class="badge badge-green" style="font-size:9px;padding:2px 6px">Active</span>` : ''}
            </div>
            <div class="cust-phone">${(() => {
              const href = c.phone ? safeTelHref(c.phone) : null;
              return href
                ? `<a href="${escHtml(href)}" style="color:var(--blue);text-decoration:none">${escHtml(c.phone)}</a>`
                : escHtml(c.phone || '—');
            })()}</div>
          </div>
        </div>
        <div class="cust-row"><span>Driver's License</span><span class="cust-val" style="font-family:monospace;font-size:12px">${escHtml(c.license || '—')}</span></div>
        <div class="cust-row"><span>License Expiry</span>
          <span class="cust-val" style="color:${licExpired ? 'var(--red)' : 'var(--text)'}">
            ${c.licenseExpiry ? fmtDate(c.licenseExpiry) : '—'}${licExpired ? ' ⚠' : ''}
          </span>
        </div>
        <div class="cust-row"><span>Address</span><span class="cust-val" style="font-size:12px;text-align:right;max-width:200px">${escHtml(c.address || '—')}</span></div>
        <div class="cust-row"><span>ID Document</span><span class="cust-val">${docLink(c.idDocument, 'View ID')}</span></div>
        <div class="cust-row"><span>Signed Agreement</span><span class="cust-val">${docLink(c.agreementDoc, 'View Agreement')}</span></div>
        <div class="cust-row"><span>Total Bookings</span><span class="cust-val">${totalBookings}</span></div>
        <div class="cust-row"><span>Total Spent</span><span class="cust-val" style="color:var(--accent)">${php(totalSpent)}</span></div>
        <div class="cust-row"><span>Last Booking</span><span class="cust-val">${lastBk ? fmtDate(lastBk.pickup) : '—'}</span></div>
        <div class="cust-row"><span>Last Car</span><span class="cust-val">${lastBk ? escHtml(lastBk.car) : '—'}</span></div>
        ${c.notes ? `<div class="cust-row"><span>Notes</span><span class="cust-val" style="font-size:11px;text-align:right;max-width:200px">${escHtml(c.notes)}</span></div>` : ''}
        <div class="cust-actions">
          <button class="btn btn-sm" style="flex:1" onclick="window._ctrl.openCustomerModal('${c.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="window._ctrl.deleteCustomer('${c.id}')">Delete</button>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  fillModal({ customer }) {
    const idHint = document.getElementById('cu-id-upload-hint');
    const agreementHint = document.getElementById('cu-agreement-upload-hint');

    if (customer) {
      document.getElementById('cu-name').value           = customer.name           || '';
      document.getElementById('cu-phone').value          = customer.phone          || '';
      document.getElementById('cu-license').value        = customer.license        || '';
      document.getElementById('cu-license-expiry').value = customer.licenseExpiry  || '';
      document.getElementById('cu-address').value        = customer.address        || '';
      document.getElementById('cu-notes').value          = customer.notes          || '';
      document.getElementById('cu-id-upload').value      = '';
      document.getElementById('cu-agreement-upload').value = '';
      idHint.textContent = customer.idDocument?.name
        ? `Current file: ${customer.idDocument.name}`
        : 'No file uploaded yet.';
      agreementHint.textContent = customer.agreementDoc?.name
        ? `Current file: ${customer.agreementDoc.name}`
        : 'No file uploaded yet.';
    } else {
      ['cu-name','cu-phone','cu-license','cu-license-expiry','cu-address','cu-notes','cu-id-upload','cu-agreement-upload']
        .forEach(id => { document.getElementById(id).value = ''; });
      idHint.textContent = 'Required when creating customer.';
      agreementHint.textContent = 'Required when creating customer.';
    }
  }
}
