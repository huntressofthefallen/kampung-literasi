import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Simple password comparison
    // For production, consider using a proper authentication system with hashed passwords
    const isValid = password === adminPassword;

    if (isValid) {
      // Create a simple token (in production, use JWT or sessions)
      const token = Buffer.from(`admin:${Date.now()}`).toString('base64');

      return NextResponse.json({
        success: true,
        token,
        message: 'Login berhasil'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Kata sandi tidak valid' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Login gagal' },
      { status: 500 }
    );
  }
}
