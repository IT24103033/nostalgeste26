import http from 'http';

const BASE_URL = 'http://localhost:5000';

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: null, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Starting Full System-Wide Pre-Deployment Verification Test...\n');
  let passed = 0;
  let failed = 0;

  const test = (name, assertion) => {
    if (assertion) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await request('/api/health');
    test('Server Health Check returns online', health.status === 200 && health.data?.status === 'online');

    // 2. Event config
    const config = await request('/api/attendees/config');
    test('Public Event Config returns event details and pricing', 
      config.status === 200 && config.data?.success && config.data?.config?.eventName === "Nostalgeste '26");
    test('Full ticket price is numeric and configured (Rs. 6,500)', config.data?.config?.fullTicketPrice === 6500);

    // 3. Admin Login (Bad password)
    const badLogin = await request('/api/admin/login', 'POST', { password: 'wrongpassword' });
    test('Admin login rejects incorrect password', badLogin.status === 401 && badLogin.data?.success === false);

    // 4. Admin Login (Correct password)
    const login = await request('/api/admin/login', 'POST', { password: 'nostalgeste2026' });
    test('Admin login succeeds with valid password', login.status === 200 && login.data?.success && !!login.data?.token);
    const adminToken = login.data?.token;

    // 5. Admin Metrics
    const metrics = await request('/api/admin/metrics', 'GET', null, { Authorization: `Bearer ${adminToken}` });
    test('Admin metrics endpoint returns live stats', metrics.status === 200 && metrics.data?.success && typeof metrics.data?.metrics?.total === 'number');

    // 6. Validation: Reject invalid phone numbers
    const badPhone = await request('/api/admin/attendees/manual-add', 'POST', {
      name: 'Validation Tester',
      nic: '200429103702',
      phone: 'fewfcfc',
    }, { Authorization: `Bearer ${adminToken}` });
    test('Validation: Rejects gibberish phone numbers', badPhone.status === 400 && badPhone.data?.success === false);

    // 7. Validation: Reject invalid NIC format & old 9-digit format
    const badNic = await request('/api/admin/attendees/manual-add', 'POST', {
      name: 'Validation Tester',
      nic: 'INVALID_NIC_123',
      phone: '0771234567',
    }, { Authorization: `Bearer ${adminToken}` });
    test('Validation: Rejects invalid NIC formats', badNic.status === 400 && badNic.data?.success === false);

    const oldNic = await request('/api/admin/attendees/manual-add', 'POST', {
      name: 'Old Nic Tester',
      nic: '200429103V',
      phone: '0771234567',
    }, { Authorization: `Bearer ${adminToken}` });
    test('Validation: Rejects old 9-digit with V format (strictly 12 digits required)', oldNic.status === 400 && oldNic.data?.success === false);

    // 8. Validation: Reject invalid Name (symbols/digits)
    const badName = await request('/api/admin/attendees/manual-add', 'POST', {
      name: 'Student 123 @#$',
      nic: '200429103702',
      phone: '0771234567',
    }, { Authorization: `Bearer ${adminToken}` });
    test('Validation: Rejects invalid names with digits/symbols', badName.status === 400 && badName.data?.success === false);

    // 9. Admin Manual Add Student with valid data
    const testNic = `2004${Date.now().toString().slice(-8)}`;
    const newStudent = await request('/api/admin/attendees/manual-add', 'POST', {
      name: 'Automated Test Student',
      nic: testNic,
      studentClass: 'C1',
      phone: '0771234567',
      email: 'test@nostalgeste26.com',
      paymentChoice: 'FULL',
      paymentStatus: 'FULL_APPROVED',
      amountPaid: 6500,
      notes: 'Pre-deploy automated verification student',
    }, { Authorization: `Bearer ${adminToken}` });

    test('Admin can manually register and approve student with valid details', newStudent.status === 201 && newStudent.data?.success);
    const studentData = newStudent.data?.attendee;
    const qrToken = newStudent.data?.qrToken || studentData?.qrToken;
    test('Generated attendee has valid unique qrToken', typeof qrToken === 'string' && qrToken.length > 20);

    // 10. Duplicate NIC rejection
    const dupStudent = await request('/api/admin/attendees/manual-add', 'POST', {
      name: 'Duplicate Test',
      nic: testNic,
      studentClass: 'C1',
      phone: '0771234567',
    }, { Authorization: `Bearer ${adminToken}` });
    test('System prevents duplicate NIC registration', dupStudent.status === 400 && dupStudent.data?.success === false);

    // 11. Public NIC Search (Student lookup)
    const lookup = await request(`/api/attendees/${testNic}`);
    test('Public NIC lookup returns verified attendee', lookup.status === 200 && lookup.data?.attendee?.name === 'Automated Test Student');
    test('Public lookup generates Golden QR code Data URL for full paid student', !!lookup.data?.qrCodeDataURL?.startsWith('data:image/png;base64'));

    // 12. Token lookup for WhatsApp invitation link
    const tokenLookup = await request(`/api/attendees/lookup-token/${qrToken}`);
    test('Token verification lookup validates attendee ticket pass', tokenLookup.status === 200 && tokenLookup.data?.attendee?.nic === testNic);
    test('Ticket starts as unused (ticketUsed = false)', tokenLookup.data?.attendee?.ticketUsed === false);

    // 13. Standalone HTML Invitation endpoint
    const htmlInvitation = await request(`/api/attendees/invitation-html/${qrToken}`);
    test('Standalone HTML Invitation Pass renders complete HTML document', 
      htmlInvitation.status === 200 && 
      htmlInvitation.raw.includes("Nostalgeste '26") && 
      htmlInvitation.raw.includes('Automated Test Student') &&
      htmlInvitation.raw.includes(testNic));

    // 14. Gate Check-in verification
    const checkIn = await request('/api/attendees/check-in', 'POST', {
      qrToken,
      wristbandNumber: '#WB-999',
    });
    test('Gate QR Scan successfully checks in attendee with wristband', checkIn.status === 200 && checkIn.data?.success);

    // 15. Anti-Duplication Check-in (2nd scan of same QR)
    const secondCheckIn = await request('/api/attendees/check-in', 'POST', {
      qrToken,
      wristbandNumber: '#WB-1000',
    });
    test('Anti-Duplication Protection: Rejects reused QR pass on 2nd scan', secondCheckIn.status === 400 && secondCheckIn.data?.code === 'ALREADY_USED');

    // 16. Test NIC direct gate check-in fallback (for when QR camera fails)
    const testNic2 = `2004${(Date.now() + 1).toString().slice(-8)}`;
    const student2 = await request('/api/admin/attendees/manual-add', 'POST', {
      name: 'NIC Check-in Student',
      nic: testNic2,
      studentClass: 'BM',
      phone: '0779876543',
    }, { Authorization: `Bearer ${adminToken}` });

    const nicCheckIn = await request('/api/attendees/check-in', 'POST', {
      qrToken: testNic2, // Passed NIC directly instead of QR token
      wristbandNumber: '#WB-202',
    });
    test('Gate Check-in Backup: Successfully verifies and checks in attendee using 12-digit NIC directly', 
      nicCheckIn.status === 200 && nicCheckIn.data?.success && nicCheckIn.data?.attendee?.nic === testNic2);

    // 17. Clean up test records
    if (studentData?._id || studentData?.id) {
      await request(`/api/admin/attendees/${studentData._id || studentData.id}`, 'DELETE', null, { Authorization: `Bearer ${adminToken}` });
    }
    if (student2.data?.attendee?._id || student2.data?.attendee?.id) {
      const deleteRes = await request(`/api/admin/attendees/${student2.data.attendee._id || student2.data.attendee.id}`, 'DELETE', null, { Authorization: `Bearer ${adminToken}` });
      test('Admin can delete test records to keep database clean', deleteRes.status === 200 && deleteRes.data?.success);
    }

  } catch (err) {
    console.error('Test Execution Exception:', err);
    failed++;
  }

  console.log('\n========================================');
  console.log(`🏁 System Verification Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
