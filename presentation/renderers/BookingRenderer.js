/**
 * PRESENTATION LAYER — BookingRenderer
 *
 * Renders the Booking Log table and the booking modal form.
 */

import { php, fmtDate, escHtml } from '../../core/utils.js';
import { payBadge, bookBadge, bookingTableRow } from '../components/uiComponents.js';

export class BookingRenderer {
  render(container, { bookings, sort = {} }) {
    if (!bookings.length) {
      container.innerHTML = `<div class="section-card"><div class="empty">
        <div class="empty-icon">📋</div>
        <p>No bookings found.</p>
        <button class="btn btn-primary" onclick="window._ctrl.openBookingModal()">+ Add Booking</button>
      </div></div>`;
      return;
    }

    const th = (label, field) => {
      const isActive = sort.field === field;
      const cls = `sortable${isActive ? ' sort-' + sort.dir : ''}`;
      return `<th class="${cls}" onclick="sortBookings('${field}')">${label}</th>`;
    };

    container.innerHTML = `<div class="section-card">
      <div class="section-header">
        <span class="section-title">All Bookings</span>
        <span style="font-size:12px;color:var(--muted)">${bookings.length} record(s)</span>
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr>
          ${th('Customer','customer')}${th('Car','car')}
          ${th('Service','serviceType')}${th('Pickup','pickup')}${th('Return','ret')}
          <th>Days</th>${th('Total','total')}${th('Paid','paid')}
          <th>Balance</th><th>Payment</th>${th('Status','bookStatus')}<th></th>
        </tr></thead>
        <tbody>${bookings.map(bookingTableRow).join('')}</tbody>
      </table></div>
    </div>`;
  }

  /** Populate booking modal with existing or blank data. */
  fillModal({ booking, cars, customers, isNew }) {
    // Car dropdown
    const carSel = document.getElementById('b-car');
    carSel.innerHTML = '<option value="">Select car…</option>' +
      cars.map(c => `<option value="${c.name}">${c.name} (${c.plate})</option>`).join('');

    // Customer datalist
    document.getElementById('customer-list').innerHTML =
      customers.map(c => `<option value="${c.name}">`).join('');

    if (!isNew && booking) {
      document.getElementById('b-customer').value      = booking.customer;
      document.getElementById('b-contact').value       = booking.contact  || '';
      document.getElementById('b-license').value       = booking.license  || '';
      document.getElementById('b-car').value           = booking.car;
      document.getElementById('b-plate').value         = booking.plate    || '';
      document.getElementById('b-service-type').value  = booking.serviceType || 'Self-drive';
      document.getElementById('b-driver').value        = booking.driver   || '';
      document.getElementById('b-pickup').value        = booking.pickup   || '';
      document.getElementById('b-return').value        = booking.ret      || '';
      document.getElementById('b-rate').value          = booking.rate     || '';
      document.getElementById('b-fees').value          = booking.fees     || 0;
      document.getElementById('b-paid').value          = booking.paid     || 0;
      document.getElementById('b-booking-status').value = booking.bookStatus || 'Active';
      document.getElementById('b-notes').value         = booking.notes    || '';
    } else {
      ['b-customer','b-contact','b-license','b-plate','b-driver','b-pickup','b-return','b-rate','b-notes']
        .forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('b-fees').value = 0;
      document.getElementById('b-paid').value = 0;
      document.getElementById('b-car').value  = '';
      document.getElementById('b-service-type').value = 'Self-drive';
      document.getElementById('b-booking-status').value = 'Active';
    }
  }

  /** Update live calculation display inside the modal. */
  updateCalcDisplay({ days, subtotal, total, payStatus }) {
    const php = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits:2, maximumFractionDigits:2 });
    document.getElementById('b-days').textContent    = days;
    document.getElementById('b-subtotal').textContent = php(subtotal);
    document.getElementById('b-total').textContent   = php(total);
    const ps = document.getElementById('b-pay-status');
    ps.textContent  = payStatus;
    ps.style.color  =
      payStatus === 'Fully Paid'     ? 'var(--accent)' :
      payStatus === 'Partially Paid' ? 'var(--amber)'  : 'var(--red)';
  }

  resetCalcDisplay() {
    document.getElementById('b-days').textContent     = '0';
    document.getElementById('b-subtotal').textContent = '₱0';
    document.getElementById('b-total').textContent    = '₱0';
    document.getElementById('b-pay-status').textContent = '—';
  }
}
