import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getNextCertificateNumber } from '@/lib/certificate';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data: oldCustomer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (customerError || !oldCustomer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const { data: oldExtinguishers, error: extError } = await supabase
    .from('extinguisher_details')
    .select('*')
    .eq('customer_id', id);

  if (extError) {
    return NextResponse.json({ error: extError.message }, { status: 500 });
  }

  const newCertificateNo = await getNextCertificateNumber();

  return NextResponse.json({
    oldCustomer,
    oldExtinguishers: oldExtinguishers || [],
    newCertificateNo,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();

  const { data: newCustomer, error: customerError } = await supabase
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
      customer_id: newCustomer.id,
      ext_type: ext.ext_type,
      ext_capacity: ext.ext_capacity,
      ext_qty: ext.ext_qty,
      ext_refilling_price: ext.ext_refilling_price,
      ext_new_price: ext.ext_new_price,
      service_action_type: ext.service_action_type,
    }));

    const { error: extError } = await supabase
      .from('extinguisher_details')
      .insert(extData);

    if (extError) {
      return NextResponse.json({ error: extError.message }, { status: 500 });
    }
  }

  await supabase
    .from('customer_history')
    .insert({
      customer_id: parseInt(id),
      action_type: 'renew',
      old_values: { certificate_no: body.old_certificate_no },
      new_values: { certificate_no: body.certificate_no, new_customer_id: newCustomer.id },
    });

  return NextResponse.json({ customer: newCustomer });
}
