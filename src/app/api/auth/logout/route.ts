import { NextRequest, NextResponse } from 'next/server';
import { logActionWithSignature } from '@/lib/logger';
import { getUserById, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authentication token' }, { status: 401 });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Validate the token and get user
    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const user = await getUserById(userId);
    // Get the action signature from request body
    const { actionSignature } = await request.json();
    if (!actionSignature) {
      return NextResponse.json({ error: 'Missing action signature' }, { status: 400 });
    }
    
    // Log the action with signature for non-repudiation
    await logActionWithSignature(
      `User logged out: ${user?.username}`, 
      userId,
      actionSignature,
      { timestamp: new Date().toISOString() }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Failed to process logout' }, { status: 500 });
  }
}