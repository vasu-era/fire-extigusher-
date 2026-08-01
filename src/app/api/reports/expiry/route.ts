import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);

  const todayStr = today.toISOString().split('T')[0];
  const futureStr = thirtyDaysLater.toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .gte('expiry_date', todayStr)
    .lte('expiry_date', futureStr)
    .order('expiry_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customers: data || [] });
}
