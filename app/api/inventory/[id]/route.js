import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Material from '@/models/Material';

export async function GET(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const material = await Material.findById(params.id)
    .populate('stockLog.project', 'name')
    .populate('stockLog.supplier', 'name company');
  if (!material) return Response.json({ message: 'Material not found' }, { status: 404 });
  return Response.json(material);
}

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'engineer')) return forbidden();
  await connectDB();
  try {
    const material = await Material.findByIdAndUpdate(params.id, await req.json(), { new: true, runValidators: true });
    if (!material) return Response.json({ message: 'Material not found' }, { status: 404 });
    return Response.json(material);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
