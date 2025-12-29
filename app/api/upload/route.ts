import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const files = data.getAll('files') as File[];
    const singleFile = data.get('file') as File;
    const uploadType = data.get('uploadType') as string || data.get('type') as string;

    const filesToProcess = files.length > 0 ? files : (singleFile ? [singleFile] : []);
    
    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    let allowedTypes: string[];
    let maxSize: number;
    
    if (uploadType === 'uploads') {
      allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ];
      maxSize = 3 * 1024 * 1024;
    } else if (uploadType === 'admin_uploads') {
      allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ];
      maxSize = 10 * 1024 * 1024;
    } else {
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      maxSize = 5 * 1024 * 1024;
    }

    let uploadSubDir = 'uploads';
    if (uploadType === 'general') {
      uploadSubDir = 'general';
    }

    const uploadsDir = path.join(process.cwd(), 'public', uploadSubDir);
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
    }

    const uploadedFiles = [];
    
    for (const file of filesToProcess) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type for ${file.name}. Only ${(uploadType === 'uploads' || uploadType === 'admin_uploads') ? 'images and PDF files' : 'images'} are allowed.` },
          { status: 400 }
        );
      }

      if (file.size > maxSize) {
        const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum ${maxSizeMB}MB allowed.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileExtension = path.extname(file.name);
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now().toString();
      const hash = crypto.createHash('sha256').update(`${file.name}${timestamp}${randomBytes}`).digest('hex');
      const encryptedFilename = `${hash.substring(0, 16)}${fileExtension}`;
      const filepath = path.join(uploadsDir, encryptedFilename);

      await writeFile(filepath, buffer);

      uploadedFiles.push({
        originalName: file.name,
        encryptedName: encryptedFilename,
        fileUrl: `/${uploadSubDir}/${encryptedFilename}`,
        fileSize: file.size,
        mimeType: file.type
      });
    }

    if (filesToProcess.length === 1) {
      const fileInfo = uploadedFiles[0];
      return NextResponse.json({
        success: true,
        fileUrl: fileInfo.fileUrl,
        filePath: fileInfo.fileUrl,
        originalName: fileInfo.originalName,
        encryptedName: fileInfo.encryptedName,
        fileSize: fileInfo.fileSize,
        mimeType: fileInfo.mimeType,
        message: 'File uploaded successfully'
      });
    } else {
      return NextResponse.json({
        success: true,
        files: uploadedFiles,
        filePaths: uploadedFiles.map(f => f.fileUrl),
        message: `${uploadedFiles.length} files uploaded successfully`
      });
    }

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
