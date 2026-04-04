import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized } from '@/lib/auth';
import GeoCapture from '@/models/GeoCapture';
import { sendPush } from '@/lib/push';

export async function PATCH(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return Response.json({ message: 'Admin only' }, { status: 403 });

  await connectDB();
  try {
    const { status, reviewNote } = await req.json();
    if (!['approved', 'rejected'].includes(status))
      return Response.json({ message: 'Invalid status' }, { status: 400 });

    const record = await GeoCapture.findByIdAndUpdate(
      params.id,
      { status, reviewNote: reviewNote || '', reviewedBy: user._id },
      { new: true }
    );
    if (!record) return Response.json({ message: 'Not found' }, { status: 404 });

    // Notify the engineer who uploaded the photo
    if (record.user) {
      sendPush(record.user, {
        title: status === 'approved' ? 'Photo Approved' : 'Photo Rejected',
        body: `Your geo-tagged photo for ${record.projectName || 'the project'} was ${status}${reviewNote ? `: ${reviewNote}` : ''}`,
        url: '/geo-capture',
      }).catch(console.error);
    }

    return Response.json(record);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return Response.json({ message: 'Admin only' }, { status: 403 });

  await connectDB();
  try {
    const record = await GeoCapture.findByIdAndDelete(params.id);
    if (!record) return Response.json({ message: 'Not found' }, { status: 404 });
    return Response.json({ message: 'Deleted' });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
