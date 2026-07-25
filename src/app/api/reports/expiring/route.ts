import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');

  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + days);

  const todayStr = today.toISOString().split('T')[0];
  const futureStr = future.toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, customer_name, mobile, certificate_no, service_date, expiry_date')
    .eq('is_active', true)
    .gte('expiry_date', todayStr)
    .lte('expiry_date', futureStr)
    .not('mobile', 'is', null)
    .neq('mobile', '')
    .order('expiry_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customersWithDays = (data || []).map((c: any) => {
    const expiry = new Date(c.expiry_date);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...c, days_left: daysLeft };
  });

  return NextResponse.json({ customers: customersWithDays, total: customersWithDays.length });
}
