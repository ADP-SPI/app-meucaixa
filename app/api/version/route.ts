import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Lê o arquivo package.json pra pegar versão
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    return NextResponse.json({
      version: packageJson.version || '1.0.0',
      buildTime: new Date().toISOString(),
      timestamp: Date.now()
    });
  } catch (err) {
    return NextResponse.json({
      version: '1.0.0',
      buildTime: new Date().toISOString(),
      timestamp: Date.now()
    });
  }
}
