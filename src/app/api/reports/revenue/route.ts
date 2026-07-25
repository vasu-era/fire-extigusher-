import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getFYDates } from '@/lib/financial-year';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fy = searchParams.get('fy') || 'all';
  const { start_date, end_date } = getFYDates(fy);

  const { data: customers, error: custError } = await supabaseAdmin
    .from('customers')
    .select('*, extinguisher_details(*)')
    .eq('is_active', true)
    .gte('service_date', start_date)
    .lte('service_date', end_date);

  if (custError) {
    return NextResponse.json({ error: custError.message }, { status: 500 });
  }

  const { data: payments, error: payError } = await supabaseAdmin
    .from('payments')
    .select('*');

  let totalRevenue = 0;
  let refillingRevenue = 0;
  let newSalesRevenue = 0;
  const monthlyData: Record<string, number> = {};
  const typeData: Record<string, number> = { ABC: 0, CO2: 0, Water: 0, Foam: 0 };

  (customers || []).forEach((c: any) => {
    const exts = c.extinguisher_details || [];
    exts.forEach((ext: any) => {
      const price = parseFloat(ext.ext_refilling_price || 0) + parseFloat(ext.ext_new_price || 0);
      totalRevenue += price;
      if (ext.service_action_type === 'refilling') refillingRevenue += price;
      else newSalesRevenue += price;

      const month = c.service_date.substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + price;

      if (typeData.hasOwnProperty(ext.ext_type)) {
        typeData[ext.ext_type] += price;
      }
    });
  });

  const monthlyTrend = Object.keys(monthlyData).sort().map(month => ({
    month,
    label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: Math.round(monthlyData[month]),
  }));

  const totalTypeRevenue = Object.values(typeData).reduce((a, b) => a + b, 0) || 1;
  const typeBreakdown = Object.entries(typeData).map(([type, revenue]) => ({
    type,
    revenue: Math.round(revenue),
    percentage: Math.round((revenue / totalTypeRevenue) * 100),
  })).filter(t => t.revenue > 0);

  const pendingPayments = totalRevenue - refillingRevenue - newSalesRevenue;
  let actualReceived = 0;
  let actualPending = 0;
  (payments || []).forEach((p: any) => {
    const amt = parseFloat(p.amount || 0);
    if (p.payment_status === 'received') actualReceived += amt;
    else actualPending += amt;
  });

  return NextResponse.json({
    totalRevenue: Math.round(totalRevenue),
    refillingRevenue: Math.round(refillingRevenue),
    newSalesRevenue: Math.round(newSalesRevenue),
    pendingPayments: Math.round(actualPending || 0),
    actualReceived: Math.round(actualReceived),
    totalCustomers: (customers || []).length,
    monthlyTrend,
    typeBreakdown,
  });
}
