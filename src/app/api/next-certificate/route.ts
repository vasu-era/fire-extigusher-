import { NextRequest, NextResponse } from 'next/server';
import { getNextCertificateNumber } from '@/lib/certificate';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const service_date = searchParams.get('service_date');

  const certificate_no = await getNextCertificateNumber(service_date || undefined);

  return NextResponse.json({ certificate_no });
}
