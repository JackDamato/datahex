import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite connection
const dbPath = path.join(dataDir, 'main.db');
let dbInstance: sqlite3.Database | null = null;

// Get database connection
function getDatabase(): sqlite3.Database {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(dbPath);
  }
  return dbInstance;
}

// Initialize database schema
export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    // Create users table
    database.run(`
      CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        reject(err);
        return;
      }
      console.log('✅ Users table created/verified');
      
      // Create projects table
      database.run(`
        CREATE TABLE IF NOT EXISTS projects (
          projectId TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          name TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (userId)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating projects table:', err);
          reject(err);
          return;
        }
        console.log('✅ Projects table created/verified');
        
        // Create datasets table
        database.run(`
          CREATE TABLE IF NOT EXISTS datasets (
            datasetId TEXT PRIMARY KEY,
            projectId TEXT NOT NULL,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            rows INTEGER DEFAULT 0,
            columns INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (projectId) REFERENCES projects (projectId)
          )
        `, (err) => {
          if (err) {
            console.error('Error creating datasets table:', err);
            reject(err);
            return;
          }
          console.log('✅ Datasets table created/verified');
          
          // Create files table (optional, for future use)
          database.run(`
            CREATE TABLE IF NOT EXISTS files (
              fileId TEXT PRIMARY KEY,
              projectId TEXT NOT NULL,
              filename TEXT NOT NULL,
              path TEXT NOT NULL,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (projectId) REFERENCES projects (projectId)
            )
          `, (err) => {
            if (err) {
              console.error('Error creating files table:', err);
              reject(err);
              return;
            }
            console.log('✅ Files table created/verified');
            resolve();
          });
        });
      });
    });
  });
}

// Database query helper
export function queryDatabase(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Database insert helper
export function insertDatabase(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) {
        console.error('Database insert error:', err);
        reject(err);
        return;
      }
      resolve();
    });
  });
}

// Database update helper
export function updateDatabase(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) {
        console.error('Database update error:', err);
        reject(err);
        return;
      }
      resolve();
    });
  });
}

// Database delete helper
export function deleteDatabase(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) {
        console.error('Database delete error:', err);
        reject(err);
        return;
      }
      resolve();
    });
  });
}

// User management functions
export async function createUser(username: string, passwordHash: string): Promise<string> {
  const userId = uuidv4();
  await insertDatabase(
    'INSERT INTO users (userId, username, passwordHash) VALUES (?, ?, ?)',
    [userId, username, passwordHash]
  );
  return userId;
}

export async function getUserByUsername(username: string): Promise<any> {
  const users = await queryDatabase(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return users[0] || null;
}

export async function getUserById(userId: string): Promise<any> {
  const users = await queryDatabase(
    'SELECT * FROM users WHERE userId = ?',
    [userId]
  );
  return users[0] || null;
}

// Project management functions
export async function createProject(userId: string, name: string): Promise<string> {
  const projectId = uuidv4();
  await insertDatabase(
    'INSERT INTO projects (projectId, userId, name) VALUES (?, ?, ?)',
    [projectId, userId, name]
  );
  return projectId;
}

export async function getProjectsByUserId(userId: string): Promise<any[]> {
  return await queryDatabase(
    'SELECT * FROM projects WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  );
}

export async function getProjectById(projectId: string): Promise<any> {
  const projects = await queryDatabase(
    'SELECT * FROM projects WHERE projectId = ?',
    [projectId]
  );
  return projects[0] || null;
}

export async function deleteProject(projectId: string): Promise<void> {
  await insertDatabase(
    'DELETE FROM projects WHERE projectId = ?',
    [projectId]
  );
}

// Dataset management functions
export async function createDataset(projectId: string, name: string, path: string, rows: number = 0, columns: number = 0): Promise<string> {
  const datasetId = uuidv4();
  await insertDatabase(
    'INSERT INTO datasets (datasetId, projectId, name, path, rows, columns) VALUES (?, ?, ?, ?, ?, ?)',
    [datasetId, projectId, name, path, rows, columns]
  );
  return datasetId;
}

export async function getDatasetsByProjectId(projectId: string): Promise<any[]> {
  return await queryDatabase(
    'SELECT * FROM datasets WHERE projectId = ? ORDER BY createdAt DESC',
    [projectId]
  );
}

export async function getDatasetsByUserId(userId: string): Promise<any[]> {
  return await queryDatabase(`
    SELECT d.*, p.name as projectName 
    FROM datasets d 
    JOIN projects p ON d.projectId = p.projectId 
    WHERE p.userId = ? 
    ORDER BY d.createdAt DESC
  `, [userId]);
}

// Get user profile with projects and datasets
export async function getUserProfile(userId: string): Promise<any> {
  const user = await getUserById(userId);
  if (!user) return null;

  const projects = await queryDatabase(`
    SELECT 
      p.projectId,
      p.name,
      p.createdAt,
      COUNT(d.datasetId) as datasetCount
    FROM projects p
    LEFT JOIN datasets d ON p.projectId = d.projectId
    WHERE p.userId = ?
    GROUP BY p.projectId, p.name, p.createdAt
    ORDER BY p.createdAt DESC
  `, [userId]);

  // Get datasets for each project
  for (const project of projects) {
    project.datasets = await queryDatabase(`
      SELECT datasetId, name, rows, columns, createdAt
      FROM datasets
      WHERE projectId = ?
      ORDER BY createdAt DESC
    `, [project.projectId]);
  }

  return {
    userId: user.userId,
    username: user.username,
    projects
  };
}

// Seed database with test data
export async function seedDatabase(): Promise<void> {
  try {
    // Check if we already have test data
    const existingUsers = await queryDatabase('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('✅ Database already seeded');
      return;
    }

    const bcrypt = require('bcrypt');
    
    // Create test user
    const testPasswordHash = await bcrypt.hash('testpassword', 10);
    const userId = await createUser('testuser', testPasswordHash);
    
    // Create default project for test user
    const projectId = await createProject(userId, 'My First Project');
    
    // Create test dataset
    await createDataset(projectId, 'sample-data.csv', './uploads/sample-data.csv', 100, 5);
    
    console.log('✅ Database seeded with test data');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export { getDatabase as db };