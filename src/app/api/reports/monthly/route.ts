import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getFYDates } from '@/lib/financial-year';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fy = searchParams.get('fy') || 'all';
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  const { start_date, end_date } = getFYDates(fy);

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .gte('service_date', start_date)
    .lte('service_date', end_date)
    .or(`and(service_date.gte.${monthStart},service_date.lte.${monthEnd}),and(expiry_date.gte.${monthStart},expiry_date.lte.${monthEnd})`)
    .order('expiry_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customers: data || [] });
}
