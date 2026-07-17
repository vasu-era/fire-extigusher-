import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFYDates } from '@/lib/financial-year';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fy = searchParams.get('fy') || 'all';
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  const { start_date, end_date } = getFYDates(fy);

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .gte('service_date', start_date)
    .lte('service_date', end_date)
    .or(`service_date.gte.${year}-${String(month).padStart(2, '0')}-01,service_date.lte.${year}-${String(month).padStart(2, '0')}-31`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customers: data || [] });
}
