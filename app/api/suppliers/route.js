import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Supplier from '@/models/Supplier';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const suppliers = await Supplier.find().sort('name');
  return Response.json(suppliers);
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const supplier = await Supplier.create(await req.json());
    return Response.json(supplier, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
