/**
 * APPLICATION LAYER — SeedUseCase
 *
 * Seeds demo data on first run. Isolated so it can be removed in production.
 */

export class SeedUseCase {
  constructor(state, repo) {
    this.state = state;
    this.repo  = repo;
  }

  /** Inserts demo data only when the store is completely empty. */
  async seedIfEmpty() {
    if (!(await this.repo.isEmpty())) return;

    const cars = [
      {id:'c1',name:'Toyota Vios',plate:'ABC 1234',year:2020,rate:2500,mileage:48000,mileageDate:'2026-04-22',regExpiry:'2030-05-31',insExpiry:'',inspection:'',notes:''},
      {id:'c2',name:'Honda City',plate:'GHI 3456',year:2024,rate:2200,mileage:'',mileageDate:'',regExpiry:'',insExpiry:'',inspection:'',notes:''},
      {id:'c3',name:'Mitsubishi Montero Sport',plate:'XYZ 5678',year:2022,rate:4500,mileage:'',mileageDate:'',regExpiry:'',insExpiry:'',inspection:'',notes:''},
      {id:'c4',name:'Toyota HiAce Van',plate:'DEF 9012',year:2022,rate:6000,mileage:'',mileageDate:'',regExpiry:'',insExpiry:'',inspection:'',notes:''},
      {id:'c5',name:'Toyota Innova',plate:'JKL 7890',year:2024,rate:5000,mileage:'',mileageDate:'',regExpiry:'',insExpiry:'',inspection:'',notes:''},
    ];
    const customers = [
      {id:'cu1',name:'Juan dela Cruz',phone:'09162914950',license:'N01-23-456789',licenseExpiry:'2030-04-30',address:'Address #1',notes:''},
      {id:'cu2',name:'Maria Santos',phone:'09177122207',license:'N02-34-567890',licenseExpiry:'2032-05-30',address:'Address #2',notes:''},
      {id:'cu3',name:'Roberto Reyes',phone:'09157722009',license:'N03-45-678901',licenseExpiry:'2030-06-15',address:'Address #3',notes:''},
      {id:'cu4',name:'Ana Lim',phone:'09148299137',license:'N04-56-789012',licenseExpiry:'2030-06-10',address:'Address #4',notes:''},
      {id:'cu5',name:'Wendell Pascual',phone:'09521383100',license:'N05-59-797239',licenseExpiry:'2030-07-15',address:'Address #5',notes:''},
    ];
    const bookings = [
      {id:'b1',customer:'Juan dela Cruz',contact:'09162914950',license:'N01-23-456789',car:'Toyota Vios',plate:'ABC 1234',serviceType:'Self-drive',driver:'',pickup:'2026-04-02',ret:'2026-04-03',rate:2500,fees:100,days:1,subtotal:2500,total:2600,paid:5100,payStatus:'Fully Paid',bookStatus:'Completed',notes:''},
      {id:'b2',customer:'Maria Santos',contact:'09177122207',license:'N02-34-567890',car:'Honda City',plate:'GHI 3456',serviceType:'Self-drive',driver:'',pickup:'2026-04-05',ret:'2026-04-08',rate:2200,fees:50,days:3,subtotal:6600,total:6650,paid:6650,payStatus:'Fully Paid',bookStatus:'Completed',notes:''},
      {id:'b3',customer:'Roberto Reyes',contact:'09157722009',license:'N03-45-678901',car:'Mitsubishi Montero Sport',plate:'XYZ 5678',serviceType:'With driver',driver:'Driver #2',pickup:'2026-04-15',ret:'2026-04-16',rate:4500,fees:0,days:1,subtotal:4500,total:4500,paid:2500,payStatus:'Partially Paid',bookStatus:'Active',notes:''},
      {id:'b4',customer:'Ana Lim',contact:'09148299137',license:'N04-56-789012',car:'Toyota Innova',plate:'JKL 7890',serviceType:'With driver',driver:'Driver #2',pickup:'2026-04-20',ret:'2026-04-24',rate:5000,fees:0,days:4,subtotal:20000,total:20000,paid:15000,payStatus:'Partially Paid',bookStatus:'Active',notes:''},
      {id:'b5',customer:'Wendell Pascual',contact:'09521383100',license:'N05-59-797239',car:'Toyota HiAce Van',plate:'DEF 9012',serviceType:'With driver',driver:'Driver #3',pickup:'2026-04-22',ret:'2026-04-25',rate:6000,fees:0,days:3,subtotal:18000,total:18000,paid:0,payStatus:'Unpaid',bookStatus:'Pending',notes:''},
    ];

    this.state.setCars(cars);
    this.state.setCustomers(customers);
    this.state.setBookings(bookings);
    await this.repo.bulkSeed(cars, customers, bookings);
  }
}
