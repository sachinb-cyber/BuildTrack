import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized } from '@/lib/auth';
import PushSub from '@/models/PushSubscription';

export async function GET() {
  return Response.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  try {
    const subscription = await req.json();
    // Upsert: one subscription per endpoint per user
    await PushSub.findOneAndUpdate(
      { user: user._id, 'subscription.endpoint': subscription.endpoint },
      { user: user._id, subscription },
      { upsert: true, new: true }
    );
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  try {
    const { endpoint } = await req.json();
    await PushSub.deleteMany({ user: user._id, 'subscription.endpoint': endpoint });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
