import { connectDB } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return Response.json({ message: 'Invalid email or password' }, { status: 401 });
    if (!user.isActive)
      return Response.json({ message: 'Account is deactivated' }, { status: 401 });
    return Response.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user._id)
    });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
