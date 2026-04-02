import jwt from 'jsonwebtoken';
import { connectDB } from './db';
import User from '@/models/User';

export function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
}

export async function verifyAuth(request) {
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    return user || null;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ message: 'Not authorized' }, { status: 401 });
}

export function forbidden() {
  return Response.json({ message: 'Forbidden' }, { status: 403 });
}

export function authorize(user, ...roles) {
  return roles.includes(user.role);
}
