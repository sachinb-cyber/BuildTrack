import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden } from '@/lib/auth';
import User from '@/models/User';
import Staff from '@/models/Staff';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();
  await connectDB();
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    return Response.json(users);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();
  await connectDB();
  try {
    const { name, email, password, role, phone, addToStaff, department, baseSalary } = await req.json();

    if (!name || !email || !password || !role)
      return Response.json({ message: 'Name, email, password and role are required' }, { status: 400 });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return Response.json({ message: 'Email already in use' }, { status: 400 });

    const newUser = await User.create({ name, email, password, role, phone });

    // Optionally also add as a Staff record
    let staffRecord = null;
    if (addToStaff) {
      staffRecord = await Staff.create({
        name,
        email,
        phone: phone || '',
        role: role.charAt(0).toUpperCase() + role.slice(1),
        department: department || 'admin',
        baseSalary: baseSalary || 0,
        isActive: true,
      });
    }

    return Response.json({ user: newUser, staff: staffRecord }, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
