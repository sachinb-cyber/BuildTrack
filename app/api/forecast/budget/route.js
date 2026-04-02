import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized } from '@/lib/auth';
import Project from '@/models/Project';
import Expense from '@/models/Expense';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function askGemini(prompt) {
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
  return JSON.parse(text.trim());
}

export async function GET(req) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();
  await connectDB();
  try {
    const [projects, expenses] = await Promise.all([
      Project.find({ status: { $in: ['active', 'planning'] } }).lean(),
      Expense.find({ date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }).populate('project', 'name budget').lean(),
    ]);

    const monthlyMap = {};
    expenses.forEach(e => {
      const key = `${new Date(e.date).getFullYear()}-${String(new Date(e.date).getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, byCategory: {} };
      monthlyMap[key].total += e.amount;
      monthlyMap[key].byCategory[e.category] = (monthlyMap[key].byCategory[e.category] || 0) + e.amount;
    });

    const projectData = projects.map(p => {
      const projExpenses = expenses.filter(e => e.project?._id?.toString() === p._id.toString());
      const spent = projExpenses.reduce((s, e) => s + e.amount, 0);
      const budgetUsedPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
      const expectedEndDate = p.expectedEndDate ? new Date(p.expectedEndDate) : null;
      const daysLeft = expectedEndDate ? Math.max(0, Math.ceil((expectedEndDate - Date.now()) / (1000 * 60 * 60 * 24))) : null;
      return { name: p.name, status: p.status, budget: p.budget, spent: p.spent, budget_used_percent: budgetUsedPct, remaining_budget: p.budget - p.spent, days_until_deadline: daysLeft, recent_90day_expenses: spent };
    });

    const prompt = `You are an AI financial analyst for Samarth Developers, a construction company in Nashik, India. Analyze the following budget and expense data. Project Budget Data: ${JSON.stringify(projectData, null, 2)} Monthly Expense Trends: ${JSON.stringify(monthlyMap, null, 2)} Respond ONLY with a valid JSON object in this structure: {"summary":"2-3 sentence assessment","overall_health":"good|warning|critical","monthly_burn_rate":0,"projected_next_month_spend":0,"project_forecasts":[{"name":"project name","current_burn_rate":0,"projected_completion_cost":0,"budget_overrun_risk":"low|medium|high","estimated_overrun_amount":0,"recommendation":"brief recommendation","alert":null}],"category_insights":[{"category":"expense category","trend":"increasing|stable|decreasing","avg_monthly_spend":0,"recommendation":"brief insight"}],"top_risks":[{"risk":"description","impact":"high|medium|low","mitigation":"suggested action"}],"savings_opportunities":[{"area":"area name","potential_saving":0,"how":"brief description"}]}`;

    const forecast = await askGemini(prompt);
    return Response.json({ success: true, generatedAt: new Date(), data: forecast });
  } catch (e) {
    return Response.json({ message: 'Forecast generation failed', error: e.message }, { status: 500 });
  }
}
