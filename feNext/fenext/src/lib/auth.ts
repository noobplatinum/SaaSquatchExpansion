import bcrypt from 'bcryptjs';
import { sql } from './db';
import type { User } from './db';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(userData: {
  email: string;
  username: string;
  password: string;
  linkedin_url?: string;
  target_industries?: string[];
  min_employees?: number;
  max_employees?: number;
  min_revenue?: number;
  max_revenue?: number;
  business_type_preference?: string;
  require_contact_info?: boolean;
}): Promise<User> {
  const { 
    email, 
    username, 
    password, 
    linkedin_url,
    target_industries,
    min_employees,
    max_employees,
    min_revenue,
    max_revenue,
    business_type_preference,
    require_contact_info
  } = userData;
  
  // Debug logging
  console.log('Creating user with data:', {
    email,
    username,
    linkedin_url,
    target_industries,
    min_employees,
    max_employees,
    min_revenue,
    max_revenue,
    business_type_preference,
    require_contact_info
  });
  
  // Check if user already exists
  const existingUser = await sql`
    SELECT id FROM users 
    WHERE email = ${email} OR username = ${username}
  `;
  
  if (existingUser.length > 0) {
    throw new Error('User with this email or username already exists');
  }
  
  const passwordHash = await hashPassword(password);
  
  try {
    const [user] = await sql`
      INSERT INTO users (
        email, 
        username, 
        password_hash, 
        linkedin_url,
        target_industries,
        min_employees,
        max_employees,
        min_revenue,
        max_revenue,
        business_type_preference,
        require_contact_info
      )
      VALUES (
        ${email}, 
        ${username}, 
        ${passwordHash}, 
        ${linkedin_url || null},
        ${target_industries || null},
        ${min_employees || null},
        ${max_employees || null},
        ${min_revenue || null},
        ${max_revenue || null},
        ${business_type_preference || null},
        ${require_contact_info ?? true}
      )
      RETURNING *
    `;
    
    console.log('User created successfully:', user);
    return user as User;
    
  } catch (dbError) {
    console.error('Database error during user creation:', dbError);
    throw new Error('Failed to create user in database');
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const [user] = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return null;
  }
  
  // Update last login
  await sql`
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = ${user.id}
  `;
  
  return user as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await sql`
    SELECT *
    FROM users WHERE email = ${email}
  `;
  
  return user as User || null;
}