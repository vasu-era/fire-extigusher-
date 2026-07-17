import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const { data: extinguishers, error: extError } = await supabase
    .from('extinguisher_details')
    .select('*')
    .eq('customer_id', id);

  if (extError) {
    return NextResponse.json({ error: extError.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const certificateUrl = `${baseUrl}/customers/${id}/certificate`;

  const qrCodeDataUrl = await QRCode.toDataURL(certificateUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 200,
  });

  return NextResponse.json({
    customer,
    extinguishers: extinguishers || [],
    qrCodeUrl: qrCodeDataUrl,
  });
}
