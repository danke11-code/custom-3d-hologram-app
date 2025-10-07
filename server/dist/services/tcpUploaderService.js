"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBinsHandler = uploadBinsHandler;
const fs_1 = __importDefault(require("fs"));
const net_1 = __importDefault(require("net"));
const path_1 = __importDefault(require("path"));
const OUTPUT_DIR = path_1.default.join(process.cwd(), 'server', 'output');
async function uploadBinsHandler(req, res) {
    const { ip, port, files } = req.body;
    if (!ip || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'ip and files[] required' });
    }
    const uploadPort = port || 8899;
    try {
        for (const filename of files) {
            const filePath = path_1.default.join(OUTPUT_DIR, filename);
            if (!fs_1.default.existsSync(filePath)) {
                return res.status(404).json({ error: `File not found: ${filename}` });
            }
            await sendFile(ip, uploadPort, filePath);
        }
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err?.message || err) });
    }
}
function sendFile(ip, port, filePath) {
    return new Promise((resolve, reject) => {
        const socket = new net_1.default.Socket();
        socket.connect(port, ip, () => {
            const stream = fs_1.default.createReadStream(filePath);
            stream.pipe(socket);
            stream.on('end', () => {
                socket.end();
            });
        });
        socket.on('error', reject);
        socket.on('close', () => resolve());
    });
}
