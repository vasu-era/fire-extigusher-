import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data: current, error: custError } = await supabaseAdmin
    .from('customers')
    .select('*, extinguisher_details(*)')
    .eq('id', id)
    .single();

  if (custError || !current) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const { data: allServices, error: servicesError } = await supabaseAdmin
    .from('customers')
    .select('*, extinguisher_details(*)')
    .eq('mobile', current.mobile)
    .eq('is_active', true)
    .order('service_date', { ascending: true });

  if (servicesError) {
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  let totalRevenue = 0;
  const enrichedServices = (allServices || []).map((c: any) => {
    const exts = c.extinguisher_details || [];
    const serviceRevenue = exts.reduce((sum: number, ext: any) => {
      return sum + parseFloat(ext.ext_refilling_price || 0) + parseFloat(ext.ext_new_price || 0);
    }, 0);
    totalRevenue += serviceRevenue;
    return { ...c, service_revenue: Math.round(serviceRevenue), ext_count: exts.length };
  });

  return NextResponse.json({
    current,
    all_services: enrichedServices,
    total_revenue: Math.round(totalRevenue),
    total_services: enrichedServices.length,
    first_service_date: enrichedServices[0]?.service_date || null,
  });
}
