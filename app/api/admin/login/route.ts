import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // In production, the password should be hashed
    // For now, we'll use a simple comparison
    const isValid = password === adminPassword;

    if (isValid) {
      // Create a simple token (in production, use JWT or sessions)
      const token = Buffer.from(`admin:${Date.now()}`).toString('base64');
      
      return NextResponse.json({ 
        success: true, 
        token,
        message: 'Login successful' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
