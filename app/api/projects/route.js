import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Project from '@/models/Project';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get('status')) filter.status = searchParams.get('status');
  const projects = await Project.find(filter).populate('manager', 'name').sort('-createdAt');
  return Response.json(projects);
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  await connectDB();
  try {
    const project = await Project.create(await req.json());
    return Response.json(project, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
