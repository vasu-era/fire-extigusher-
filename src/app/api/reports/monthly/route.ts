import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || 'all';
  const eventType = searchParams.get('event') || 'all';
  const search = searchParams.get('search') || '';

  let query = supabaseAdmin
    .from('customers')
    .select('*, extinguisher_details(*)');

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

  const allRecords = data || [];
  let filtered = allRecords.map((c: any) => ({
    ...c,
    service_type: allRecords.some((x: any) => x.mobile === c.mobile && x.id < c.id) ? 'renew' : 'new',
    lifecycle_status: c.is_active === false ? 'renewed' : 'current',
  }));

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
    filtered = filtered.filter(c => c.service_type === 'new');
  } else if (type === 'renew') {
    filtered = filtered.filter(c => c.service_type === 'renew');
  }

  if (status === 'active') {
    filtered = filtered.filter(c => c.is_active !== false && new Date(c.expiry_date) >= today);
  } else if (status === 'due') {
    filtered = filtered.filter(c => {
      if (c.is_active === false) return false;
      const exp = new Date(c.expiry_date);
      const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    });
  } else if (status === 'expired') {
    filtered = filtered.filter(c => c.is_active !== false && new Date(c.expiry_date) < today);
  }

  const totalRevenue = filtered.reduce((sum: number, c: any) => {
    const exts = c.extinguisher_details || [];
    return sum + exts.reduce((s: number, e: any) => s + parseFloat(e.ext_refilling_price || 0) + parseFloat(e.ext_new_price || 0), 0);
  }, 0);

  const stats = {
    total: filtered.length,
    newCustomers: filtered.filter(c => c.service_type === 'new').length,
    renewed: filtered.filter(c => c.service_type === 'renew').length,
    active: filtered.filter(c => c.is_active !== false && new Date(c.expiry_date) >= today).length,
    due: filtered.filter(c => {
      if (c.is_active === false) return false;
      const exp = new Date(c.expiry_date);
      const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    }).length,
    expired: filtered.filter(c => c.is_active !== false && new Date(c.expiry_date) < today).length,
    totalRevenue: Math.round(totalRevenue),
  };

  return NextResponse.json({ customers: filtered, stats });
}
