"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnectionHandler = testConnectionHandler;
exports.smartConfigHandler = smartConfigHandler;
const net_1 = __importDefault(require("net"));
const dgram_1 = __importDefault(require("dgram"));
async function testConnectionHandler(req, res) {
    const { ip, port } = req.body;
    if (!ip)
        return res.status(400).json({ ok: false, error: 'ip required' });
    const targetPort = port || 8899;
    try {
        const ok = await testTcp(ip, targetPort, 3000);
        return res.json({ ok });
    }
    catch (e) {
        return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
}
function testTcp(ip, port, timeoutMs) {
    return new Promise((resolve) => {
        const socket = new net_1.default.Socket();
        let done = false;
        const finish = (result) => {
            if (done)
                return;
            done = true;
            try {
                socket.destroy();
            }
            catch { }
            resolve(result);
        };
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
        socket.connect(port, ip);
    });
}
async function smartConfigHandler(req, res) {
    const { ssid, password, port, repeats, intervalMs } = req.body;
    if (!ssid || !password)
        return res.status(400).json({ ok: false, error: 'ssid and password required' });
    const broadcastPort = port || 7001;
    const count = Math.min(Math.max(repeats ?? 20, 1), 200);
    const delay = Math.min(Math.max(intervalMs ?? 200, 50), 2000);
    const payload = Buffer.from(JSON.stringify({ type: 'SMARTCONFIG', ssid, password }));
    try {
        await udpBroadcast(payload, broadcastPort, count, delay);
        return res.json({ ok: true });
    }
    catch (e) {
        return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
}
function udpBroadcast(payload, port, repeats, intervalMs) {
    return new Promise((resolve, reject) => {
        const socket = dgram_1.default.createSocket('udp4');
        socket.once('error', (err) => { try {
            socket.close();
        }
        catch { } ; reject(err); });
        socket.bind(() => {
            try {
                socket.setBroadcast(true);
            }
            catch { }
            let sent = 0;
            const tick = () => {
                socket.send(payload, 0, payload.length, port, '255.255.255.255', (err) => {
                    if (err) {
                        try {
                            socket.close();
                        }
                        catch { }
                        return reject(err);
                    }
                    sent += 1;
                    if (sent >= repeats) {
                        try {
                            socket.close();
                        }
                        catch { }
                        return resolve();
                    }
                    setTimeout(tick, intervalMs);
                });
            };
            tick();
        });
    });
}
