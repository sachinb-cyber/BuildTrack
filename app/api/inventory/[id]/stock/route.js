import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Material from '@/models/Material';
import Project from '@/models/Project';
import Supplier from '@/models/Supplier';

export async function POST(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'engineer', 'accountant')) return forbidden();
  await connectDB();
  try {
    const material = await Material.findById(params.id);
    if (!material) return Response.json({ message: 'Material not found' }, { status: 404 });
    const { type, quantity, project, supplier, unitPrice, phase, notes } = await req.json();
    if (type === 'out' && material.currentStock < quantity)
      return Response.json({ message: 'Insufficient stock' }, { status: 400 });
    const totalCost = (unitPrice || material.unitPrice) * quantity;

    // Resolve names for denormalized display
    let projectName = '';
    let supplierName = '';
    if (project) {
      const p = await Project.findById(project).select('name');
      if (p) projectName = p.name;
    }
    if (supplier) {
      const s = await Supplier.findById(supplier).select('name');
      if (s) supplierName = s.name;
    }

    material.stockLog.push({
      type, quantity, project, supplier, projectName, supplierName,
      unitPrice: unitPrice || material.unitPrice, totalCost,
      phase: phase || '', notes, addedBy: user._id
    });
    material.currentStock = type === 'in' ? material.currentStock + quantity : material.currentStock - quantity;
    if (unitPrice && type === 'in') material.unitPrice = unitPrice;
    await material.save();
    return Response.json(material, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
