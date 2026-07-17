import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFYDates } from '@/lib/financial-year';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fy = searchParams.get('fy') || 'all';
  const search = searchParams.get('search') || '';

  const { start_date, end_date } = getFYDates(fy);

  let query = supabase
    .from('customers')
    .select('*')
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

  query = query.order('id', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customers: data || [], total: data?.length || 0, fy });
}
