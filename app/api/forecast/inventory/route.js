import { connectDB } from '@/lib/db';
import { verifyAuth, unauthorized } from '@/lib/auth';
import Material from '@/models/Material';
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
    const materials = await Material.find().lean();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const summary = materials.map(m => {
      const recentLogs = (m.stockLog || []).filter(l => new Date(l.date) >= thirtyDaysAgo);
      const consumed = recentLogs.filter(l => l.type === 'out').reduce((s, l) => s + l.quantity, 0);
      const received = recentLogs.filter(l => l.type === 'in').reduce((s, l) => s + l.quantity, 0);
      const dailyRate = consumed / 30;
      const daysRemaining = dailyRate > 0 ? Math.floor(m.currentStock / dailyRate) : null;
      return { name: m.name, category: m.category, unit: m.unit, currentStock: m.currentStock, minStock: m.minStock, unitPrice: m.unitPrice, consumed_last_30_days: consumed, received_last_30_days: received, estimated_days_remaining: daysRemaining, is_low_stock: m.currentStock <= m.minStock };
    });

    const prompt = `You are an AI assistant for Samarth Developers, a construction company in Nashik, India. Analyze the following inventory data and provide forecasting insights. Inventory Data: ${JSON.stringify(summary, null, 2)} Respond ONLY with a valid JSON object (no markdown, no explanation) in this exact structure: {"summary":"2-3 sentence overall assessment","critical_items":[{"name":"material name","issue":"specific issue","action":"recommended action","urgency":"immediate|within_week|within_month","estimated_days_remaining":null}],"reorder_recommendations":[{"name":"material name","current_stock":0,"recommended_order_qty":0,"unit":"unit","estimated_cost":0,"reason":"brief reason"}],"30_day_forecast":[{"name":"material name","predicted_consumption":0,"predicted_stock_end":0,"will_deplete":false,"depletion_date":null}],"overall_health":"good|warning|critical","cost_to_restock_critical":0}`;

    const forecast = await askGemini(prompt);
    return Response.json({ success: true, generatedAt: new Date(), data: forecast });
  } catch (e) {
    return Response.json({ message: 'Forecast generation failed', error: e.message }, { status: 500 });
  }
}
