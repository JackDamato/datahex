const { initializeDatabase, createUser, getUserByUsername } = require('../backend/dist/db');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    console.log('Testing user creation...');
    const userId = await createUser('testuser', 'testhash');
    console.log('User created with ID:', userId);
    
    console.log('Testing user retrieval...');
    const user = await getUserByUsername('testuser');
    console.log('User retrieved:', user);
    
  } catch (error) {
    console.error('Database test error:', error);
  }
}

testDatabase();
