/**
 * PRESENTATION LAYER — UI Components
 *
 * Pure HTML-string generators for reusable UI atoms (badges, empty states, etc).
 * No DOM manipulation; each function returns an HTML string to inject.
 */

import { php, fmtDate, escHtml } from '../../core/utils.js';

export function payBadge(status) {
  const cls = {
    'Fully Paid':      'badge-green',
    'Partially Paid':  'badge-amber',
    'Unpaid':          'badge-red',
  };
  return `<span class="badge ${cls[status] || 'badge-gray'}">${escHtml(status)}</span>`;
}

export function bookBadge(status) {
  const cls = {
    'Completed': 'badge-blue',
    'Active':    'badge-green',
    'Pending':   'badge-amber',
    'Cancelled': 'badge-gray',
  };
  return `<span class="badge ${cls[status] || 'badge-gray'}">${escHtml(status)}</span>`;
}

export function emptyState({ icon, message, actionLabel, actionHandler }) {
  const btn = actionLabel
    ? `<button class="btn btn-primary" onclick="${escHtml(actionHandler)}">${escHtml(actionLabel)}</button>`
    : '';
  return `<div class="section-card"><div class="empty">
    <div class="empty-icon">${icon}</div>
    <p>${escHtml(message)}</p>${btn}
  </div></div>`;
}

export function statCard({ label, value, sub, subColor, highlight }) {
  const subStyle = subColor ? `style="color:${subColor}"` : '';
  return `<div class="stat-card${highlight ? ' hi' : ''}">
    <div class="stat-label">${escHtml(label)}</div>
    <div class="stat-value"${String(value).length > 8 ? ' style="font-size:22px"' : ''}>${escHtml(String(value))}</div>
    ${sub ? `<div class="stat-sub" ${subStyle}>${escHtml(sub)}</div>` : ''}
  </div>`;
}

export function barRow({ label, value, pct, color }) {
  return `<div class="bar-row">
    <div class="bar-row-label">
      <span style="color:var(--muted)">${escHtml(label)}</span>
      <span style="color:${color || 'var(--accent)'}">
        ${escHtml(value)}<span class="bar-pct">${pct}%</span>
      </span>
    </div>
    <div class="bar-track">
      <div class="bar-fill" style="width:${pct}%;background:${color || 'var(--accent)'}"></div>
    </div>
  </div>`;
}

export function bookingTableRow(b) {
  const balance = b.total - b.paid;
  const serviceType = b.serviceType || 'Self-drive';
  const serviceCls = serviceType === 'With driver' ? 'badge-blue' : 'badge-gray';
  return `<tr>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">
      <strong>${escHtml(b.customer)}</strong>
    </td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">
      <span>${escHtml(b.car)}</span><br>
      <span style="color:var(--muted);font-size:11px;font-family:monospace">${escHtml(b.plate || '')}</span>
    </td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">
      <span class="badge ${serviceCls}">${escHtml(serviceType)}</span>
    </td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">${fmtDate(b.pickup)}</td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">${fmtDate(b.ret)}</td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer;text-align:center">${b.days}</td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">${php(b.total)}</td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">${php(b.paid)}</td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">
      ${balance < 0
        ? `<span style="color:var(--accent);font-size:11px">Overpaid ${php(-balance)}</span>`
        : balance === 0
          ? `<span style="color:var(--green-light)">Paid ✓</span>`
          : `<span style="color:var(--amber)">${php(balance)}</span>`}
    </td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">${payBadge(b.payStatus)}</td>
    <td onclick="window._ctrl.editBooking('${b.id}')" style="cursor:pointer">${bookBadge(b.bookStatus)}</td>
    <td>
      <div style="display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm" style="border-color:var(--accent);color:var(--accent)" onclick="window._ctrl.printInvoice('${b.id}')" title="Print invoice">Invoice</button>
        <button class="btn btn-sm btn-danger" onclick="window._ctrl.deleteBooking('${b.id}')" title="Delete booking">✕</button>
      </div>
    </td>
  </tr>`;
}
