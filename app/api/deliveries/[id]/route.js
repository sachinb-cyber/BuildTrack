import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Delivery from '@/models/Delivery';
import Material from '@/models/Material';
import Project from '@/models/Project';
import Supplier from '@/models/Supplier';
import Invoice from '@/models/Invoice';
import { sendPush } from '@/lib/push';

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'engineer', 'accountant')) return forbidden();
  await connectDB();
  try {
    const body = await req.json();
    const delivery = await Delivery.findById(params.id)
      .populate('supplier', 'name')
      .populate('project', 'name');
    if (!delivery) return Response.json({ message: 'Delivery not found' }, { status: 404 });

    // Auto-update inventory when marking as delivered
    if (body.status === 'delivered' && delivery.status !== 'delivered') {
      for (const item of delivery.items) {
        if (item.material) {
          const material = await Material.findById(item.material);
          if (material) {
            const totalCost = (item.unitPrice || material.unitPrice) * item.quantity;
            material.stockLog.push({
              type: 'in',
              quantity: item.quantity,
              project: delivery.project?._id || delivery.project,
              projectName: delivery.project?.name || '',
              supplier: delivery.supplier?._id || delivery.supplier,
              supplierName: delivery.supplier?.name || '',
              phase: delivery.phase || '',
              unitPrice: item.unitPrice || material.unitPrice,
              totalCost,
              notes: `Auto-logged from delivery`,
              addedBy: user._id,
            });
            material.currentStock += item.quantity;
            if (item.unitPrice) material.unitPrice = item.unitPrice;
            await material.save();
          }
        }
      }
    }

    // Auto-create draft invoice when delivery is confirmed
    if (body.status === 'delivered' && delivery.status !== 'delivered') {
      try {
        const invoiceItems = delivery.items.map(item => ({
          description: item.materialName,
          quantity: item.quantity,
          unit: item.unit || '',
          unitPrice: item.unitPrice || 0,
          totalPrice: (item.unitPrice || 0) * item.quantity,
        }));
        const subtotal = invoiceItems.reduce((s, i) => s + i.totalPrice, 0);
        const invoiceNumber = `DEL-${Date.now()}`;
        await Invoice.create({
          invoiceNumber,
          type: 'generated',
          supplier: delivery.supplier?._id || delivery.supplier || null,
          project: delivery.project?._id || delivery.project || null,
          items: invoiceItems,
          subtotal,
          tax: 0,
          totalAmount: subtotal,
          status: 'draft',
          notes: `Auto-generated from delivery on ${new Date().toLocaleDateString('en-IN')}`,
          reconciled: true,
          deliveryRef: delivery._id,
          createdBy: user._id,
        });
      } catch (invoiceErr) {
        console.error('Auto-invoice creation failed:', invoiceErr.message);
        // Non-fatal — delivery still saves
      }
    }

    if (body.items) body.items = body.items.map(i => ({ ...i, material: i.material || null }));
    Object.assign(delivery, body);
    await delivery.save();

    // Push notification to admins when delivery confirmed
    if (body.status === 'delivered') {
      sendPush(null, {
        title: 'Delivery Confirmed',
        body: `${delivery.supplier?.name || 'Supplier'} → ${delivery.project?.name || 'Project'} has been confirmed`,
        url: '/deliveries',
      }).catch(console.error);
    }

    return Response.json(delivery);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  await connectDB();
  await Delivery.findByIdAndDelete(params.id);
  return Response.json({ message: 'Delivery deleted' });
}
