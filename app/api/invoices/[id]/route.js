import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Invoice from '@/models/Invoice';

export async function GET(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const invoice = await Invoice.findById(params.id)
    .populate('supplier', 'name company phone gstNumber')
    .populate('project', 'name location')
    .populate('createdBy', 'name');
  if (!invoice) return Response.json({ message: 'Invoice not found' }, { status: 404 });
  return Response.json(invoice);
}

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const invoice = await Invoice.findByIdAndUpdate(params.id, await req.json(), { new: true, runValidators: true });
    if (!invoice) return Response.json({ message: 'Invoice not found' }, { status: 404 });
    return Response.json(invoice);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  await connectDB();
  await Invoice.findByIdAndDelete(params.id);
  return Response.json({ message: 'Invoice deleted' });
}
