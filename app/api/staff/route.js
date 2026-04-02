import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Staff from '@/models/Staff';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get('department')) filter.department = searchParams.get('department');
  if (searchParams.get('project')) filter.project = searchParams.get('project');
  const staff = await Staff.find(filter).populate('project', 'name location');
  return Response.json(staff);
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  await connectDB();
  try {
    const staff = await Staff.create(await req.json());
    return Response.json(staff, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
