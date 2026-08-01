import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateFYOptions } from '@/lib/financial-year';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('service_date')
    .not('service_date', 'is', null)
    .order('service_date', { ascending: true })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const oldestYear = data && data.length > 0
    ? new Date(data[0].service_date).getFullYear()
    : new Date().getFullYear();

  const options = generateFYOptions(oldestYear);

  return NextResponse.json({ options });
}
