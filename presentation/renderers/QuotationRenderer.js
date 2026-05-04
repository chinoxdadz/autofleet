/**
 * PRESENTATION LAYER — QuotationRenderer
 *
 * Renders generated quotation output from inquiry details.
 */

import { escHtml, php } from '../../core/utils.js';

function fmtDateTime(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return escHtml(v);
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export class QuotationRenderer {
  render(container, result) {
    if (!result?.ready) {
      container.innerHTML = `<div class="section-card"><div class="empty">
        <div class="empty-icon">🧾</div>
        <p>${escHtml(result?.message || 'Fill in inquiry details and click Generate Quotation.')}</p>
      </div></div>`;
      return;
    }

    const { inquiry, quote } = result;

    container.innerHTML = `
      <div class="summary-bar">
        <div class="summary-stat">
          <div class="summary-stat-val" style="color:var(--green-light)">${php(quote.total)}</div>
          <div class="summary-stat-lbl">Estimated Total</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-val">${inquiry.days}</div>
          <div class="summary-stat-lbl">How many days</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-val">${inquiry.passengers}</div>
          <div class="summary-stat-lbl">No. of Passenger</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-val">${php(quote.recommendedVehicleRate)}</div>
          <div class="summary-stat-lbl">Daily Rate Basis</div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <span class="section-title">Quotation Details</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-sm" onclick="exportQuotationCsv()">Export CSV</button>
            <button class="btn btn-sm" onclick="printQuotation()">Print</button>
            <button class="btn btn-primary btn-sm" onclick="createBookingDraftFromQuotation()">Create Booking Draft</button>
          </div>
        </div>
        <div class="section-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div>
            <div class="cust-row"><span>Pick-up Location</span><span class="cust-val">${escHtml(inquiry.pickupLocation)}</span></div>
            <div class="cust-row"><span>Destination</span><span class="cust-val">${escHtml(inquiry.destination)}</span></div>
            <div class="cust-row"><span>Drop-off Location</span><span class="cust-val">${escHtml(inquiry.dropoffLocation)}</span></div>
            <div class="cust-row"><span>Date/Time of Pick up</span><span class="cust-val">${fmtDateTime(inquiry.pickupDateTime)}</span></div>
            <div class="cust-row"><span>Date/Time of Return</span><span class="cust-val">${fmtDateTime(inquiry.returnDateTime)}</span></div>
            <div class="cust-row"><span>Purpose of travel</span><span class="cust-val">${escHtml(inquiry.purpose)}</span></div>
          </div>
          <div>
            <div class="cust-row"><span>Recommended Vehicle</span><span class="cust-val">${escHtml(quote.recommendedVehicleName)}</span></div>
            <div class="cust-row"><span>Capacity Basis</span><span class="cust-val">${quote.capacity} pax</span></div>
            <div class="cust-row"><span>Base Amount</span><span class="cust-val">${php(quote.baseAmount)}</span></div>
            <div class="cust-row"><span>Logistics & Coordination</span><span class="cust-val">${php(quote.logisticsFee)}</span></div>
            <div class="cust-row"><span>Itinerary Adjustment</span><span class="cust-val">${php(quote.itineraryFee)}</span></div>
            <div class="cust-row"><span>Purpose-based Fee</span><span class="cust-val">${php(quote.purposeFee)}</span></div>
            <div class="cust-row"><span>VAT (12%)</span><span class="cust-val">${php(quote.vat)}</span></div>
            <div class="cust-row"><span style="color:var(--green-light)">Quotation Total</span><span class="cust-val" style="color:var(--green-light)">${php(quote.total)}</span></div>
          </div>
          <div style="grid-column:span 2" class="cust-row">
            <span>Itinerary</span>
            <span class="cust-val" style="max-width:70%;text-align:right">${escHtml(inquiry.itinerary)}</span>
          </div>
        </div>
      </div>
    `;
  }
}
