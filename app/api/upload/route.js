import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized } from '@/lib/auth';
import GeoCapture from '@/models/GeoCapture';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const filter = {};
    if (status) filter.status = status;
    // Non-admins only see their own uploads
    if (user.role !== 'admin') filter.user = user._id;

    const records = await GeoCapture.find(filter)
      .populate('project', 'name location')
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(100);
    return Response.json(records);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  try {
    const { imageBase64, lat, lng, accuracy, timestamp, projectId, projectName, userId, userName, notes } = await req.json();

    if (!lat || !lng) return Response.json({ message: 'Location data required' }, { status: 400 });
    if (!imageBase64) return Response.json({ message: 'Image required' }, { status: 400 });

    let imageUrl = null;
    let imageData = null;

    // Try to save file to public/uploads (works on local dev)
    try {
      const base64Data = imageBase64.replace(/^data:image\/jpeg;base64,/, '');
      const fileName = `geo_${Date.now()}_${Math.random().toString(36).substr(2, 8)}.jpg`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), Buffer.from(base64Data, 'base64'));
      imageUrl = `/uploads/${fileName}`;
    } catch {
      // Fallback: store base64 in DB (Vercel / read-only FS)
      imageData = imageBase64;
    }

    const record = await GeoCapture.create({
      imageUrl,
      imageData,
      lat, lng, accuracy,
      timestamp: new Date(timestamp),
      project: projectId || null,
      projectName,
      user: userId || user._id,
      userName: userName || user.name,
      notes,
    });

    return Response.json(record, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
