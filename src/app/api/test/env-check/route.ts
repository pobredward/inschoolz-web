import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    return NextResponse.json({ 
      privateKeyExists: !!privateKey,
      privateKeyLength: privateKey?.length || 0,
      privateKeyStart: privateKey?.substring(0, 100) || '',
      privateKeyHasNewlines: privateKey?.includes('\n') || false,
      privateKeyHasBackslashN: privateKey?.includes('\\n') || false,
      allEnvVars: {
        PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        PRIVATE_KEY_ID: !!process.env.FIREBASE_PRIVATE_KEY_ID,
        PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        CLIENT_ID: !!process.env.FIREBASE_CLIENT_ID,
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
