import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Worker from '@/models/Worker';

export async function GET(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const worker = await Worker.findById(params.id).populate('project', 'name location');
  if (!worker) return Response.json({ message: 'Worker not found' }, { status: 404 });
  return Response.json(worker);
}

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const worker = await Worker.findByIdAndUpdate(params.id, await req.json(), { new: true, runValidators: true });
    if (!worker) return Response.json({ message: 'Worker not found' }, { status: 404 });
    return Response.json(worker);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  await connectDB();
  const worker = await Worker.findByIdAndUpdate(params.id, { isActive: false }, { new: true });
  if (!worker) return Response.json({ message: 'Worker not found' }, { status: 404 });
  return Response.json({ message: 'Worker deactivated' });
}
