import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Staff from '@/models/Staff';

export async function GET(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const staff = await Staff.findById(params.id).populate('project', 'name location');
  if (!staff) return Response.json({ message: 'Staff not found' }, { status: 404 });
  return Response.json(staff);
}

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  await connectDB();
  try {
    const staff = await Staff.findByIdAndUpdate(params.id, await req.json(), { new: true, runValidators: true });
    if (!staff) return Response.json({ message: 'Staff not found' }, { status: 404 });
    return Response.json(staff);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
