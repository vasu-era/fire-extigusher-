import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

  const fy = new Date().getMonth() + 1 >= 4
    ? `${String(new Date().getFullYear()).slice(-2)}-${String(new Date().getFullYear() + 1).slice(-2)}`
    : `${String(new Date().getFullYear() - 1).slice(-2)}-${String(new Date().getFullYear()).slice(-2)}`;

  const prefix = `RGS/${fy}/`;
  const { data: lastCert } = await supabaseAdmin
    .from('customers')
    .select('certificate_no')
    .like('certificate_no', `${prefix}%`)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (lastCert) {
    const parts = lastCert.certificate_no.split('/');
    const lastN = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastN)) nextNum = lastN + 1;
  }

  return NextResponse.json({
    oldCustomer,
    oldExtinguishers: oldExtinguishers || [],
    newCertificateNo: `${prefix}${nextNum}`,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();

  const { data: newCustomer, error: customerError } = await supabaseAdmin
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
