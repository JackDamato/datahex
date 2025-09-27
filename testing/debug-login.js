const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugLogin() {
  try {
    console.log('Testing login endpoint...');
    
    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'debuguser',
        password: 'debugpass'
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugLogin();
