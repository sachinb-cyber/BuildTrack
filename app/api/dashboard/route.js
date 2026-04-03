import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized } from '@/lib/auth';
import Worker from '@/models/Worker';
import Staff from '@/models/Staff';
import Material from '@/models/Material';
import Invoice from '@/models/Invoice';
import Expense from '@/models/Expense';
import Project from '@/models/Project';
import Delivery from '@/models/Delivery';

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  try {
    const workers = await Worker.find({ isActive: true });
    let pendingWorkerPayments = 0, totalWorkerPayments = 0;
    workers.forEach(w => w.payments.forEach(p => {
      totalWorkerPayments += p.totalAmount;
      if (p.status !== 'paid') pendingWorkerPayments += (p.totalAmount - p.paidAmount);
    }));

    const staffMembers = await Staff.find({ isActive: true });
    let pendingStaffSalary = 0, totalStaffSalary = 0;
    staffMembers.forEach(s => s.salaryHistory.forEach(sal => {
      totalStaffSalary += sal.netSalary;
      if (sal.status !== 'paid') pendingStaffSalary += (sal.netSalary - sal.paidAmount);
    }));

    const materials = await Material.find();
    const lowStockItems = materials.filter(m => m.currentStock <= m.minStock);

    const invoices = await Invoice.find();
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
    const totalInvoiceAmount = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const pendingInvoiceAmount = pendingInvoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const expenseByCategory = {};
    expenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyExpenses = await Expense.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const projects = await Project.find();
    const activeProjects = projects.filter(p => p.status === 'active');
    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const totalSpent = projects.reduce((s, p) => s + p.spent, 0);

    // Cost overrun alerts
    const overrunProjects = projects
      .filter(p => p.budget > 0)
      .map(p => ({
        _id: p._id,
        name: p.name,
        budget: p.budget,
        spent: p.spent,
        pct: Math.round((p.spent / p.budget) * 100),
        status: p.status,
      }))
      .filter(p => p.pct >= 80)
      .sort((a, b) => b.pct - a.pct);

    const recentExpenses = await Expense.find().populate('project', 'name').sort('-date').limit(10);

    // Pending deliveries count
    const pendingDeliveries = await Delivery.countDocuments({ status: 'pending' });

    return Response.json({
      workers: { total: workers.length, totalPayments: totalWorkerPayments, pendingPayments: pendingWorkerPayments },
      staff: { total: staffMembers.length, totalSalary: totalStaffSalary, pendingSalary: pendingStaffSalary },
      inventory: { totalMaterials: materials.length, lowStockCount: lowStockItems.length, lowStockItems: lowStockItems.map(m => ({ _id: m._id, name: m.name, currentStock: m.currentStock, minStock: m.minStock, unit: m.unit })) },
      invoices: { total: invoices.length, pendingCount: pendingInvoices.length, totalAmount: totalInvoiceAmount, pendingAmount: pendingInvoiceAmount },
      expenses: { total: totalExpenses, byCategory: expenseByCategory, monthly: monthlyExpenses },
      projects: { total: projects.length, active: activeProjects.length, totalBudget, totalSpent },
      overrunProjects,
      pendingDeliveries,
      pendingTotal: pendingWorkerPayments + pendingStaffSalary + pendingInvoiceAmount,
      recentExpenses
    });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
