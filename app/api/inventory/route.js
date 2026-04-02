import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Material from '@/models/Material';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get('category')) filter.category = searchParams.get('category');
  let materials = await Material.find(filter);
  if (searchParams.get('lowStock') === 'true') {
    materials = materials.filter(m => m.currentStock <= m.minStock);
  }
  return Response.json(materials);
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'engineer')) return forbidden();
  await connectDB();
  try {
    const material = await Material.create(await req.json());
    return Response.json(material, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
