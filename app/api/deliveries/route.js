import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Delivery from '@/models/Delivery';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const project = searchParams.get('project');
    const query = {};
    if (status) query.status = status;
    if (project) query.project = project;
    const deliveries = await Delivery.find(query)
      .populate('supplier', 'name company')
      .populate('project', 'name location')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    return Response.json(deliveries);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'engineer', 'accountant')) return forbidden();
  await connectDB();
  try {
    const body = await req.json();
    if (body.items) body.items = body.items.map(i => ({ ...i, material: i.material || null }));
    const delivery = await Delivery.create({ ...body, createdBy: user._id });
    await delivery.populate('supplier', 'name company');
    await delivery.populate('project', 'name location');
    return Response.json(delivery, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
