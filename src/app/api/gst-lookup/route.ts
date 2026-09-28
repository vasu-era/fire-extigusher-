import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Standard 15-character GSTIN regex for India
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

interface GSTLookupResult {
  found: boolean;
  source: 'database' | 'gst_api' | 'none';
  customer_name?: string;
  trade_name?: string;
  legal_name?: string;
  mobile?: string;
  address?: string;
  state?: string;
  pincode?: string;
  status?: string;
  message?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawGst = (searchParams.get('gstin') || '').trim().toUpperCase();

  if (!rawGst) {
    return NextResponse.json({ error: 'GST number is required' }, { status: 400 });
  }

  if (rawGst.length !== 15) {
    return NextResponse.json(
      { error: 'GST number must be exactly 15 characters long' },
      { status: 400 }
    );
  }

  if (!GSTIN_REGEX.test(rawGst)) {
    return NextResponse.json(
      { error: 'Invalid GST number format (e.g. 24AAAAA0000A1Z5)' },
      { status: 400 }
    );
  }

  // 1. First, search in our local database (customers table)
  try {
    const { data: matchedCustomers, error: dbError } = await supabaseAdmin
      .from('customers')
      .select('id, customer_name, mobile, address, created_at')
      .ilike('address', `%${rawGst}%`)
      .order('id', { ascending: false })
      .limit(1);

    if (!dbError && matchedCustomers && matchedCustomers.length > 0) {
      const cust = matchedCustomers[0];
      // Clean up the address by removing the GST line so user gets the original address
      const cleanAddress = (cust.address || '')
        .replace(new RegExp(`\n?GSTIN:\\s*${rawGst}`, 'gi'), '')
        .replace(new RegExp(`\n?GST:\\s*${rawGst}`, 'gi'), '')
        .trim();

      return NextResponse.json({
        found: true,
        source: 'database',
        customer_name: cust.customer_name,
        mobile: cust.mobile,
        address: cleanAddress || cust.address,
        message: 'Customer details found in your existing records!',
      });
    }
  } catch (err) {
    console.error('Database search error:', err);
  }

  // 2. gstinapi.in — primary online GST API
  // Endpoint: GET https://gstinapi.in/v1/gstin/:gstin
  // Auth:     x-api-key header
  // Response: { success, data: { legal_name, trade_name, address, status, pincode, ... } }
  const gstinApiKey = process.env.GSTIN_API_KEY || '';
  if (gstinApiKey) {
    try {
      const res = await fetch(`https://gstinapi.in/v1/gstin/${rawGst}`, {
        headers: {
          'x-api-key': gstinApiKey,
          Accept: 'application/json',
        },
        next: { revalidate: 0 }, // always fresh
      });

      if (res.ok) {
        const json = await res.json();
        // gstinapi.in wraps data inside json.data
        const d = json.data || {};
        const name = d.trade_name || d.legal_name || '';
        const address = d.address || '';

        if (name) {
          return NextResponse.json({
            found: true,
            source: 'gst_api',
            customer_name: name,
            trade_name: d.trade_name || null,
            legal_name: d.legal_name || null,
            address,
            mobile: '',
            status: d.status || '',
            message:
              '✅ Details fetched from GST portal! Name & Address auto-filled. Please verify Mobile Number.',
          });
        }
      } else if (res.status === 404) {
        return NextResponse.json({
          found: false,
          source: 'none',
          message:
            '⚠️ This GST number was not found on the official GST portal. Please double-check and enter details manually.',
        });
      }
    } catch (apiErr) {
      console.error('gstinapi.in error:', apiErr);
    }
  }

  // 3. Fallback: Sheet.gstincheck API
  const sheetGstinKey = process.env.SHEET_GSTIN_API_KEY || process.env.GST_API_KEY || '';
  if (sheetGstinKey) {
    try {
      const res = await fetch(
        `https://sheet.gstincheck.co.in/check/${sheetGstinKey}/${rawGst}`,
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 3600 },
        }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.flag && json.data) {
          const d = json.data;
          const name = d.tradeNam || d.lgnm || '';
          const pradr = d.pradr?.addr || {};
          const addressParts = [
            pradr.bno,
            pradr.bnm,
            pradr.st,
            pradr.loc,
            pradr.dst,
            pradr.stcd,
            pradr.pncd ? `PIN - ${pradr.pncd}` : '',
          ].filter(Boolean);

          return NextResponse.json({
            found: true,
            source: 'gst_api',
            customer_name: name,
            trade_name: d.tradeNam,
            legal_name: d.lgnm,
            address: addressParts.join(', '),
            mobile: '',
            message: 'Details fetched from GST portal! Please verify/enter Mobile Number.',
          });
        }
      }
    } catch (apiErr) {
      console.error('Sheet GSTIN API error:', apiErr);
    }
  }

  // 4. Fallback: RapidAPI GSTIN endpoint
  const rapidApiKey = process.env.RAPIDAPI_KEY || '';
  if (rapidApiKey) {
    try {
      const res = await fetch(`https://gst-insights-api.p.rapidapi.com/gstin/${rawGst}`, {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'gst-insights-api.p.rapidapi.com',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const name = json.trade_name || json.legal_name || '';
        const address = json.address || '';
        if (name) {
          return NextResponse.json({
            found: true,
            source: 'gst_api',
            customer_name: name,
            address,
            mobile: '',
            message: 'Details fetched from GST API! Please verify/enter Mobile Number.',
          });
        }
      }
    } catch (rapidErr) {
      console.error('RapidAPI error:', rapidErr);
    }
  }

  // If no records in database and no online API matched
  return NextResponse.json({
    found: false,
    source: 'none',
    message:
      'No existing customer record found for this GST number. Please enter Customer Name, Mobile & Address once; it will be remembered for next time!',
  });
}
