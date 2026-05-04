/**
 * PRESENTATION LAYER — AppController
 *
 * The single point of contact between the HTML (event handlers, onclick attrs)
 * and the application/domain layers. Never contains business logic itself.
 *
 * Exposed globally as window._ctrl so inline HTML handlers can reach it.
 */

import { MONTHS, exportCsv, fmtDate, php } from '../../core/utils.js';
import { ReportingService }     from '../../domain/services/ReportingService.js';
import { AvailabilityService }  from '../../domain/services/AvailabilityService.js';

import { DashboardRenderer }    from '../renderers/DashboardRenderer.js';
import { BookingRenderer }      from '../renderers/BookingRenderer.js';
import { FleetRenderer }        from '../renderers/FleetRenderer.js';
import { AvailabilityRenderer } from '../renderers/AvailabilityRenderer.js';
import { SummaryRenderer }      from '../renderers/SummaryRenderer.js';
import { CustomerRenderer }     from '../renderers/CustomerRenderer.js';
import { QuotationRenderer }    from '../renderers/QuotationRenderer.js';

export class AppController {
  constructor({ state, bookingUC, carUC, customerUC, quotationUC }) {
    this.state      = state;
    this.bookingUC  = bookingUC;
    this.carUC      = carUC;
    this.customerUC = customerUC;
    this.quotationUC = quotationUC;

    this._dashR     = new DashboardRenderer();
    this._bookR     = new BookingRenderer();
    this._fleetR    = new FleetRenderer();
    this._availR    = new AvailabilityRenderer();
    this._summaryR  = new SummaryRenderer();
    this._custR     = new CustomerRenderer();
    this._quoteR    = new QuotationRenderer();

    this._editingBookingId  = null;
    this._editingCarId      = null;
    this._editingCustomerId = null;
    this._lastQuotationResult = null;

    // Booking sort state
    this._bookSort  = { field: 'pickup', dir: 'desc' };
  }

  // ── Initialisation ────────────────────────────────────────────────────────

  init() {
    this._setupModalOverlays();
    this._populateSelectors();
    this.updateSidebar();
    this.renderDashboard();
  }

  // ── Screen routing ────────────────────────────────────────────────────────

