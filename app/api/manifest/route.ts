import { NextResponse } from 'next/server';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const BUILD_TIME = new Date().toISOString();

export async function GET() {
  return NextResponse.json({
    version: APP_VERSION,
    buildTime: BUILD_TIME,
    timestamp: Date.now()
  });
}
