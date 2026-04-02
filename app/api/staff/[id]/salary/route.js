import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Staff from '@/models/Staff';

export async function POST(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const staff = await Staff.findById(params.id);
    if (!staff) return Response.json({ message: 'Staff not found' }, { status: 404 });
    const { month, year, allowances, deductions, bonus, notes, baseSalary } = await req.json();
    const existing = staff.salaryHistory.find(s => s.month === month && s.year === year);
    if (existing) return Response.json({ message: 'Salary already added for this month' }, { status: 400 });
    const base = baseSalary || staff.baseSalary;
    const netSalary = base + (allowances || 0) + (bonus || 0) - (deductions || 0);
    staff.salaryHistory.push({ month, year, baseSalary: base, allowances, deductions, bonus, netSalary, notes });
    await staff.save();
    return Response.json(staff, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
