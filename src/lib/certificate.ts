import { supabaseAdmin } from '@/lib/supabase';
import { getFYFromDate } from '@/lib/financial-year';

export async function getNextCertificateNumber(service_date?: string): Promise<string> {
  const date = service_date ? new Date(service_date) : new Date();
  const { fy_short, fy_start, fy_end } = getFYFromDate(date);
  const prefix = `RGS/${fy_short}/`;

  const { data } = await supabaseAdmin
    .from('customers')
    .select('certificate_no')
    .gte('service_date', fy_start)
    .lte('service_date', fy_end)
    .ilike('certificate_no', `${prefix}%`)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  let next_number = 1;
  if (data) {
    const parts = data.certificate_no.split('/');
    const last_num = parseInt(parts[parts.length - 1]);
    if (!isNaN(last_num)) {
      next_number = last_num + 1;
    }
  }

  return `${prefix}${next_number}`;
}
