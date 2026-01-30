import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';

type MediaItem =
  | { type: 'folder'; path: string; name: string }
  | { type: 'file'; url: string; name: string; path: string; size: number; mimeType: string };

async function getMediaItemsInDir(dir: string, basePath: string): Promise<MediaItem[]> {
  const results: MediaItem[] = [];
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const normalizedPath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        results.push({
          type: 'folder',
          path: normalizedPath,
          name: entry.name,
        });
      } else if (entry.isFile()) {
        const stats = await stat(fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        const url = `/${normalizedPath}`;
        results.push({
          type: 'file',
          url,
          name: entry.name,
          path: normalizedPath,
          size: stats.size,
          mimeType: mimeTypes[ext] || 'application/octet-stream',
        });
      }
    }
  } catch (error) {
    console.error('Error reading directory:', dir, error);
  }

  return results;
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role || 'user';
    const userPermissions = (session.user as { permissions?: string[] })?.permissions;
    const routePath = '/admin/media';

    if (!hasPermission(userRole, userPermissions, routePath)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pathParam = searchParams.get('path') || '';
    const normalizedPath = pathParam.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = normalizedPath ? path.join(publicDir, normalizedPath) : publicDir;
    const resolvedDir = path.resolve(targetDir);
    if (!resolvedDir.startsWith(path.resolve(publicDir))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const mediaItems = await getMediaItemsInDir(targetDir, normalizedPath);

    return NextResponse.json({
      success: true,
      data: mediaItems,
      path: normalizedPath,
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
