import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Worker from '@/models/Worker';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get('project')) filter.project = searchParams.get('project');
  if (searchParams.get('skill')) filter.skill = searchParams.get('skill');
  if (searchParams.get('status') === 'active') filter.isActive = true;
  if (searchParams.get('status') === 'inactive') filter.isActive = false;
  const workers = await Worker.find(filter).populate('project', 'name location');
  return Response.json(workers);
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const worker = await Worker.create(await req.json());
    return Response.json(worker, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
