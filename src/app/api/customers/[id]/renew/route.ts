import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getNextCertificateNumber } from '@/lib/certificate';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data: oldCustomer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (customerError || !oldCustomer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const { data: oldExtinguishers, error: extError } = await supabaseAdmin
    .from('extinguisher_details')
    .select('*')
    .eq('customer_id', id);

  if (extError) {
    return NextResponse.json({ error: extError.message }, { status: 500 });
  }

  // Use shared utility to get next certificate number for today's date
  const newCertificateNo = await getNextCertificateNumber(new Date().toISOString().split('T')[0]);

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

  let finalAddress = (body.address || '').trim();
  const gst = (body.gst_number || '').trim().toUpperCase();
  if (gst && !finalAddress.toUpperCase().includes(gst)) {
    finalAddress = finalAddress ? `${finalAddress}\nGSTIN: ${gst}` : `GSTIN: ${gst}`;
  }

  const { data: newCustomer, error: customerError } = await supabaseAdmin
    .from('customers')
    .insert({
      certificate_no: body.certificate_no,
      customer_name: body.customer_name,
      mobile: body.mobile,
      address: finalAddress,
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
      customer_id: parseInt(id),
      action_type: 'renew',
      old_values: { certificate_no: body.old_certificate_no },
      new_values: { certificate_no: body.certificate_no, new_customer_id: newCustomer.id },
    });

  await supabaseAdmin
    .from('customers')
    .update({ is_active: false })
    .eq('id', parseInt(id));

  return NextResponse.json({ customer: newCustomer });
}
