import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Worker from '@/models/Worker';

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const worker = await Worker.findById(params.id);
    if (!worker) return Response.json({ message: 'Worker not found' }, { status: 404 });
    const payment = worker.payments.id(params.paymentId);
    if (!payment) return Response.json({ message: 'Payment not found' }, { status: 404 });
    const { status, paidAmount, paidDate } = await req.json();
    if (status) payment.status = status;
    if (paidAmount !== undefined) payment.paidAmount = paidAmount;
    if (paidDate) payment.paidDate = paidDate;
    if (status === 'paid' && !paidAmount) { payment.paidAmount = payment.totalAmount; payment.paidDate = new Date(); }
    await worker.save();
    return Response.json(worker);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
