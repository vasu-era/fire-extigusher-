import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getFYDates } from '@/lib/financial-year';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fy = searchParams.get('fy') || 'all';

  const { start_date, end_date } = getFYDates(fy);

  let query = supabaseAdmin
    .from('customers')
    .select('*')
    .eq('is_active', true);

  if (fy === 'others') {
    query = query.or('service_date.is.null,service_date.eq.0000-00-00');
  } else if (fy !== 'all') {
    query = query
      .gte('service_date', start_date)
      .lte('service_date', end_date);
  }

  const { data, error } = await query;

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

  let notifQuery = supabaseAdmin
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .not('mobile', 'is', null)
    .order('expiry_date', { ascending: true });

  if (fy === 'others') {
    notifQuery = notifQuery.or('expiry_date.is.null,expiry_date.eq.0000-00-00');
  } else if (fy !== 'all') {
    notifQuery = notifQuery
      .gte('expiry_date', start_date)
      .lte('expiry_date', end_date);
  }

  const { data: notifData } = await notifQuery;
  const allNotifCustomers = notifData || [];
  const notifications = allNotifCustomers
    .filter((c) => {
      const exp = new Date(c.expiry_date);
      return exp.getMonth() === currentMonth && exp.getFullYear() === currentYear;
    })
    .slice(0, 20)
    .map((c) => ({
      id: c.id,
      customer_name: c.customer_name,
      certificate_no: c.certificate_no,
      expiry_date: c.expiry_date,
      days_left: Math.ceil((new Date(c.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      mobile: c.mobile,
    }));

  return NextResponse.json({
    total,
    expiryDue,
    expired,
    monthlyCount,
    notifications,
  });
}
