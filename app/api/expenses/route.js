import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Expense from '@/models/Expense';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get('category')) filter.category = searchParams.get('category');
  if (searchParams.get('project')) filter.project = searchParams.get('project');
  if (searchParams.get('startDate') || searchParams.get('endDate')) {
    filter.date = {};
    if (searchParams.get('startDate')) filter.date.$gte = new Date(searchParams.get('startDate'));
    if (searchParams.get('endDate')) filter.date.$lte = new Date(searchParams.get('endDate'));
  }
  const expenses = await Expense.find(filter).populate('project', 'name location').populate('createdBy', 'name').sort('-date');
  return Response.json(expenses);
}

export async function POST(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const expense = await Expense.create({ ...await req.json(), createdBy: user._id });
    return Response.json(expense, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
