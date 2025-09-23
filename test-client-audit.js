const https = require('https');

async function testClientAudit() {
  console.log('=== Testing Client Audit Logging ===');

  // Get session cookie first by logging in
  const loginData = JSON.stringify({
    email: 'admin@argan.hr',
    password: 'ChangeMe123!'
  });

  const loginOptions = {
    hostname: 'argan-hr-system.vercel.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  return new Promise((resolve, reject) => {
    const loginReq = https.request(loginOptions, (loginRes) => {
      let loginBody = '';

      loginRes.on('data', (chunk) => {
        loginBody += chunk;
      });

      loginRes.on('end', () => {
        const cookies = loginRes.headers['set-cookie'];
        const sessionCookie = cookies ? cookies.find(cookie => cookie.includes('admin_session')) : null;

        if (!sessionCookie) {
          console.error('No session cookie received');
          resolve();
          return;
        }

        console.log('✅ Logged in successfully');

        // Now test creating a client
        const clientData = JSON.stringify({
          companyName: 'Test Audit Company Ltd',
          contactName: 'Audit Test',
          contactEmail: 'audit@test.com',
          serviceTier: 'TIER_1',
          status: 'ACTIVE'
        });

        const clientOptions = {
          hostname: 'argan-hr-system.vercel.app',
          port: 443,
          path: '/api/clients',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': clientData.length,
            'Cookie': sessionCookie.split(';')[0]
          }
        };

        const clientReq = https.request(clientOptions, (clientRes) => {
          let clientBody = '';

          clientRes.on('data', (chunk) => {
            clientBody += chunk;
          });

          clientRes.on('end', () => {
            console.log(`Client creation response (${clientRes.statusCode}):`, clientBody);
            resolve();
          });
        });

        clientReq.on('error', (err) => {
          console.error('Client request error:', err);
          resolve();
        });

        clientReq.write(clientData);
        clientReq.end();
      });
    });

    loginReq.on('error', (err) => {
      console.error('Login request error:', err);
      reject(err);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

testClientAudit().catch(console.error);