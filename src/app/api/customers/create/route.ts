import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.customer_name || !body.customer_name.trim()) {
    return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
  }
  if (!body.mobile || body.mobile.length < 10) {
    return NextResponse.json({ error: 'Valid 10-digit mobile number is required' }, { status: 400 });
  }
  if (!body.certificate_no) {
    return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 });
  }
  if (!body.service_date || !body.expiry_date) {
    return NextResponse.json({ error: 'Service date and expiry date are required' }, { status: 400 });
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .insert({
      certificate_no: body.certificate_no,
      customer_name: body.customer_name,
      mobile: body.mobile,
      address: body.address,
      service_date: body.service_date,
      expiry_date: body.expiry_date,
      total_qty: body.total_qty,
    })
    .select()
    .single();

  if (customerError) {
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  if (body.extinguishers && body.extinguishers.length > 0) {
    const extData = body.extinguishers.map((ext: any) => ({
      customer_id: customer.id,
      ext_type: ext.ext_type,
      ext_capacity: ext.ext_capacity,
      ext_qty: ext.ext_qty,
      ext_refilling_price: ext.ext_refilling_price,
      ext_new_price: ext.ext_new_price,
      service_action_type: ext.service_action_type,
    }));

    const { error: extError } = await supabaseAdmin
      .from('extinguisher_details')
      .insert(extData);

    if (extError) {
      return NextResponse.json({ error: extError.message }, { status: 500 });
    }
  }

  await supabaseAdmin
    .from('customer_history')
    .insert({
      customer_id: customer.id,
      action_type: 'create',
      new_values: { certificate_no: customer.certificate_no, customer_name: customer.customer_name },
    });

  return NextResponse.json({ customer, extinguishers: body.extinguishers || [] });
}
