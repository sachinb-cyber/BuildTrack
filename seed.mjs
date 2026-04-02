import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Project from './models/Project.js';
import Material from './models/Material.js';
import Supplier from './models/Supplier.js';
import Worker from './models/Worker.js';
import Expense from './models/Expense.js';
import Staff from './models/Staff.js';
import Invoice from './models/Invoice.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/samarth_developers';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  // Clear existing
  console.log('Clearing old data...');
  await User.deleteMany({});
  await Project.deleteMany({});
  await Material.deleteMany({});
  await Supplier.deleteMany({});
  await Worker.deleteMany({});
  await Expense.deleteMany({});
  await Staff.deleteMany({});
  await Invoice.deleteMany({});

  // 1. Users
  console.log('Seeding Users...');
  const users = await User.insertMany([
    { name:'Samarth Admin', email:'admin@samarth.dev', password: await bcrypt.hash('admin123', 12), role:'admin', phone:'9876543210' },
    { name:'Priya Sharma', email:'accountant@samarth.dev', password: await bcrypt.hash('account123', 12), role:'accountant', phone:'9876543211' },
    { name:'Rahul Patil', email:'engineer@samarth.dev', password: await bcrypt.hash('engineer123', 12), role:'engineer', phone:'9876543212' },
  ]);
  const admin = users[0];
  const engineer = users[2];

  // 2. Staff
  console.log('Seeding Staff...');
  const staffArray = await Staff.insertMany([
    { name: 'Amit Kumar', email: 'amit@samarth.dev', phone: '9000000001', role: 'Site Supervisor', department: 'engineering', baseSalary: 35000 },
    { name: 'Neha Gupta', email: 'neha@samarth.dev', phone: '9000000002', role: 'Clerk', department: 'admin', baseSalary: 25000 },
  ]);

  // 3. Workers
  console.log('Seeding Workers...');
  const workersArray = await Worker.insertMany([
    { name: 'Ramesh Singh', phone: '8000000001', aadhar: '111122223333', dailyWage: 600, skill: 'mason' },
    { name: 'Suresh Das', phone: '8000000002', aadhar: '444455556666', dailyWage: 400, skill: 'helper' },
    { name: 'Ravi Mistry', phone: '8000000003', aadhar: '777788889999', dailyWage: 800, skill: 'carpenter' },
  ]);

  // 4. Projects
  console.log('Seeding Projects...');
  const projects = await Project.insertMany([
    {
      name: 'Ganga Heights Residential Array',
      location: 'Pune',
      client: 'Ganga Builders',
      startDate: new Date('2026-01-10'),
      expectedEndDate: new Date('2027-12-31'),
      budget: 50000000,
      spent: 5000000,
      status: 'active',
      description: 'A 10-story residential block with modern amenities.',
      manager: engineer._id,
      workers: [workersArray[0]._id, workersArray[1]._id],
      staff: [staffArray[0]._id]
    },
    {
      name: 'TechPark IT Building',
      location: 'Hinjewadi, Pune',
      client: 'Tech Infrastructures',
      startDate: new Date('2025-06-01'),
      expectedEndDate: new Date('2026-08-01'),
      budget: 80000000,
      spent: 60000000,
      status: 'active',
      description: 'IT hub building complex.',
      manager: engineer._id,
      workers: [workersArray[2]._id],
      staff: [staffArray[0]._id, staffArray[1]._id]
    }
  ]);
  const p1 = projects[0];

  // 5. Suppliers
  console.log('Seeding Suppliers...');
  const suppliers = await Supplier.insertMany([
    { name: 'UltraTech Cement Distributors', company: 'UltraTech', phone: '9999999991', email: 'sales@ultratechpune.in', address: 'Pune City', gstNumber: '27AABCT9988D1Z5', materials: ['cement', 'sand'] },
    { name: 'Tata Steel Wholesale', company: 'Tata Steel', phone: '9999999992', email: 'info@tatasteelpune.in', address: 'MIDC Pune', gstNumber: '27AABCT7766D1Z5', materials: ['steel'] }
  ]);
  const supp1 = suppliers[0];

  // 6. Materials
  console.log('Seeding Materials...');
  const materials = await Material.insertMany([
    { name: 'Portland Cement (50kg)', category: 'cement', unit: 'bags', currentStock: 500, minStock: 100, unitPrice: 350, location: 'Site A Godown' },
    { name: 'TMT Steel Bars 12mm', category: 'steel', unit: 'tons', currentStock: 20, minStock: 5, unitPrice: 55000, location: 'Site A Open Yard' },
    { name: 'River Sand', category: 'sand', unit: 'tons', currentStock: 100, minStock: 20, unitPrice: 1200, location: 'Site B Yard' }
  ]);

  // 7. Expenses
  console.log('Seeding Expenses...');
  await Expense.insertMany([
    { title: 'Excavator Rental for April', category: 'equipment', amount: 45000, project: p1._id, date: new Date(), paymentMethod: 'bank', reference: 'TRX123456', createdBy: admin._id },
    { title: 'Site Office Stationery', category: 'office', amount: 2500, project: p1._id, date: new Date(), paymentMethod: 'cash', createdBy: admin._id }
  ]);

  // 8. Invoices
  console.log('Seeding Invoices...');
  await Invoice.insertMany([
    {
      invoiceNumber: 'INV-2026-001', type: 'supplier', supplier: supp1._id, project: p1._id,
      items: [
        { description: 'Portland Cement 50kg bags', quantity: 200, unit: 'bags', unitPrice: 350, totalPrice: 70000 }
      ],
      subtotal: 70000, tax: 3500, totalAmount: 73500, status: 'paid', dueDate: new Date(), paidDate: new Date(), paidAmount: 73500, createdBy: admin._id
    }
  ]);

  console.log('✅ All sample data seeded successfully!');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
