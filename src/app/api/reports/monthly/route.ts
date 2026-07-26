import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getFYDates } from '@/lib/financial-year';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fy = searchParams.get('fy') || 'all';
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || 'all';
  const eventType = searchParams.get('event') || 'all';
  const search = searchParams.get('search') || '';

  const { start_date, end_date } = getFYDates(fy);

  let query = supabaseAdmin
    .from('customers')
    .select('*, extinguisher_details(*)')
    .eq('is_active', true);

  if (fy !== 'all') {
    query = query
      .gte('service_date', start_date)
      .lte('service_date', end_date);
  }

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,mobile.ilike.%${search}%,certificate_no.ilike.%${search}%`
    );
  }

  const { data, error } = await query.order('service_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split('T')[0];
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  const thirtyDaysStr = thirtyDaysLater.toISOString().split('T')[0];

  let filtered = data || [];

  if (month && year) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const monthStart = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const monthEnd = `${yearNum}-${String(monthNum).padStart(2, '0')}-31`;

    if (eventType === 'service') {
      filtered = filtered.filter(c => c.service_date >= monthStart && c.service_date <= monthEnd);
    } else if (eventType === 'expiry') {
      filtered = filtered.filter(c => c.expiry_date >= monthStart && c.expiry_date <= monthEnd);
    } else {
      filtered = filtered.filter(c =>
        (c.service_date >= monthStart && c.service_date <= monthEnd) ||
        (c.expiry_date >= monthStart && c.expiry_date <= monthEnd)
      );
    }
  }

  if (type === 'new') {
    filtered = filtered.filter(c => !filtered.some(x => x.mobile === c.mobile && x.id < c.id));
  } else if (type === 'renew') {
    filtered = filtered.filter(c => filtered.some(x => x.mobile === c.mobile && x.id < c.id));
  }

  if (status === 'active') {
    filtered = filtered.filter(c => new Date(c.expiry_date) >= today);
  } else if (status === 'due') {
    filtered = filtered.filter(c => {
      const exp = new Date(c.expiry_date);
      const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    });
  } else if (status === 'expired') {
    filtered = filtered.filter(c => new Date(c.expiry_date) < today);
  }

  const totalRevenue = filtered.reduce((sum: number, c: any) => {
    const exts = c.extinguisher_details || [];
    return sum + exts.reduce((s: number, e: any) => s + parseFloat(e.ext_refilling_price || 0) + parseFloat(e.ext_new_price || 0), 0);
  }, 0);

  const stats = {
    total: filtered.length,
    newCustomers: filtered.filter(c => !filtered.some(x => x.mobile === c.mobile && x.id < c.id)).length,
    renewed: filtered.filter(c => filtered.some(x => x.mobile === c.mobile && x.id < c.id)).length,
    active: filtered.filter(c => new Date(c.expiry_date) >= today).length,
    due: filtered.filter(c => {
      const exp = new Date(c.expiry_date);
      const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    }).length,
    expired: filtered.filter(c => new Date(c.expiry_date) < today).length,
    totalRevenue: Math.round(totalRevenue),
  };

  return NextResponse.json({ customers: filtered, stats });
}
