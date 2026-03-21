const http = require('http');

// Test organizer login
const organizerData = JSON.stringify({
  email: 'salmindiwala@gmail.com',
  password: 'Mariamuu@#23',
  role: 'organizer'
});

const organizerOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(organizerData)
  }
};

const organizerReq = http.request(organizerOptions, (res) => {
  console.log('Organizer login status:', res.statusCode);
  console.log('Organizer cookies:', res.headers['set-cookie']);
  
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Organizer response:', body);
    
    // Test accessing organizer page with cookies
    const cookies = res.headers['set-cookie'] || [];
    const cookieHeader = cookies.join('; ');
    
    const pageOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/organizer',
      method: 'GET',
      headers: {
        'Cookie': cookieHeader
      }
    };
    
    const pageReq = http.request(pageOptions, (pageRes) => {
      console.log('Organizer page access status:', pageRes.statusCode);
    });
    
    pageReq.end();
  });
});

organizerReq.write(organizerData);
organizerReq.end();
