import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique timestamp
    const originalName = file.name || 'upload';
    const ext = path.extname(originalName) || '.jpg';
    const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${Date.now()}_${cleanBase}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      localPath: filePath,
      filename: originalName,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
