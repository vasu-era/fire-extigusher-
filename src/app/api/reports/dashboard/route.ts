import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getFYDates } from '@/lib/financial-year';

function parseDate(val: string): Date | null {
  if (!val) return null;
  if (val.includes('-')) {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (val.includes('/')) {
    const parts = val.split('/');
    if (parts.length === 3) {
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

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
    const expiry = parseDate(c.expiry_date);
    if (!expiry) return false;
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length;

  const expired = customers.filter((c) => {
    const expiry = parseDate(c.expiry_date);
    if (!expiry) return false;
    return expiry < today;
  }).length;

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthlyCount = customers.filter((c) => {
    const serviceDate = parseDate(c.service_date);
    if (!serviceDate) return false;
    return serviceDate.getMonth() === currentMonth && serviceDate.getFullYear() === currentYear;
  }).length;

  let notifQuery = supabaseAdmin
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('expiry_date', { ascending: true });

  const { data: notifData, error: notifError } = await notifQuery;
  if (notifError) {
    console.error('Notification query error:', notifError);
  }
  const allNotifCustomers = notifData || [];
  console.log('FY:', fy, 'start:', start_date, 'end:', end_date, 'month:', currentMonth, 'year:', currentYear, 'notifCount:', allNotifCustomers.length);
  const notifications = allNotifCustomers
    .filter((c) => {
      const exp = parseDate(c.expiry_date);
      if (!exp) return false;
      return exp.getMonth() === currentMonth && exp.getFullYear() === currentYear;
    })
    .slice(0, 20)
    .map((c) => ({
      id: c.id,
      customer_name: c.customer_name,
      certificate_no: c.certificate_no,
      expiry_date: c.expiry_date,
      days_left: Math.ceil((parseDate(c.expiry_date)!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
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
