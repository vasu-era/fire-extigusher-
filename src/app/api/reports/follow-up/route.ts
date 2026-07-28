import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const todayStr = today.toISOString().split('T')[0];
  const futureStr = thirtyDaysLater.toISOString().split('T')[0];

  const { data: active, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('expiry_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customers = (active || []).map((c: any) => {
    const expiry = new Date(c.expiry_date);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...c, days_left: daysLeft };
  });

  const filtered = customers.filter((c: any) => c.days_left <= 30);

  const expiredCount = filtered.filter((c: any) => c.days_left < 0).length;
  const dueCount = filtered.filter((c: any) => c.days_left >= 0 && c.days_left <= 30).length;
  const todayCount = filtered.filter((c: any) => c.days_left === 0).length;

  return NextResponse.json({
    customers: filtered,
    total: filtered.length,
    expiredCount,
    dueCount,
    todayCount,
  });
}
