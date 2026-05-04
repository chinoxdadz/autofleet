/**
 * APPLICATION LAYER — QuotationUseCases
 *
 * Builds inquiry-based rental quotations using fleet rates and request details.
 */

export class QuotationUseCases {
  constructor(state) {
    this.state = state;
  }

  compute(formData, { strict = false } = {}) {
    const inquiry = this._normalizeInquiry(formData);

    const required = [
      ['pickupLocation', 'Pick-up Location is required.'],
      ['destination', 'Destination is required.'],
      ['dropoffLocation', 'Drop-off Location is required.'],
      ['pickupDateTime', 'Date/Time of Pick up is required.'],
      ['returnDateTime', 'Date/Time of Return is required.'],
      ['passengers', 'No. Of passenger is required.'],
      ['itinerary', 'Itinerary is required.'],
      ['purpose', 'Purpose of travel is required.'],
    ];

    for (const [key, msg] of required) {
      if (!inquiry[key]) {
        if (strict) throw new Error(msg);
        return { ready: false, message: 'Fill in all required inquiry details to generate quotation.' };
      }
    }

    if (new Date(inquiry.returnDateTime) <= new Date(inquiry.pickupDateTime)) {
      if (strict) throw new Error('Return date/time must be after pick-up date/time.');
      return { ready: false, message: 'Return date/time must be after pick-up date/time.' };
    }

    if (inquiry.days <= 0) {
      if (strict) throw new Error('How many days must be at least 1.');
      return { ready: false, message: 'How many days must be at least 1.' };
    }

    if (inquiry.passengers <= 0) {
      if (strict) throw new Error('No. Of passenger must be at least 1.');
      return { ready: false, message: 'No. Of passenger must be at least 1.' };
    }

    const recommendedVehicle = this._recommendVehicle(inquiry.passengers);
    const dailyRate = recommendedVehicle?.rate || this._fallbackRate(inquiry.passengers);

    const baseAmount = dailyRate * inquiry.days;
    const logisticsFee = Math.round(inquiry.days * 350 + Math.max(0, inquiry.passengers - 4) * 120);
    const itineraryStops = Math.max(1, inquiry.itinerary.split(/,|\n/).map(s => s.trim()).filter(Boolean).length);
    const itineraryFee = Math.min(2000, itineraryStops * 200);
    const purposeFee = this._purposeFee(inquiry.purpose);

    const subtotal = baseAmount + logisticsFee + itineraryFee + purposeFee;
    const vat = Math.round(subtotal * 0.12);
    const total = subtotal + vat;

    return {
      ready: true,
      inquiry,
      quote: {
        recommendedVehicleName: recommendedVehicle?.name || 'Suggested vehicle based on passenger count',
        recommendedVehicleRate: dailyRate,
        capacity: recommendedVehicle?.capacity || this._capacityForPassengers(inquiry.passengers),
        baseAmount,
        logisticsFee,
        itineraryFee,
        purposeFee,
        vat,
        total,
      },
    };
  }

  _normalizeInquiry(formData) {
    const pickupDateTime = String(formData.pickupDateTime || '').trim();
    const returnDateTime = String(formData.returnDateTime || '').trim();
    const daysFromDates = this._daysBetweenDateTimes(pickupDateTime, returnDateTime);
    const manualDays = Math.round(Number(formData.days || 0));

    return {
      pickupLocation: String(formData.pickupLocation || '').trim(),
      destination: String(formData.destination || '').trim(),
      dropoffLocation: String(formData.dropoffLocation || '').trim(),
      pickupDateTime,
      returnDateTime,
      days: manualDays > 0 ? manualDays : daysFromDates,
      passengers: Math.round(Number(formData.passengers || 0)),
      itinerary: String(formData.itinerary || '').trim(),
      purpose: String(formData.purpose || '').trim(),
    };
  }

  _daysBetweenDateTimes(start, end) {
    if (!start || !end) return 0;
    const startDt = new Date(start);
    const endDt = new Date(end);
    const diffMs = endDt - startDt;
    if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
    return Math.ceil(diffMs / 86400000);
  }

  _recommendVehicle(passengers) {
    const cars = (this.state?.cars || []).map(car => ({
      name: car.name,
      rate: Number(car.rate || 0),
      capacity: this._capacityFromCarName(car.name),
    }));

    const fit = cars
      .filter(c => c.capacity >= passengers)
      .sort((a, b) => a.rate - b.rate || a.capacity - b.capacity);

    if (fit.length) return fit[0];
    if (!cars.length) return null;

    // Fallback to the largest known-capacity unit if all are below requested passengers.
    return cars.sort((a, b) => b.capacity - a.capacity || a.rate - b.rate)[0];
  }

  _capacityFromCarName(name = '') {
    const n = String(name).toLowerCase();
    if (n.includes('hiace') || n.includes('van') || n.includes('coaster')) return 12;
    if (n.includes('innova') || n.includes('montero') || n.includes('fortuner') || n.includes('suv')) return 7;
    return 4;
  }

  _capacityForPassengers(passengers) {
    if (passengers <= 4) return 4;
    if (passengers <= 7) return 7;
    return 12;
  }

  _fallbackRate(passengers) {
    if (passengers <= 4) return 2500;
    if (passengers <= 7) return 5000;
    return 6500;
  }

  _purposeFee(purpose = '') {
    const p = purpose.toLowerCase();
    if (p.includes('wedding') || p.includes('event')) return 1000;
    if (p.includes('business') || p.includes('corporate')) return 700;
    if (p.includes('tour') || p.includes('vacation')) return 500;
    return 400;
  }
}
