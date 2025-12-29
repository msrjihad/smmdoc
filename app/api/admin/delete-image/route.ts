import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imagePath } = body;

    if (!imagePath || typeof imagePath !== 'string') {
      return NextResponse.json({ error: 'Image path is required' }, { status: 400 });
    }

    const imagePathRelative = imagePath.startsWith('/') 
      ? imagePath.substring(1) 
      : imagePath;

    const filePath = path.join(process.cwd(), 'public', imagePathRelative);

    const publicDir = path.join(process.cwd(), 'public');
    const resolvedPath = path.resolve(filePath);
    const resolvedPublicDir = path.resolve(publicDir);

    if (!resolvedPath.startsWith(resolvedPublicDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        success: true, 
        message: 'File not found (may have been already deleted)' 
      });
    }

    try {
      await unlink(filePath);
      return NextResponse.json({ 
        success: true, 
        message: 'File deleted successfully' 
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { error: 'Failed to delete file', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in delete-image route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

