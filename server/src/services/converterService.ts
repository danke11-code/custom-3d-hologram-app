import { Request, Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

ffmpeg.setFfmpegPath((ffmpegStatic as unknown as string) || 'ffmpeg');

const OUTPUT_DIR = path.join(process.cwd(), 'server', 'output');
const TMP_DIR = path.join(process.cwd(), 'server', 'tmp');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

export type ConvertSettings = {
  fps: number;
  brightness: number; // 0-255 applied to RGB
  compression?: number; // reserved, not used in simple format
  rotation?: number; // degrees
};

type JobStatus = 'queued' | 'processing' | 'done' | 'error';

type Job = {
  id: string;
  filename: string;
  status: JobStatus;
  progress: number; // 0-100
  etaSeconds?: number;
  resultFilename?: string; // .bin filename
  error?: string;
};

const jobs: Record<string, Job> = {};

function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function getCachePath(originalName: string, settings: ConvertSettings, fileHash: string): string {
  const base = path.parse(originalName).name;
  const settingsKey = `${settings.fps}-${settings.brightness}-${settings.rotation ?? 0}`;
  return path.join(OUTPUT_DIR, `${base}-${settingsKey}-${fileHash.slice(0,8)}.bin`);
}

async function resizeAndSerializeImage(img: any, settings: ConvertSettings): Promise<Buffer> {
  const size = 768;
  const working = img.clone ? img.clone() : img;
  const rotation = (settings.rotation ?? 0) % 360;
  if (rotation !== 0 && typeof working.rotate === 'function') {
    working.rotate(rotation);
  }
  if (typeof working.resize === 'function') {
    working.resize(size, size);
  }
  const pixels: number[] = [];
  const brightness = Math.max(0, Math.min(255, settings.brightness));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const rgbaInt = working.getPixelColor(x, y);
      const rgba = (Jimp as any).intToRGBA ? (Jimp as any).intToRGBA(rgbaInt) : {
        r: (rgbaInt >> 24) & 0xff,
        g: (rgbaInt >> 16) & 0xff,
        b: (rgbaInt >> 8) & 0xff,
        a: rgbaInt & 0xff,
      };
      const r = rgba.r;
      const g = rgba.g;
      const b = rgba.b;
      // apply brightness scaling (simple clamp)
      const rb = Math.min(255, Math.round((r * brightness) / 255));
      const gb = Math.min(255, Math.round((g * brightness) / 255));
      const bb = Math.min(255, Math.round((b * brightness) / 255));
      pixels.push(rb, gb, bb);
    }
  }
  return Buffer.from(pixels);
}

async function framesToBin(frames: any[], settings: ConvertSettings): Promise<Buffer> {
  const header = Buffer.alloc(2);
  header.writeUInt16LE(0xAA55, 0);
  const frameCount = Buffer.alloc(2);
  frameCount.writeUInt16LE(frames.length, 0);
  const fps = Buffer.from([Math.max(1, Math.min(255, settings.fps))]);

  const pixelBuffers: Buffer[] = [];
  for (const frame of frames) {
    const buf = await resizeAndSerializeImage(frame, settings);
    pixelBuffers.push(buf);
  }
  return Buffer.concat([header, frameCount, fps, ...pixelBuffers]);
}

async function extractFramesFromVideo(videoPath: string, fps: number): Promise<any[]> {
  const framesDir = path.join(TMP_DIR, `frames-${uuidv4()}`);
  fs.mkdirSync(framesDir, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions(['-vf', `fps=${fps}`])
      .output(path.join(framesDir, 'frame-%07d.png'))
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });

  const files = fs.readdirSync(framesDir).filter(f => f.startsWith('frame-') && f.endsWith('.png'));
  files.sort();
  const images: any[] = [];
  for (const f of files) {
    const image = await (Jimp as any).read(path.join(framesDir, f));
    images.push(image);
  }
  // cleanup frames
  fs.rmSync(framesDir, { recursive: true, force: true });
  return images;
}

async function convertFile(filePath: string, originalName: string, settings: ConvertSettings): Promise<string> {
  const fileHash = await hashFile(filePath);
  const cachePath = getCachePath(originalName, settings, fileHash);
  if (fs.existsSync(cachePath)) {
    return cachePath;
  }

  const ext = path.extname(originalName).toLowerCase();
  let frames: any[] = [];
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
    const image = await (Jimp as any).read(filePath);
    frames = [image];
  } else if (ext === '.mp4' || ext === '.mov' || ext === '.avi' || ext === '.mkv' || ext === '.webm') {
    frames = await extractFramesFromVideo(filePath, settings.fps);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const bin = await framesToBin(frames, settings);
  fs.writeFileSync(cachePath, bin);
  return cachePath;
}

export async function convertMediaHandler(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[]) || [];
  const settings: ConvertSettings = {
    fps: Number(req.body.fps) || 24,
    brightness: Number(req.body.brightness) || 255,
    rotation: Number(req.body.rotation) || 0,
    compression: Number(req.body.compression) || 0
  };

  const jobIds: string[] = [];
  for (const file of files) {
    const id = uuidv4();
    jobs[id] = {
      id,
      filename: file.originalname,
      status: 'queued',
      progress: 0
    };
    jobIds.push(id);

    // process asynchronously
    (async () => {
      try {
        jobs[id].status = 'processing';
        jobs[id].progress = 5;
        const outPath = await convertFile(file.path, file.originalname, settings);
        jobs[id].progress = 95;
        jobs[id].resultFilename = path.basename(outPath);
        jobs[id].status = 'done';
        jobs[id].progress = 100;
      } catch (err: any) {
        jobs[id].status = 'error';
        jobs[id].error = String(err?.message || err);
      } finally {
        // cleanup temp upload
        fs.rmSync(file.path, { force: true });
      }
    })();
  }

  res.json({ jobIds });
}

export function getJobsHandler(_req: Request, res: Response) {
  res.json({ jobs: Object.values(jobs) });
}

export function downloadBinHandler(req: Request, res: Response) {
  const { filename } = req.params;
  const fullPath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.download(fullPath);
}
