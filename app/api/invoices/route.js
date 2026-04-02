import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Invoice from '@/models/Invoice';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get('type')) filter.type = searchParams.get('type');
  if (searchParams.get('status')) filter.status = searchParams.get('status');
  if (searchParams.get('supplier')) filter.supplier = searchParams.get('supplier');
  if (searchParams.get('project')) filter.project = searchParams.get('project');
  const invoices = await Invoice.find(filter)
    .populate('supplier', 'name company')
    .populate('project', 'name location')
    .populate('createdBy', 'name')
    .sort('-createdAt');
  return Response.json(invoices);
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const count = await Invoice.countDocuments();
    const invoiceNumber = `SD-INV-${String(count + 1).padStart(5, '0')}`;
    const invoice = await Invoice.create({ ...await req.json(), invoiceNumber, createdBy: user._id });
    return Response.json(invoice, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
