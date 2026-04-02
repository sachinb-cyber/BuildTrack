import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Staff from '@/models/Staff';

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'accountant')) return forbidden();
  await connectDB();
  try {
    const staff = await Staff.findById(params.id);
    if (!staff) return Response.json({ message: 'Staff not found' }, { status: 404 });
    const salary = staff.salaryHistory.id(params.salaryId);
    if (!salary) return Response.json({ message: 'Salary record not found' }, { status: 404 });
    const { status, paidAmount, paidDate } = await req.json();
    if (status) salary.status = status;
    if (paidAmount !== undefined) salary.paidAmount = paidAmount;
    if (paidDate) salary.paidDate = paidDate;
    if (status === 'paid' && !paidAmount) { salary.paidAmount = salary.netSalary; salary.paidDate = new Date(); }
    await staff.save();
    return Response.json(staff);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
