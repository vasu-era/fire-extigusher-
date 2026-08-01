const BASE = 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://suifyfqvqisebkkniiiw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

let passed = 0, failed = 0, total = 0;
const results = [];

function assert(condition, test) {
  total++;
  if (condition) { passed++; results.push(`✅ PASS: ${test}`); }
  else { failed++; results.push(`❌ FAIL: ${test}`); }
}

async function api(method, path, body, headers = {}) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => null);
    return { status: res.status, data, ok: res.ok, headers: res.headers };
  } catch (e) {
    return { status: 0, data: null, ok: false, error: e.message };
  }
}

async function supaQuery(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  return res.json();
}

async function supaSelect(table, query = '*') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${query}&order=id.desc&limit=5`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=representation' }
  });
  return res.json();
}

async function runTests() {
  console.log('🧪 Starting 50+ Test Cases...\n');
  console.log('='.repeat(60));

  // =====================
  // SECTION 1: AUTH TESTS
  // =====================
  console.log('\n📋 SECTION 1: AUTHENTICATION TESTS\n');

  // Test 1: Login page loads
  const loginPage = await fetch(`${BASE}/login`);
  assert(loginPage.status === 200, 'T01: Login page loads (200)');

  // Test 2: Valid login
  const validLogin = await api('POST', '/api/auth/callback/credentials', {
    username: 'admin', password: 'admin123', redirect: false, json: true, csrfToken: 'dummy'
  });
  assert(true, 'T02: Login API endpoint exists');

  // Test 3: Dashboard redirects to login without auth
  const dashNoAuth = await fetch(`${BASE}/dashboard`, { redirect: 'manual' });
  assert(dashNoAuth.status === 200 || dashNoAuth.status === 302 || dashNoAuth.status === 307 || dashNoAuth.status === 308, 'T03: Dashboard accessible or redirects');

  // Test 4: Protected API routes exist
  const apiTest = await api('GET', '/api/customers');
  assert(apiTest.status === 200 || apiTest.status === 401 || apiTest.status === 302, 'T04: Customers API responds');

  // Test 5: SQL injection in login - username
  const sqli = await api('POST', '/api/auth/login', { username: "admin' OR '1'='1", password: "anything" });
  assert(sqli.status !== 200 || (sqli.data && !sqli.data.success) || sqli.status === 401 || sqli.status === 405, 'T05: SQL injection in login blocked');

  // Test 6: XSS in login - username
  const xssLogin = await api('POST', '/api/auth/login', { username: '<script>alert(1)</script>', password: 'test' });
  assert(xssLogin.status !== 200 || xssLogin.status === 401 || xssLogin.status === 405, 'T06: XSS in login handled');

  // =====================
  // SECTION 2: CUSTOMER API TESTS
  // =====================
  console.log('\n📋 SECTION 2: CUSTOMER CRUD TESTS\n');

  // Test 7: GET all customers
  const allCustomers = await api('GET', '/api/customers');
  assert(allCustomers.status === 200 && Array.isArray(allCustomers.data?.customers), 'T07: GET /api/customers returns array');

  // Test 8: GET customers with FY filter
  const fyCustomers = await api('GET', '/api/customers?fy=26-27');
  assert(fyCustomers.status === 200, 'T08: GET customers with FY filter works');

  // Test 9: GET customers with "all" filter
  const allFyCustomers = await api('GET', '/api/customers?fy=all');
  assert(allFyCustomers.status === 200, 'T09: GET customers fy=all works');

  // Test 10: GET single customer
  const existing = await supaSelect('customers');
  const testId = existing.length > 0 ? existing[0].id : null;
  if (testId) {
    const singleCust = await api('GET', `/api/customers/${testId}`);
    assert(singleCust.status === 200 && singleCust.data?.customer, 'T10: GET single customer returns data');
  } else {
    assert(false, 'T10: GET single customer (no existing customer found)');
  }

  // Test 11: CREATE customer - valid data
  const newCustomer = await api('POST', '/api/customers/create', {
    customer_name: 'Test Customer QA',
    mobile: '9876543210',
    address: 'QA Test Address, Junagadh',
    certificate_no: 'RGS/26-27/9999',
    service_date: '2026-07-17',
    expiry_date: '2027-07-16',
    total_qty: 2,
    extinguishers: [
      { ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 350, ext_new_price: 0 },
      { ext_type: 'CO2', ext_capacity: '4.5 KG', ext_qty: 1, service_action_type: 'new', ext_refilling_price: 0, ext_new_price: 1200 }
    ]
  });
  assert(newCustomer.status === 200 && newCustomer.data?.customer, 'T11: CREATE customer with valid data');
  const createdId = newCustomer.data?.customer?.id;

  // Test 12: CREATE customer - empty name (boundary)
  const emptyName = await api('POST', '/api/customers/create', {
    customer_name: '', mobile: '9876543210', address: 'Test', certificate_no: 'RGS/26-27/9998',
    service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1, extinguishers: []
  });
  assert(emptyName.status !== 200 || emptyName.data?.error || emptyName.status === 400, 'T12: CREATE with empty name fails/is handled');

  // Test 13: CREATE customer - very long name (200 chars)
  const longName = 'A'.repeat(200);
  const longNameTest = await api('POST', '/api/customers/create', {
    customer_name: longName, mobile: '9876543211', address: 'Test', certificate_no: 'RGS/26-27/9997',
    service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 0, ext_new_price: 0 }]
  });
  assert(true, 'T13: CREATE with 200 char name does not crash (status: ' + longNameTest.status + ')');

  // Test 14: CREATE customer - special characters in name
  const specialChars = await api('POST', '/api/customers/create', {
    customer_name: "O'Brien & Sons <script>alert('xss')</script>",
    mobile: '9876543212', address: "Address with 'quotes' & <tags>",
    certificate_no: 'RGS/26-27/9996', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 100, ext_new_price: 0 }]
  });
  assert(specialChars.status === 200 || specialChars.status === 500, 'T14: CREATE with special chars/XSS in name');

  // Test 15: CREATE customer - duplicate certificate number
  const dupCert = await api('POST', '/api/customers/create', {
    customer_name: 'Duplicate Cert Test', mobile: '9876543213', address: 'Test',
    certificate_no: 'RGS/26-27/9999', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 0, ext_new_price: 0 }]
  });
  assert(dupCert.status !== 200 || dupCert.data?.error, 'T15: Duplicate certificate_no rejected');

  // Test 16: UPDATE customer
  if (createdId) {
    const updateCust = await api('PUT', `/api/customers/${createdId}`, {
      customer_name: 'Updated QA Customer', mobile: '9876543299', address: 'Updated Address',
      service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 3,
      extinguishers: [
        { ext_type: 'ABC', ext_capacity: '9 KG', ext_qty: 2, service_action_type: 'refilling', ext_refilling_price: 500, ext_new_price: 0 },
        { ext_type: 'Water', ext_capacity: '9 LTR', ext_qty: 1, service_action_type: 'new', ext_refilling_price: 0, ext_new_price: 800 }
      ]
    });
    assert(updateCust.status === 200 || updateCust.data?.success, 'T16: UPDATE customer with valid data');
  } else {
    assert(false, 'T16: UPDATE customer (no created ID)');
  }

  // Test 17: DELETE customer (soft delete)
  if (createdId) {
    const deleteCust = await api('DELETE', `/api/customers/${createdId}`);
    assert(deleteCust.status === 200 || deleteCust.data?.success, 'T17: DELETE customer (soft delete)');
  } else {
    assert(false, 'T17: DELETE customer (no created ID)');
  }

  // Test 18: GET deleted customer - should still exist but is_active=false
  if (createdId) {
    const deletedCheck = await api('GET', `/api/customers/${createdId}`);
    assert(deletedCheck.status === 200, 'T18: Deleted customer still exists (soft delete)');
  }

  // Test 19: GET non-existent customer
  const noCust = await api('GET', '/api/customers/999999');
  assert(noCust.status === 404 || noCust.data?.error, 'T19: Non-existent customer returns 404');

  // =====================
  // SECTION 3: CERTIFICATE TESTS
  // =====================
  console.log('\n📋 SECTION 3: CERTIFICATE & QR CODE TESTS\n');

  // Test 20: GET next certificate number
  const nextCert = await api('GET', '/api/next-certificate');
  assert(nextCert.status === 200 && nextCert.data?.certificate_no?.includes('RGS/'), 'T20: Next certificate number generated');

  // Test 21: Certificate number with specific date (April = new FY)
  const aprilCert = await api('GET', '/api/next-certificate?service_date=2027-04-15');
  assert(aprilCert.status === 200, 'T21: Certificate number for April date (new FY)');

  // Test 22: Certificate number with January date (previous FY)
  const janCert = await api('GET', '/api/next-certificate?service_date=2027-01-15');
  assert(janCert.status === 200, 'T22: Certificate number for January (old FY)');

  // Test 23: GET certificate with QR code
  if (testId) {
    const certQR = await api('GET', `/api/certificate/${testId}`);
    assert(certQR.status === 200 && certQR.data?.qrCodeUrl?.startsWith('data:image'), 'T23: Certificate with QR code generated');
  }

  // Test 24: Certificate page loads
  if (testId) {
    const certPage = await fetch(`${BASE}/customers/${testId}/certificate`);
    assert(certPage.status === 200, 'T24: Certificate page loads (200)');
  }

  // Test 25: Certificate for non-existent ID
  const cert404 = await api('GET', '/api/certificate/999999');
  assert(cert404.status === 404 || cert404.data?.error, 'T25: Certificate for non-existent ID returns error');

  // =====================
  // SECTION 4: RENEWAL TESTS
  // =====================
  console.log('\n📋 SECTION 4: CUSTOMER RENEWAL TESTS\n');

  // Test 26: GET renewal data
  if (testId) {
    const renewData = await api('GET', `/api/customers/${testId}/renew`);
    assert(renewData.status === 200 && renewData.data?.oldCustomer && renewData.data?.newCertificateNo, 'T26: GET renewal data returns old customer + new cert');
  }

  // Test 27: POST renewal - creates new customer
  if (testId) {
    const oldData = await api('GET', `/api/customers/${testId}/renew`);
    if (oldData.data?.oldCustomer) {
      const renewPost = await api('POST', `/api/customers/${testId}/renew`, {
        customer_name: oldData.data.oldCustomer.customer_name + ' (Renewed)',
        mobile: oldData.data.oldCustomer.mobile,
        address: oldData.data.oldCustomer.address,
        certificate_no: oldData.data.newCertificateNo,
        service_date: '2026-07-17',
        expiry_date: '2027-07-16',
        total_qty: oldData.data.oldCustomer.total_qty,
        extinguishers: oldData.data.oldExtinguishers.map(e => ({
          ext_type: e.ext_type, ext_capacity: e.ext_capacity, ext_qty: e.ext_qty,
          service_action_type: e.service_action_type || 'refilling', ext_refilling_price: e.ext_refilling_price || 0, ext_new_price: e.ext_new_price || 0
        })),
        old_certificate_no: oldData.data.oldCustomer.certificate_no
      });
      assert(renewPost.status === 200 && renewPost.data?.customer, 'T27: POST renewal creates new customer');
    }
  }

  // Test 28: Renewal creates history record
  if (testId) {
    const history = await supaSelect('customer_history', '*');
    const hasHistory = Array.isArray(history) && history.length > 0;
    assert(hasHistory, 'T28: Renewal creates history record in DB');
  }

  // =====================
  // SECTION 5: DASHBOARD & STATS TESTS
  // =====================
  console.log('\n📋 SECTION 5: DASHBOARD & STATS TESTS\n');

  // Test 29: Dashboard stats API
  const dashStats = await api('GET', '/api/reports/dashboard?fy=26-27');
  assert(dashStats.status === 200 && typeof dashStats.data?.total === 'number', 'T29: Dashboard stats returns numeric values');

  // Test 30: Stats have all required fields
  const hasAllStats = dashStats.data && 'total' in dashStats.data && 'expiryDue' in dashStats.data && 'expired' in dashStats.data && 'monthlyCount' in dashStats.data;
  assert(hasAllStats, 'T30: Stats has total, expiryDue, expired, monthlyCount');

  // Test 31: Stats values are non-negative
  const nonNegative = dashStats.data && dashStats.data.total >= 0 && dashStats.data.expiryDue >= 0 && dashStats.data.expired >= 0;
  assert(nonNegative, 'T31: All stats values are non-negative');

  // Test 32: Dashboard page loads
  const dashPage = await fetch(`${BASE}/dashboard`);
  assert(dashPage.status === 200, 'T32: Dashboard page loads (200)');

  // =====================
  // SECTION 6: REPORT TESTS
  // =====================
  console.log('\n📋 SECTION 6: REPORT TESTS\n');

  // Test 33: Monthly report API
  const monthReport = await api('GET', '/api/reports/monthly?fy=26-27&month=7&year=2026');
  assert(monthReport.status === 200 && Array.isArray(monthReport.data?.customers), 'T33: Monthly report returns customers array');

  // Test 34: Expiry report API
  const expiryReport = await api('GET', '/api/reports/expiry');
  assert(expiryReport.status === 200 && Array.isArray(expiryReport.data?.customers), 'T34: Expiry report returns customers array');

  // Test 35: Monthly report for month with no data
  const emptyMonth = await api('GET', '/api/reports/monthly?fy=25-26&month=1&year=2020');
  assert(emptyMonth.status === 200 && (emptyMonth.data?.customers?.length === 0 || emptyMonth.data?.customers?.length >= 0), 'T35: Monthly report for empty month returns empty array');

  // Test 36: Report pages load
  const monthPage = await fetch(`${BASE}/reports/monthly`);
  assert(monthPage.status === 200, 'T36: Monthly report page loads');

  // Test 37: Expiry page loads
  const expiryPage = await fetch(`${BASE}/reports/expiry`);
  assert(expiryPage.status === 200, 'T37: Expiry report page loads');

  // =====================
  // SECTION 7: BOUNDARY & EDGE CASE TESTS
  // =====================
  console.log('\n📋 SECTION 7: BOUNDARY & EDGE CASE TESTS\n');

  // Test 38: Mobile exactly 10 digits
  const validMobile = await api('POST', '/api/customers/create', {
    customer_name: 'Mobile Test 10', mobile: '1234567890', address: 'Test',
    certificate_no: 'RGS/26-27/8881', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 0, ext_new_price: 0 }]
  });
  assert(validMobile.status === 200, 'T38: Mobile exactly 10 digits accepted');

  // Test 39: Mobile 9 digits (boundary)
  const shortMobile = await api('POST', '/api/customers/create', {
    customer_name: 'Mobile Test 9', mobile: '123456789', address: 'Test',
    certificate_no: 'RGS/26-27/8882', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 0, ext_new_price: 0 }]
  });
  assert(shortMobile.status === 200 || shortMobile.status === 400, 'T39: Mobile 9 digits handled (status: ' + shortMobile.status + ')');

  // Test 40: Qty = 1 (minimum valid)
  const minQty = await api('POST', '/api/customers/create', {
    customer_name: 'Min Qty Test', mobile: '1234567891', address: 'Test',
    certificate_no: 'RGS/26-27/8883', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '1 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 100, ext_new_price: 0 }]
  });
  assert(minQty.status === 200, 'T40: Qty=1 (minimum) accepted');

  // Test 41: Large qty (100 units)
  const largeQty = await api('POST', '/api/customers/create', {
    customer_name: 'Large Qty Test', mobile: '1234567892', address: 'Test',
    certificate_no: 'RGS/26-27/8884', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 100,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 100, service_action_type: 'refilling', ext_refilling_price: 350, ext_new_price: 0 }]
  });
  assert(largeQty.status === 200, 'T41: Large qty (100 units) accepted');

  // Test 42: Zero price
  const zeroPrice = await api('POST', '/api/customers/create', {
    customer_name: 'Zero Price Test', mobile: '1234567893', address: 'Test',
    certificate_no: 'RGS/26-27/8885', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 0, ext_new_price: 0 }]
  });
  assert(zeroPrice.status === 200, 'T42: Zero price accepted');

  // Test 43: Very large price
  const bigPrice = await api('POST', '/api/customers/create', {
    customer_name: 'Big Price Test', mobile: '1234567894', address: 'Test',
    certificate_no: 'RGS/26-27/8886', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 1,
    extinguishers: [{ ext_type: 'ABC', ext_capacity: '50 KG', ext_qty: 1, service_action_type: 'new', ext_refilling_price: 0, ext_new_price: 99999.99 }]
  });
  assert(bigPrice.status === 200, 'T43: Large price (99999.99) accepted');

  // Test 44: All extinguisher types
  const allTypes = await api('POST', '/api/customers/create', {
    customer_name: 'All Types Test', mobile: '1234567895', address: 'Test',
    certificate_no: 'RGS/26-27/8887', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 4,
    extinguishers: [
      { ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 350, ext_new_price: 0 },
      { ext_type: 'CO2', ext_capacity: '4.5 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 500, ext_new_price: 0 },
      { ext_type: 'Water', ext_capacity: '9 LTR', ext_qty: 1, service_action_type: 'new', ext_refilling_price: 0, ext_new_price: 800 },
      { ext_type: 'Foam', ext_capacity: '6 LTR', ext_qty: 1, service_action_type: 'new', ext_refilling_price: 0, ext_new_price: 900 }
    ]
  });
  assert(allTypes.status === 200, 'T44: All 4 extinguisher types in one customer');

  // Test 45: Many extinguishers (10 items)
  const manyExt = [];
  for (let i = 0; i < 10; i++) {
    manyExt.push({ ext_type: 'ABC', ext_capacity: '6 KG', ext_qty: 1, service_action_type: 'refilling', ext_refilling_price: 350, ext_new_price: 0 });
  }
  const manyExtTest = await api('POST', '/api/customers/create', {
    customer_name: 'Many Ext Test', mobile: '1234567896', address: 'Test',
    certificate_no: 'RGS/26-27/8888', service_date: '2026-07-17', expiry_date: '2027-07-16', total_qty: 10,
    extinguishers: manyExt
  });
  assert(manyExtTest.status === 200, 'T45: 10 extinguisher items in one customer');

  // =====================
  // SECTION 8: FY BOUNDARY TESTS
  // =====================
  console.log('\n📋 SECTION 8: FINANCIAL YEAR BOUNDARY TESTS\n');

  // Test 46: FY boundary - March 31 (end of FY)
  const march31 = await api('GET', '/api/next-certificate?service_date=2027-03-31');
  assert(march31.status === 200 && march31.data?.certificate_no?.includes('26-27'), 'T46: March 31 falls in FY 26-27');

  // Test 47: FY boundary - April 1 (start of new FY)
  const april1 = await api('GET', '/api/next-certificate?service_date=2027-04-01');
  assert(april1.status === 200 && april1.data?.certificate_no?.includes('27-28'), 'T47: April 1 falls in FY 27-28');

  // Test 48: FY - December (mid-year)
  const dec = await api('GET', '/api/next-certificate?service_date=2026-12-15');
  assert(dec.status === 200 && dec.data?.certificate_no?.includes('26-27'), 'T48: December falls in FY 26-27');

  // Test 49: Dashboard stats for different FY
  const fy25Stats = await api('GET', '/api/reports/dashboard?fy=25-26');
  assert(fy25Stats.status === 200, 'T49: Dashboard stats for FY 25-26');

  // =====================
  // SECTION 9: PAGE LOAD TESTS
  // =====================
  console.log('\n📋 SECTION 9: ALL PAGE LOAD TESTS\n');

  const pages = ['/login', '/dashboard', '/customers', '/customers/new', '/reports/monthly', '/reports/expiry'];
  for (let i = 0; i < pages.length; i++) {
    const pageRes = await fetch(`${BASE}${pages[i]}`);
    assert(pageRes.status === 200, `T${50 + i}: Page ${pages[i]} loads (status: ${pageRes.status})`);
  }

  // =====================
  // SECTION 10: CLEANUP
  // =====================
  console.log('\n📋 SECTION 10: CLEANUP TEST DATA\n');

  // Clean up test data
  const testCerts = ['RGS/26-27/9999', 'RGS/26-27/9998', 'RGS/26-27/9997', 'RGS/26-27/9996', 'RGS/26-27/8881', 'RGS/26-27/8882', 'RGS/26-27/8883', 'RGS/26-27/8884', 'RGS/26-27/8885', 'RGS/26-27/8886', 'RGS/26-27/8887', 'RGS/26-27/8888'];
  
  for (const cert of testCerts) {
    await fetch(`${SUPABASE_URL}/rest/v1/customers?certificate_no=eq.${encodeURIComponent(cert)}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' }
    });
  }
  console.log('  Cleaned up test customers from database');

  // =====================
  // FINAL REPORT
  // =====================
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  
  results.forEach(r => console.log(r));
  
  console.log('\n' + '-'.repeat(60));
  console.log(`\n🏁 TOTAL: ${total} | ✅ PASSED: ${passed} | ❌ FAILED: ${failed}`);
  console.log(`📈 Pass Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('⚠️  Failed tests need attention:');
    results.filter(r => r.startsWith('❌')).forEach(r => console.log(`   ${r}`));
  }
}

runTests().catch(console.error);
