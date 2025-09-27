import * as jwt from 'jsonwebtoken';
import { createUser, getUserByUsername, getUserById } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  userId: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  username: string;
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  const payload = { userId: user.userId, username: user.username };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      username: decoded.username
    };
  } catch (error) {
    return null;
  }
}

// Simple password hash (for testing only - not secure)
function simpleHash(password: string): string {
  return Buffer.from(password).toString('base64');
}

// Simple password compare (for testing only - not secure)
function simpleCompare(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

// Sign up new user
export async function signupUser(request: SignupRequest): Promise<AuthResponse> {
  const { username, password } = request;

  // Check if user already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Validate input
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters long');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Hash password (simple hash for testing)
  const passwordHash = simpleHash(password);

  // Create user
  const userId = await createUser(username, passwordHash);

  // Generate token
  const user: AuthUser = { userId, username };
  const token = generateToken(user);

  return {
    token,
    userId,
    username
  };
}

// Login user
export async function loginUser(request: LoginRequest): Promise<AuthResponse> {
  const { username, password } = request;

  // Validate input
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  // Get user from database
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Compare password (simple compare for testing)
  const isValidPassword = simpleCompare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid username or password');
  }

  // Generate token
  const authUser: AuthUser = { userId: user.userId, username: user.username };
  const token = generateToken(authUser);

  return {
    token,
    userId: user.userId,
    username: user.username
  };
}

// Validate token and get user
export async function validateTokenAndGetUser(token: string): Promise<AuthUser | null> {
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  // Verify user still exists in database
  const user = await getUserById(decoded.userId);
  if (!user) {
    return null;
  }

  return {
    userId: user.userId,
    username: user.username
  };
}
