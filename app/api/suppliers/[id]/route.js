import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Supplier from '@/models/Supplier';

export async function GET(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const supplier = await Supplier.findById(params.id);
  if (!supplier) return Response.json({ message: 'Supplier not found' }, { status: 404 });
  return Response.json(supplier);
}

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const supplier = await Supplier.findByIdAndUpdate(params.id, await req.json(), { new: true, runValidators: true });
    if (!supplier) return Response.json({ message: 'Supplier not found' }, { status: 404 });
    return Response.json(supplier);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
