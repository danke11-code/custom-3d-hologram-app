"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMediaHandler = convertMediaHandler;
exports.getJobsHandler = getJobsHandler;
exports.downloadBinHandler = downloadBinHandler;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const jimp_1 = __importDefault(require("jimp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default || 'ffmpeg');
const ROOT_DIR = path_1.default.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path_1.default.join(ROOT_DIR, 'output');
const TMP_DIR = path_1.default.join(ROOT_DIR, 'tmp');
if (!fs_1.default.existsSync(OUTPUT_DIR))
    fs_1.default.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs_1.default.existsSync(TMP_DIR))
    fs_1.default.mkdirSync(TMP_DIR, { recursive: true });
const jobs = {};
function hashFile(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto_1.default.createHash('sha256');
        const stream = fs_1.default.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}
function getCachePath(originalName, settings, fileHash) {
    const base = path_1.default.parse(originalName).name;
    const settingsKey = `${settings.fps}-${settings.brightness}-${settings.rotation ?? 0}`;
    return path_1.default.join(OUTPUT_DIR, `${base}-${settingsKey}-${fileHash.slice(0, 8)}.bin`);
}
async function resizeAndSerializeImage(img, settings) {
    const size = 768;
    const working = img.clone ? img.clone() : img;
    const rotation = (settings.rotation ?? 0) % 360;
    if (rotation !== 0 && typeof working.rotate === 'function') {
        working.rotate(rotation);
    }
    if (typeof working.resize === 'function') {
        working.resize(size, size);
    }
    const pixels = [];
    const brightness = Math.max(0, Math.min(255, settings.brightness));
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const rgbaInt = working.getPixelColor(x, y);
            const rgba = jimp_1.default.intToRGBA ? jimp_1.default.intToRGBA(rgbaInt) : {
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
async function framesToBin(frames, settings) {
    const header = Buffer.alloc(2);
    header.writeUInt16LE(0xAA55, 0);
    const frameCount = Buffer.alloc(2);
    frameCount.writeUInt16LE(frames.length, 0);
    const fps = Buffer.from([Math.max(1, Math.min(255, settings.fps))]);
    const pixelBuffers = [];
    for (const frame of frames) {
        const buf = await resizeAndSerializeImage(frame, settings);
        pixelBuffers.push(buf);
    }
    return Buffer.concat([header, frameCount, fps, ...pixelBuffers]);
}
async function extractFramesFromVideo(videoPath, fps) {
    const framesDir = path_1.default.join(TMP_DIR, `frames-${(0, uuid_1.v4)()}`);
    fs_1.default.mkdirSync(framesDir, { recursive: true });
    await new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .outputOptions(['-vf', `fps=${fps}`])
            .output(path_1.default.join(framesDir, 'frame-%07d.png'))
            .on('end', () => resolve())
            .on('error', reject)
            .run();
    });
    const files = fs_1.default.readdirSync(framesDir).filter(f => f.startsWith('frame-') && f.endsWith('.png'));
    files.sort();
    const images = [];
    for (const f of files) {
        const image = await jimp_1.default.read(path_1.default.join(framesDir, f));
        images.push(image);
    }
    // cleanup frames
    fs_1.default.rmSync(framesDir, { recursive: true, force: true });
    return images;
}
async function convertFile(filePath, originalName, settings) {
    const fileHash = await hashFile(filePath);
    const cachePath = getCachePath(originalName, settings, fileHash);
    if (fs_1.default.existsSync(cachePath)) {
        return cachePath;
    }
    const ext = path_1.default.extname(originalName).toLowerCase();
    let frames = [];
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
        const image = await jimp_1.default.read(filePath);
        frames = [image];
    }
    else if (ext === '.mp4' || ext === '.mov' || ext === '.avi' || ext === '.mkv' || ext === '.webm') {
        frames = await extractFramesFromVideo(filePath, settings.fps);
    }
    else {
        throw new Error(`Unsupported file type: ${ext}`);
    }
    const bin = await framesToBin(frames, settings);
    fs_1.default.writeFileSync(cachePath, bin);
    return cachePath;
}
async function convertMediaHandler(req, res) {
    const files = req.files || [];
    const settings = {
        fps: Number(req.body.fps) || 24,
        brightness: Number(req.body.brightness) || 255,
        rotation: Number(req.body.rotation) || 0,
        compression: Number(req.body.compression) || 0
    };
    const jobIds = [];
    for (const file of files) {
        const id = (0, uuid_1.v4)();
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
                jobs[id].resultFilename = path_1.default.basename(outPath);
                jobs[id].status = 'done';
                jobs[id].progress = 100;
            }
            catch (err) {
                jobs[id].status = 'error';
                jobs[id].error = String(err?.message || err);
            }
            finally {
                // cleanup temp upload
                fs_1.default.rmSync(file.path, { force: true });
            }
        })();
    }
    res.json({ jobIds });
}
function getJobsHandler(_req, res) {
    res.json({ jobs: Object.values(jobs) });
}
function downloadBinHandler(req, res) {
    const { filename } = req.params;
    const fullPath = path_1.default.join(OUTPUT_DIR, filename);
    if (!fs_1.default.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.download(fullPath);
}
