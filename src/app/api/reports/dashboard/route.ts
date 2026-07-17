import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFYDates, getFYFromDate } from '@/lib/financial-year';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fy = searchParams.get('fy') || 'all';

  const { start_date, end_date } = getFYDates(fy);

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .gte('service_date', start_date)
    .lte('service_date', end_date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customers = data || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const total = customers.length;
  
  const expiryDue = customers.filter((c) => {
    const expiry = new Date(c.expiry_date);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length;

  const expired = customers.filter((c) => {
    const expiry = new Date(c.expiry_date);
    return expiry < today;
  }).length;

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthlyCount = customers.filter((c) => {
    const serviceDate = new Date(c.service_date);
    return serviceDate.getMonth() === currentMonth && serviceDate.getFullYear() === currentYear;
  }).length;

  return NextResponse.json({
    total,
    expiryDue,
    expired,
    monthlyCount,
  });
}
