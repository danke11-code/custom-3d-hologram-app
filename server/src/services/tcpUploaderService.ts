import { Request, Response } from 'express';
import fs from 'fs';
import net from 'net';
import path from 'path';

const OUTPUT_DIR = path.join(path.resolve(__dirname, '..', '..'), 'output');

export async function uploadBinsHandler(req: Request, res: Response) {
  const { ip, port, files } = req.body as { ip: string; port?: number; files: string[] };
  if (!ip || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'ip and files[] required' });
  }
  const uploadPort = port || 8899;

  try {
    for (const filename of files) {
      const filePath = path.join(OUTPUT_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `File not found: ${filename}` });
      }
      await sendFile(ip, uploadPort, filePath);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}

function sendFile(ip: string, port: number, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.connect(port, ip, () => {
      const stream = fs.createReadStream(filePath);
      stream.pipe(socket);
      stream.on('end', () => {
        socket.end();
      });
    });
    socket.on('error', reject);
    socket.on('close', () => resolve());
  });
}
