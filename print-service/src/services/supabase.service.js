const { env } = require('../config/env');
const { PrintError } = require('../errors/PrintError');

function assertSupabaseConfig() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new PrintError('Supabase configuration missing', 500, 'SUPABASE_CONFIG_MISSING');
  }
}

async function supabaseGet(path) {
  assertSupabaseConfig();

  const baseUrl = env.supabaseUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      Accept: 'application/json'
    }
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new PrintError(
      data?.message || 'Supabase request failed',
      502,
      'SUPABASE_REQUEST_FAILED'
    );
  }

  return data;
}

async function getCertificateWithExtinguishers(certificateId) {
  const customers = await supabaseGet(`customers?id=eq.${certificateId}&select=*`);
  const customer = Array.isArray(customers) ? customers[0] : null;

  if (!customer) {
    throw new PrintError('Certificate not found', 404, 'CERTIFICATE_NOT_FOUND');
  }

  const extinguishers = await supabaseGet(
    `extinguisher_details?customer_id=eq.${certificateId}&select=*&order=id.asc`
  );

  return {
    customer,
    extinguishers: Array.isArray(extinguishers) ? extinguishers : []
  };
}

module.exports = { getCertificateWithExtinguishers };
