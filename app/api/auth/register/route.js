import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  try {
    await connectDB();
    const { name, email, password, role, phone } = await req.json();
    const exists = await User.findOne({ email });
    if (exists) return Response.json({ message: 'User already exists' }, { status: 400 });
    const newUser = await User.create({ name, email, password, role, phone });
    return Response.json(newUser, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
