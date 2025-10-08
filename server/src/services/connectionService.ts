import { Request, Response } from 'express';
import net from 'net';
import dgram from 'dgram';

export async function testConnectionHandler(req: Request, res: Response) {
  const { ip, port } = req.body as { ip?: string; port?: number };
  if (!ip) return res.status(400).json({ ok: false, error: 'ip required' });
  const targetPort = port || 8899;

  try {
    const ok = await testTcp(ip, targetPort, 3000);
    return res.json({ ok });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

function testTcp(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (result: boolean) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch {}
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, ip);
  });
}

export async function smartConfigHandler(req: Request, res: Response) {
  const { ssid, password, port, repeats, intervalMs } = req.body as {
    ssid?: string; password?: string; port?: number; repeats?: number; intervalMs?: number;
  };
  if (!ssid || !password) return res.status(400).json({ ok: false, error: 'ssid and password required' });
  const broadcastPort = port || 7001;
  const count = Math.min(Math.max(repeats ?? 20, 1), 200);
  const delay = Math.min(Math.max(intervalMs ?? 200, 50), 2000);

  const payload = Buffer.from(JSON.stringify({ type: 'SMARTCONFIG', ssid, password }));
  try {
    await udpBroadcast(payload, broadcastPort, count, delay);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

function udpBroadcast(payload: Buffer, port: number, repeats: number, intervalMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    socket.once('error', (err) => { try { socket.close(); } catch {}; reject(err); });

    socket.bind(() => {
      try { socket.setBroadcast(true); } catch {}
      let sent = 0;
      const tick = () => {
        socket.send(payload, 0, payload.length, port, '255.255.255.255', (err) => {
          if (err) {
            try { socket.close(); } catch {}
            return reject(err);
          }
          sent += 1;
          if (sent >= repeats) {
            try { socket.close(); } catch {}
            return resolve();
          }
          setTimeout(tick, intervalMs);
        });
      };
      tick();
    });
  });
}
