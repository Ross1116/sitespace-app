import { NextResponse } from 'next/server';

export async function POST() {
  // Clear the cookie
  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    'accessToken=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  );
  
  return NextResponse.json(
    { message: 'Logged out successfully' },
    { 
      status: 200,
      headers
    }
  );
}