import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const { data: extinguishers, error: extError } = await supabaseAdmin
    .from('extinguisher_details')
    .select('*')
    .eq('customer_id', id);

  if (extError) {
    return NextResponse.json({ error: extError.message }, { status: 500 });
  }

  return NextResponse.json({ customer, extinguishers: extinguishers || [] });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();

  const { error: updateError } = await supabaseAdmin
    .from('customers')
    .update({
      customer_name: body.customer_name,
      mobile: body.mobile,
      address: body.address,
      service_date: body.service_date,
      expiry_date: body.expiry_date,
      total_qty: body.total_qty,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabaseAdmin
    .from('extinguisher_details')
    .delete()
    .eq('customer_id', id);

  if (body.extinguishers && body.extinguishers.length > 0) {
    const extData = body.extinguishers.map((ext: any) => ({
      customer_id: parseInt(id),
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
      action_type: 'update',
      new_values: { customer_name: body.customer_name, total_qty: body.total_qty },
    });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { error } = await supabaseAdmin
    .from('customers')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin
    .from('customer_history')
    .insert({
      customer_id: parseInt(id),
      action_type: 'delete',
    });

  return NextResponse.json({ success: true });
}
