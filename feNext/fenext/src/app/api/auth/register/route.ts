import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      username, 
      password, 
      name, 
      company, 
      linkedin_url,
      target_industries,
      min_employees,
      max_employees,
      min_revenue,
      max_revenue,
      business_type_preference,
      require_contact_info
    } = await request.json();
    
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    console.log('Received registration data:', {
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
    
    const user = await createUser({
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
    });
    
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        linkedin_url: user.linkedin_url,
        target_industries: user.target_industries,
        min_employees: user.min_employees,
        max_employees: user.max_employees,
        min_revenue: user.min_revenue,
        max_revenue: user.max_revenue,
        business_type_preference: user.business_type_preference,
        require_contact_info: user.require_contact_info
      }
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}