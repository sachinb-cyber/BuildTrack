import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden } from '@/lib/auth';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();
  await connectDB();
  try {
    const { name, email, role, phone, isActive, password } = await req.json();

    // Prevent admin from demoting themselves
    if (params.id === String(user._id) && role && role !== 'admin')
      return Response.json({ message: 'Cannot change your own role' }, { status: 400 });

    const updates = {};
    if (name)     updates.name     = name;
    if (email)    updates.email    = email.toLowerCase();
    if (role)     updates.role     = role;
    if (phone !== undefined) updates.phone = phone;
    if (isActive !== undefined) updates.isActive = isActive;

    const target = await User.findById(params.id).select('+password');
    if (!target) return Response.json({ message: 'User not found' }, { status: 404 });

    // If resetting password
    if (password && password.length >= 6) {
      target.password = password; // pre-save hook will hash it
    }

    Object.assign(target, updates);
    await target.save();

    const { password: _p, ...safe } = target.toObject();
    return Response.json(safe);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();
  if (params.id === String(user._id))
    return Response.json({ message: 'Cannot delete your own account' }, { status: 400 });
  await connectDB();
  try {
    const target = await User.findByIdAndDelete(params.id);
    if (!target) return Response.json({ message: 'User not found' }, { status: 404 });
    return Response.json({ message: 'User deleted' });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
