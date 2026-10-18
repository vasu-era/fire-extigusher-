import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import QRCode from 'qrcode';
import { randomUUID } from 'crypto';

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

  // Auto-generate share_token if this customer doesn't have one yet
  let shareToken: string = customer.share_token;
  if (!shareToken) {
    shareToken = randomUUID();
    await supabaseAdmin
      .from('customers')
      .update({ share_token: shareToken })
      .eq('id', id);
  }

  const { data: extinguishers, error: extError } = await supabaseAdmin
    .from('extinguisher_details')
    .select('*')
    .eq('customer_id', id);

  if (extError) {
    return NextResponse.json({ error: extError.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fire-app-indol.vercel.app';
  // Use secure token-based URL for QR code (not the id-based URL)
  const certificateUrl = `${baseUrl}/c/${shareToken}`;

  const qrCodeDataUrl = await QRCode.toDataURL(certificateUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 200,
  });

  return NextResponse.json({
    customer,
    extinguishers: extinguishers || [],
    qrCodeUrl: qrCodeDataUrl,
    shareToken,
    shareUrl: certificateUrl,
  });
}
