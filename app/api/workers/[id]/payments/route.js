import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Worker from '@/models/Worker';

export async function POST(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const worker = await Worker.findById(params.id);
    if (!worker) return Response.json({ message: 'Worker not found' }, { status: 404 });
    const { weekStartDate, weekEndDate, daysWorked, overtime, deductions, notes, dailyWage } = await req.json();
    const wage = dailyWage || worker.dailyWage;
    const totalAmount = (daysWorked * wage) + (overtime || 0) - (deductions || 0);
    worker.payments.push({ weekStartDate, weekEndDate, daysWorked, dailyWage: wage, overtime: overtime || 0, deductions: deductions || 0, totalAmount, notes });
    await worker.save();
    return Response.json(worker, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