  showScreen(id, navEl) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    if (navEl) navEl.classList.add('active');
    const map = {
      dashboard:    () => this.renderDashboard(),
      bookings:     () => this.renderBookings(),
      fleet:        () => this.renderFleet(),
      availability: () => this.renderAvailability(),
      monthly:      () => this.renderMonthly(),
      annual:       () => this.renderAnnual(),
      customers:    () => this.renderCustomers(),
      quotation:    () => this.renderQuotation(),
    };
    map[id]?.();
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  renderDashboard() {
    const m = this._getSelVal('dash-month-sel');
    const y = this._getSelVal('dash-year-sel');
    const bookings = ReportingService.forMonth(this.state.bookings, y, m);
    this._dashR.render(
      document.getElementById('dashboard-content'),
      { bookings, recentBookings: this.bookingUC.getRecentBookings(), cars: this.state.cars, customers: this.state.customers, month: m, year: y }
    );
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  renderBookings() {
    const sf       = document.getElementById('book-status-filter').value;
    const sq       = document.getElementById('book-search')?.value || '';
    const stf      = document.getElementById('book-service-filter')?.value || '';
    let   bookings = this.bookingUC.getFilteredBookings(sf, sq, stf);

    // Apply sort
    const { field, dir } = this._bookSort;
    bookings = [...bookings].sort((a, b) => {
      let av = field === 'serviceType' ? (a.serviceType || 'Self-drive') : a[field];
      let bv = field === 'serviceType' ? (b.serviceType || 'Self-drive') : b[field];
      if (field === 'pickup' || field === 'ret') { av = new Date(av); bv = new Date(bv); }
      else if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    this._bookR.render(document.getElementById('bookings-content'), { bookings, sort: this._bookSort });
  }

  sortBookings(field) {
    if (this._bookSort.field === field) {
      this._bookSort.dir = this._bookSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      this._bookSort = { field, dir: 'asc' };
    }
    this.renderBookings();
  }

  exportBookingsCsv() {
    const sf = document.getElementById('book-status-filter').value;
    const sq = document.getElementById('book-search')?.value || '';
    const stf = document.getElementById('book-service-filter')?.value || '';
    const bookings = this.bookingUC.getFilteredBookings(sf, sq, stf);
    const rows = [
      ['Customer','Contact','License','Car','Plate','Service Type','Driver','Pickup','Return','Days','Rate','Fees','Total','Paid','Balance','Payment Status','Booking Status','Notes'],
      ...bookings.map(b => [
        b.customer, b.contact, b.license, b.car, b.plate, b.serviceType || 'Self-drive', b.driver,
        b.pickup, b.ret, b.days, b.rate, b.fees, b.total, b.paid,
        b.total - b.paid, b.payStatus, b.bookStatus, b.notes,
      ]),
    ];
    exportCsv(`bookings-${new Date().toISOString().slice(0,10)}.csv`, rows);
    this._showToast('CSV exported!');
  }

  openBookingModal(id = null) {
    this._editingBookingId = id;
    document.getElementById('booking-modal-title').textContent = id ? 'Edit Booking' : 'New Booking';
    const booking = id ? this.state.bookings.find(b => b.id === id) : null;
    this._bookR.fillModal({ booking, cars: this.state.cars, customers: this.state.customers, isNew: !id });
    if (id) {
      const calcs = this.bookingUC.calculateTotals({
        pickup: booking.pickup, ret: booking.ret,
        rate: booking.rate, fees: booking.fees, paid: booking.paid,
      });
      this._bookR.updateCalcDisplay(calcs);
    } else {
      this._bookR.resetCalcDisplay();
    }
    this.onBookingServiceTypeChange();
    this._openModal('booking-modal');
  }

  editBooking(id) { this.openBookingModal(id); }

  calcBooking() {
    const calcs = this.bookingUC.calculateTotals(this._readBookingForm());
    this._bookR.updateCalcDisplay(calcs);
  }

  autofillCustomer() {
    const name = document.getElementById('b-customer').value;
    const cust = this.customerUC.findByName(name);
    if (cust) {
      document.getElementById('b-contact').value = cust.phone   || '';
      document.getElementById('b-license').value = cust.license || '';
    }
  }

  onCarChange() {
    const name = document.getElementById('b-car').value;
    const car  = this.carUC.getCarByName(name);
    if (car) {
      document.getElementById('b-plate').value = car.plate || '';
      document.getElementById('b-rate').value  = car.rate  || '';
      this.calcBooking();
    }
  }

  onBookingServiceTypeChange() {
    const serviceType = document.getElementById('b-service-type')?.value || 'Self-drive';
    const driverInput = document.getElementById('b-driver');
    if (!driverInput) return;

    const withDriver = serviceType === 'With driver';
    driverInput.disabled = !withDriver;
    driverInput.placeholder = withDriver ? 'Driver #1' : 'Not needed for Self-drive';
    if (!withDriver) driverInput.value = '';
  }

  async saveBooking() {
    try {
      await this.bookingUC.saveBooking(this._readBookingForm(), this._editingBookingId);
      this._closeModal('booking-modal');
      this.renderBookings();
      this.updateSidebar();
      this._showToast(this._editingBookingId ? 'Booking updated!' : 'Booking added!');
    } catch (e) {
      this._showToast(e.message, true);
    }
  }

  deleteBooking(id) {
    this._confirmDelete('Delete Booking', 'This will permanently remove this booking.', async () => {
      try {
        await this.bookingUC.deleteBooking(id);
        this.renderBookings();
        this.updateSidebar();
        this._showToast('Booking deleted.');
      } catch (e) { this._showToast(e.message, true); }
    });
  }

  // ── Fleet ─────────────────────────────────────────────────────────────────

  renderFleet() {
    const q    = (document.getElementById('fleet-search')?.value || '').toLowerCase();
    const cars = q
      ? this.state.cars.filter(c =>
          c.name.toLowerCase().includes(q) || (c.plate || '').toLowerCase().includes(q)
        )
      : this.state.cars;
    const sortVal  = document.getElementById('fleet-sort-sel')?.value || 'name-asc';
    const [field, dir] = sortVal.split('-');
    this._fleetR.render(
      document.getElementById('fleet-content'),
      { cars, allCars: this.state.cars, bookings: this.state.bookings,
        sort: { field, dir }, isFiltered: !!q }
    );
  }

  openCarModal(id = null) {
    this._editingCarId = id;
    document.getElementById('car-modal-title').textContent = id ? 'Edit Car' : 'Add Car';
    const car = id ? this.state.cars.find(c => c.id === id) : null;
    this._fleetR.fillModal({ car });
    this._openModal('car-modal');
  }

  async saveCar() {
    try {
      await this.carUC.saveCar(await this._readCarForm(), this._editingCarId);
      this._closeModal('car-modal');
      this.renderFleet();
      this.updateSidebar();
      this._showToast(this._editingCarId ? 'Car updated!' : 'Car added!');
    } catch (e) {
      this._showToast(e.message, true);
    }
  }

  deleteCar(id) {
    const car = this.state.cars.find(c => c.id === id);
    this._confirmDelete('Delete Car', `Remove "${car?.name}" from your fleet? This does not delete past bookings.`, async () => {
      try {
        await this.carUC.deleteCar(id);
        this.renderFleet();
        this.updateSidebar();
        this._showToast('Car removed.');
      } catch (e) { this._showToast(e.message, true); }
    });
  }

  // ── Availability ──────────────────────────────────────────────────────────

  renderAvailability() {
    const m = this._getSelVal('avail-month-sel');
    const y = this._getSelVal('avail-year-sel');
    const { occupancy, doubleBooked } = AvailabilityService.buildOccupancy(
      this.state.cars, this.state.bookings, y, m
    );
    this._availR.render(
      document.getElementById('availability-content'),
      { cars: this.state.cars, occupancy, doubleBooked, month: m, year: y }
    );
  }

  // ── Monthly / Annual ──────────────────────────────────────────────────────

  renderMonthly() {
    const m = this._getSelVal('mon-month-sel');
    const y = this._getSelVal('mon-year-sel');
    const bookings = ReportingService.forMonth(this.state.bookings, y, m);
    this._summaryR.renderMonthly(document.getElementById('monthly-content'), { bookings, month: m, year: y });
  }

  renderAnnual() {
    const y = this._getSelVal('ann-year-sel');
    const bookings = ReportingService.forYear(this.state.bookings, y);
    this._summaryR.renderAnnual(document.getElementById('annual-content'), { bookings, year: y });
  }

  // ── Customers ─────────────────────────────────────────────────────────────

  renderCustomers() {
    const q         = document.getElementById('cust-search').value || '';
    const customers = this.customerUC.search(q);
    const sortVal   = document.getElementById('cust-sort-sel')?.value || 'name-asc';
    const [field, dir] = sortVal.split('-');
    this._custR.render(
      document.getElementById('customers-content'),
      { customers, allCustomers: this.state.customers, bookings: this.state.bookings,
        sort: { field, dir }, isFiltered: !!q }
    );
  }

  openCustomerModal(id = null) {
    this._editingCustomerId = id;
    document.getElementById('customer-modal-title').textContent = id ? 'Edit Customer' : 'Add Customer';
    const customer = id ? this.state.customers.find(c => c.id === id) : null;
    this._custR.fillModal({ customer });
    this._openModal('customer-modal');
  }

  async saveCustomer() {
    try {
      await this.customerUC.saveCustomer(await this._readCustomerForm(), this._editingCustomerId);
      this._closeModal('customer-modal');
      this.renderCustomers();
      this._showToast(this._editingCustomerId ? 'Customer updated!' : 'Customer added!');
    } catch (e) {
      this._showToast(e.message, true);
    }
  }

  deleteCustomer(id) {
    const c = this.state.customers.find(x => x.id === id);
    this._confirmDelete('Delete Customer', `Remove "${c?.name}"? Their booking history will remain.`, async () => {
      try {
        await this.customerUC.deleteCustomer(id);
        this.renderCustomers();
        this._showToast('Customer removed.');
      } catch (e) { this._showToast(e.message, true); }
    });
  }

  exportCustomersCsv() {
    const q         = document.getElementById('cust-search').value || '';
    const customers = this.customerUC.search(q);
    const rows = [
      ['Name','Phone','License','License Expiry','Address','Total Bookings','Total Spent','Last Booking','Last Car','Notes'],
      ...customers.map(c => {
        const { totalBookings, totalSpent, lastBk } = ReportingService.customerStats(c, this.state.bookings);
        return [c.name, c.phone, c.license, c.licenseExpiry, c.address,
          totalBookings, totalSpent, lastBk?.pickup || '', lastBk?.car || '', c.notes];
      }),
    ];
    exportCsv(`customers-${new Date().toISOString().slice(0,10)}.csv`, rows);
    this._showToast('Customers exported!');
  }

  // ── Quotation Maker ──────────────────────────────────────────────────────

  renderQuotation() {
    this._quoteR.render(
      document.getElementById('quotation-content'),
      this._lastQuotationResult || { ready: false, message: 'Fill in inquiry details and click Generate Quotation.' }
    );
  }

  generateQuotation() {
    try {
      this.syncQuotationDays();
      const result = this.quotationUC.compute(this._readQuotationForm(), { strict: true });
      if (!document.getElementById('q-days').value) {
        document.getElementById('q-days').value = result.inquiry.days;
      }
      this._lastQuotationResult = result;
      this._quoteR.render(document.getElementById('quotation-content'), result);
      this._showToast('Quotation generated!');
    } catch (e) {
      this._showToast(e.message, true);
    }
  }

  syncQuotationDays() {
    const pickup = document.getElementById('q-pickup-datetime')?.value;
    const ret = document.getElementById('q-return-datetime')?.value;
    if (!pickup || !ret) return;

    const diff = new Date(ret) - new Date(pickup);
    if (!Number.isFinite(diff) || diff <= 0) return;
    document.getElementById('q-days').value = Math.ceil(diff / 86400000);
  }

  createBookingDraftFromQuotation() {
    if (!this._lastQuotationResult?.ready) {
      this._showToast('Generate a quotation first.', true);
      return;
    }

    const { inquiry, quote } = this._lastQuotationResult;
    const bookingNav = document.querySelector('[onclick="showScreen(\'bookings\',this)"]');
    this.showScreen('bookings', bookingNav);
    this.openBookingModal();

    document.getElementById('b-car').value = quote.recommendedVehicleName || '';
    this.onCarChange();

    document.getElementById('b-pickup').value = this._datePart(inquiry.pickupDateTime);
    document.getElementById('b-return').value = this._datePart(inquiry.returnDateTime);
    document.getElementById('b-service-type').value = 'Self-drive';
    document.getElementById('b-driver').value = '';
    this.onBookingServiceTypeChange();
    document.getElementById('b-rate').value = quote.recommendedVehicleRate || '';
    document.getElementById('b-fees').value = 0;
    document.getElementById('b-paid').value = 0;
    document.getElementById('b-booking-status').value = 'Pending';
    document.getElementById('b-notes').value =
      `Quoted Trip\n` +
      `Pickup: ${inquiry.pickupLocation}\n` +
      `Destination: ${inquiry.destination}\n` +
      `Drop-off: ${inquiry.dropoffLocation}\n` +
      `Passengers: ${inquiry.passengers}\n` +
      `Purpose: ${inquiry.purpose}\n` +
      `Itinerary: ${inquiry.itinerary}`;

    this.calcBooking();
    this._showToast('Booking draft created from quotation.');
  }

  exportQuotationCsv() {
    if (!this._lastQuotationResult?.ready) {
      this._showToast('Generate a quotation first.', true);
      return;
    }
    const { inquiry, quote } = this._lastQuotationResult;
    const rows = [
      ['Field', 'Value'],
      ['Pick-up Location', inquiry.pickupLocation],
      ['Destination', inquiry.destination],
      ['Drop-off Location', inquiry.dropoffLocation],
      ['Date/Time of Pick up', inquiry.pickupDateTime],
      ['Date/Time of Return', inquiry.returnDateTime],
      ['How many days', inquiry.days],
      ['No. Of passenger', inquiry.passengers],
      ['Itinerary', inquiry.itinerary],
      ['Purpose of travel', inquiry.purpose],
      ['Recommended Vehicle', quote.recommendedVehicleName],
      ['Daily Rate Basis', quote.recommendedVehicleRate],
      ['Base Amount', quote.baseAmount],
      ['Logistics & Coordination', quote.logisticsFee],
      ['Itinerary Adjustment', quote.itineraryFee],
      ['Purpose-based Fee', quote.purposeFee],
      ['VAT', quote.vat],
      ['Quotation Total', quote.total],
    ];
    exportCsv(`quotation-${new Date().toISOString().slice(0,10)}.csv`, rows);
    this._showToast('Quotation CSV exported!');
  }

  printQuotation() {
    if (!this._lastQuotationResult?.ready) {
      this._showToast('Generate a quotation first.', true);
      return;
    }
    const { inquiry, quote } = this._lastQuotationResult;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      this._showToast('Please allow popups to print quotation.', true);
      return;
    }

    w.document.write(`<!doctype html><html><head><title>Quotation</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;font-size:13px;text-align:left}.right{text-align:right}.total{font-weight:bold;background:#f5f5f5}</style>
      </head><body>
      <h1>AutoFleet Quotation</h1><div>Date: ${new Date().toLocaleDateString('en-PH')}</div>
      <table><tbody>
      <tr><th>Pick-up Location</th><td>${inquiry.pickupLocation}</td></tr>
      <tr><th>Destination</th><td>${inquiry.destination}</td></tr>
      <tr><th>Drop-off Location</th><td>${inquiry.dropoffLocation}</td></tr>
      <tr><th>Date/Time of Pick up</th><td>${inquiry.pickupDateTime}</td></tr>
      <tr><th>Date/Time of Return</th><td>${inquiry.returnDateTime}</td></tr>
      <tr><th>How many days</th><td>${inquiry.days}</td></tr>
      <tr><th>No. Of passenger</th><td>${inquiry.passengers}</td></tr>
      <tr><th>Purpose of travel</th><td>${inquiry.purpose}</td></tr>
      <tr><th>Itinerary</th><td>${inquiry.itinerary}</td></tr>
      </tbody></table>
      <table><tbody>
      <tr><th>Recommended Vehicle</th><td>${quote.recommendedVehicleName}</td></tr>
      <tr><th>Daily Rate Basis</th><td class="right">${php(quote.recommendedVehicleRate)}</td></tr>
      <tr><th>Base Amount</th><td class="right">${php(quote.baseAmount)}</td></tr>
      <tr><th>Logistics & Coordination</th><td class="right">${php(quote.logisticsFee)}</td></tr>
      <tr><th>Itinerary Adjustment</th><td class="right">${php(quote.itineraryFee)}</td></tr>
      <tr><th>Purpose-based Fee</th><td class="right">${php(quote.purposeFee)}</td></tr>
      <tr><th>VAT (12%)</th><td class="right">${php(quote.vat)}</td></tr>
      <tr class="total"><th>Quotation Total</th><td class="right">${php(quote.total)}</td></tr>
      </tbody></table>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  resetQuotation() {
    [
      'q-pickup-location',
      'q-destination',
      'q-dropoff-location',
      'q-pickup-datetime',
      'q-return-datetime',
      'q-days',
      'q-passengers',
      'q-itinerary',
      'q-purpose',
    ].forEach(id => { document.getElementById(id).value = ''; });
    this._lastQuotationResult = null;
    this.renderQuotation();
  }

  // ── Sidebar footer ────────────────────────────────────────────────────────

  updateSidebar() {
    const now       = new Date();
    const thisMonth = this.state.bookings.filter(b => {
      const d = new Date(b.pickup);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    document.getElementById('sidebar-footer').innerHTML =
      `${now.toLocaleDateString('en-PH', { month:'long', year:'numeric' })}<br>` +
      `${this.state.cars.length} car(s) · ${this.state.customers.length} customer(s)<br>` +
      `${thisMonth.length} booking(s) this month`;
  }

  /** Re-render whichever screen is currently visible (used by Realtime handler). */
  refreshCurrentScreen() {
    const screen = document.querySelector('.screen.active');
    if (!screen) return;
    const id = screen.id.replace('screen-', '');
    const map = {
      dashboard:    () => this.renderDashboard(),
      bookings:     () => this.renderBookings(),
      fleet:        () => this.renderFleet(),
      availability: () => this.renderAvailability(),
      monthly:      () => this.renderMonthly(),
      annual:       () => this.renderAnnual(),
      customers:    () => this.renderCustomers(),
      quotation:    () => this.renderQuotation(),
    };
    map[id]?.();
    this.updateSidebar();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  _getSelVal(id) { return parseInt(document.getElementById(id).value); }

  _openModal(id)  { document.getElementById(id).classList.add('open');    }
  _closeModal(id) { document.getElementById(id).classList.remove('open'); }

  _showToast(msg, err = false) {
    const t = document.getElementById('toast');
    t.innerHTML = `<span class="toast-icon">${err ? '✕' : '✓'}</span><span>${msg}</span>`;
    t.className   = 'toast' + (err ? ' error' : '') + ' show';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { t.className = 'toast'; }, 3000);
  }

  _confirmDelete(title, msg, cb) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent   = msg;
    const btn = document.getElementById('confirm-ok');
    btn.onclick = () => { cb(); this._closeModal('confirm-modal'); };
    this._openModal('confirm-modal');
  }

  _setupModalOverlays() {
    document.querySelectorAll('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', e => {
        if (e.target === ov) ov.classList.remove('open');
      });
    });
  }

  _populateSelectors() {
    const now   = new Date();
    const years = ReportingService.availableYears(this.state.bookings);

    const monthPairs = [
      ['dash-month-sel', 'dash-year-sel'],
      ['avail-month-sel', 'avail-year-sel'],
      ['mon-month-sel', 'mon-year-sel'],
    ];
    monthPairs.forEach(([ms, ys]) => {
      document.getElementById(ms).innerHTML =
        MONTHS.map((m, i) => `<option value="${i+1}" ${i === now.getMonth() ? 'selected' : ''}>${m}</option>`).join('');
      document.getElementById(ys).innerHTML =
        years.map(y => `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`).join('');
    });
    document.getElementById('ann-year-sel').innerHTML =
      years.map(y => `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`).join('');
  }

  _readBookingForm() {
    return {
      customer:    document.getElementById('b-customer').value.trim(),
      contact:     document.getElementById('b-contact').value,
      license:     document.getElementById('b-license').value,
      car:         document.getElementById('b-car').value,
      plate:       document.getElementById('b-plate').value,
      serviceType: document.getElementById('b-service-type').value,
      driver:      document.getElementById('b-driver').value,
      pickup:      document.getElementById('b-pickup').value,
      ret:         document.getElementById('b-return').value,
      rate:        parseFloat(document.getElementById('b-rate').value)  || 0,
      fees:        parseFloat(document.getElementById('b-fees').value)  || 0,
      paid:        parseFloat(document.getElementById('b-paid').value)  || 0,
      bookStatus:  document.getElementById('b-booking-status').value,
      notes:       document.getElementById('b-notes').value,
    };
  }

  async _readCarForm() {
    return {
      name:        document.getElementById('c-name').value,
      plate:       document.getElementById('c-plate').value,
      year:        document.getElementById('c-year').value,
      rate:        document.getElementById('c-rate').value,
      mileage:     document.getElementById('c-mileage').value,
      mileageDate: document.getElementById('c-mileage-date').value,
      regExpiry:   document.getElementById('c-reg-expiry').value,
      insExpiry:   document.getElementById('c-ins-expiry').value,
      inspection:  document.getElementById('c-inspection').value,
      notes:       document.getElementById('c-notes').value,
      photo:       await this._readFileMeta('c-photo-upload'),
    };
  }

  async _readCustomerForm() {
    return {
      name:          document.getElementById('cu-name').value,
      phone:         document.getElementById('cu-phone').value,
      license:       document.getElementById('cu-license').value,
      licenseExpiry: document.getElementById('cu-license-expiry').value,
      address:       document.getElementById('cu-address').value,
      notes:         document.getElementById('cu-notes').value,
      idDocument:    await this._readFileMeta('cu-id-upload'),
      agreementDoc:  await this._readFileMeta('cu-agreement-upload'),
    };
  }

  _readQuotationForm() {
    return {
      pickupLocation: document.getElementById('q-pickup-location').value,
      destination: document.getElementById('q-destination').value,
      dropoffLocation: document.getElementById('q-dropoff-location').value,
      pickupDateTime: document.getElementById('q-pickup-datetime').value,
      returnDateTime: document.getElementById('q-return-datetime').value,
      days: document.getElementById('q-days').value,
      passengers: document.getElementById('q-passengers').value,
      itinerary: document.getElementById('q-itinerary').value,
      purpose: document.getElementById('q-purpose').value,
    };
  }

  _datePart(dateTimeStr) {
    if (!dateTimeStr) return '';
    const d = new Date(dateTimeStr);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async _readFileMeta(inputId) {
    const file = document.getElementById(inputId)?.files?.[0];
    if (!file) return null;
    const maxSize = 1.5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`"${file.name}" is too large. Please upload files up to 1.5 MB.`);
    }

    return {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      dataUrl: await this._fileToDataUrl(file),
    };
  }

  _fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
      reader.readAsDataURL(file);
    });
  }
}
