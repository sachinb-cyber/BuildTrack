import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized, forbidden, authorize } from '@/lib/auth';
import Project from '@/models/Project';
import Expense from '@/models/Expense';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  const project = await Project.findById(params.id)
    .populate('manager', 'name email')
    .populate('workers', 'name skill dailyWage')
    .populate('staff', 'name role');
  if (!project) return Response.json({ message: 'Project not found' }, { status: 404 });
  const expenses = await Expense.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(params.id) } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const spent = expenses.length > 0 ? expenses[0].total : 0;
  return Response.json({ ...project.toJSON(), calculatedSpent: spent });
}

export async function PUT(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin', 'engineer')) return forbidden();
  await connectDB();
  try {
    const body = await req.json();

    // Handle phase add/update
    if (body._addPhase) {
      const project = await Project.findById(params.id);
      if (!project) return Response.json({ message: 'Project not found' }, { status: 404 });
      const { name, status, startDate, endDate, budget, description } = body._addPhase;
      const exists = project.phases.find(p => p.name === name);
      if (exists) return Response.json({ message: 'Phase already exists' }, { status: 400 });
      project.phases.push({ name, status, startDate, endDate, budget: budget || 0, description });
      await project.save();
      return Response.json(project);
    }

    if (body._updatePhase) {
      const { phaseId, ...updates } = body._updatePhase;
      const project = await Project.findById(params.id);
      if (!project) return Response.json({ message: 'Project not found' }, { status: 404 });
      const phase = project.phases.id(phaseId);
      if (!phase) return Response.json({ message: 'Phase not found' }, { status: 404 });
      Object.assign(phase, updates);
      await project.save();
      return Response.json(project);
    }

    const project = await Project.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!project) return Response.json({ message: 'Project not found' }, { status: 404 });
    return Response.json(project);
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  if (!authorize(user, 'admin')) return forbidden();
  await connectDB();
  await Project.findByIdAndDelete(params.id);
  return Response.json({ message: 'Project deleted' });
}
