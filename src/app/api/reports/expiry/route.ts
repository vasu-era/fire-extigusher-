import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .gte('expiry_date', today.toISOString().split('T')[0])
    .lte('expiry_date', thirtyDaysLater.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customers: data || [] });
}
