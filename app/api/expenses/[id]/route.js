import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Expense from '@/models/Expense';

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const expense = await Expense.findByIdAndUpdate(params.id, await req.json(), { new: true, runValidators: true });
    if (!expense) return Response.json({ message: 'Expense not found' }, { status: 404 });
    return Response.json(expense);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  await connectDB();
  await Expense.findByIdAndDelete(params.id);
  return Response.json({ message: 'Expense deleted' });
}
