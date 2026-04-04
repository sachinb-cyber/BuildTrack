import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized } from '@/lib/auth';
import Material from '@/models/Material';
import Project from '@/models/Project';
import Invoice from '@/models/Invoice';
import Worker from '@/models/Worker';
import Expense from '@/models/Expense';
import Delivery from '@/models/Delivery';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2) return Response.json([]);

  await connectDB();
  const rx = new RegExp(q, 'i');

  const [materials, projects, invoices, workers, expenses, deliveries] = await Promise.all([
    Material.find({ name: rx }).select('name category currentStock unit').limit(5),
    Project.find({ name: rx }).select('name status location').limit(5),
    Invoice.find({ invoiceNumber: rx }).select('invoiceNumber status totalAmount type').limit(5),
    Worker.find({ name: rx }).select('name role phone isActive').limit(5),
    Expense.find({ title: rx }).select('title category amount date').limit(5),
    Delivery.find({ $or: [{ 'supplier.name': rx }] })
      .populate('supplier', 'name').populate('project', 'name')
      .select('supplier project status deliveryDate').limit(5),
  ]);

  const results = [];
  materials.forEach(m  => results.push({ type: 'material',  label: m.name,            sub: `${m.currentStock} ${m.unit} · ${m.category}`, href: '/inventory',  _id: m._id }));
  projects.forEach(p   => results.push({ type: 'project',   label: p.name,            sub: p.location || p.status,                         href: '/projects',   _id: p._id }));
  invoices.forEach(i   => results.push({ type: 'invoice',   label: i.invoiceNumber,   sub: `₹${i.totalAmount?.toLocaleString('en-IN')} · ${i.status}`, href: '/invoices', _id: i._id }));
  workers.forEach(w    => results.push({ type: 'worker',    label: w.name,            sub: w.role || (w.isActive ? 'Active' : 'Inactive'), href: '/workers',    _id: w._id }));
  expenses.forEach(e   => results.push({ type: 'expense',   label: e.title,           sub: `₹${e.amount?.toLocaleString('en-IN')} · ${e.category}`, href: '/expenses', _id: e._id }));

  return Response.json(results);
}
