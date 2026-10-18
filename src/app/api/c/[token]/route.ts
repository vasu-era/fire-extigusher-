import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  // Validate token format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  // Lookup by share_token — NOT by id
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('share_token', token)
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  const { data: extinguishers, error: extError } = await supabaseAdmin
    .from('extinguisher_details')
    .select('*')
    .eq('customer_id', customer.id);

  if (extError) {
    return NextResponse.json({ error: extError.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fire-app-indol.vercel.app';
  const certificateUrl = `${baseUrl}/c/${token}`;

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
