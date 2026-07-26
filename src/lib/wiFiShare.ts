import { Filesystem, Directory } from '@capacitor/filesystem';
import { Hymn } from '../types';

const PLUGIN_NAME = 'WiFiShare';

export interface PeerDevice {
  id: string;
  name: string;
  ip: string;
  port: number;
}

export interface TransferRequest {
  requestId: string;
  from: string;
  fromId: string;
  hymnName: string;
  filePath: string;
}

type ListenerId = string;

const listeners = new Map<string, Map<ListenerId, (data: any) => void>>();
const nativeHandles = new Map<string, { remove: () => void }[]>();

let listenerCounter = 0;

function getPlugin() {
  try {
    const cap = (window as any).Capacitor;
    return cap?.Plugins?.[PLUGIN_NAME] || null;
  } catch {
    return null;
  }
}

function isNative(): boolean {
  try {
    const cap = (window as any).Capacitor;
    return cap ? cap.isNativePlatform() : false;
  } catch {
    return false;
  }
}

function addEventListener(eventName: string, callback: (data: any) => void): ListenerId {
  const id = `l_${++listenerCounter}`;
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Map());
  }
  listeners.get(eventName)!.set(id, callback);

  if (isNative()) {
    const plugin = getPlugin();
    if (plugin?.addListener) {
      const handle = plugin.addListener(eventName, (data: any) => {
        const cbs = listeners.get(eventName);
        if (cbs) {
          cbs.forEach(cb => cb(data));
        }
      });
      if (!nativeHandles.has(eventName)) {
        nativeHandles.set(eventName, []);
      }
      nativeHandles.get(eventName)!.push(handle);
    }
  }

  return id;
}

function removeEventListener(eventName: string, id: ListenerId): void {
  const cbs = listeners.get(eventName);
  if (cbs) {
    cbs.delete(id);
    if (cbs.size === 0) {
      listeners.delete(eventName);
      const handles = nativeHandles.get(eventName);
      if (handles) {
        handles.forEach(h => h.remove());
        nativeHandles.delete(eventName);
      }
    }
  }
}

async function callPluginMethod(method: string, options?: Record<string, any>): Promise<any> {
  if (!isNative()) {
    return mockCall(method, options);
  }
  try {
    const plugin = getPlugin();
    if (!plugin) throw new Error('Plugin not found');
    return await plugin[method](options || {});
  } catch {
    return mockCall(method, options);
  }
}

function mockCall(method: string, options?: Record<string, any>): any {
  switch (method) {
    case 'startListening':
      return { ip: '192.168.1.100', port: 4876 };
    case 'stopListening':
      return {};
    case 'getPeers':
      return { peers: [] };
    case 'sendFile':
      return { status: 'sent' };
    case 'acceptFile':
      return { filePath: options?.filePath || '' };
    case 'declineFile':
      return {};
    default:
      return {};
  }
}

export const WiFiShare = {
  async startListening(deviceName: string): Promise<{ ip: string; port: number }> {
    return callPluginMethod('startListening', { deviceName });
  },

  async stopListening(): Promise<void> {
    return callPluginMethod('stopListening');
  },

  async getPeers(): Promise<PeerDevice[]> {
    const result = await callPluginMethod('getPeers');
    return result.peers || [];
  },

  async sendFile(peer: PeerDevice, filePath: string, hymnName: string): Promise<void> {
    await callPluginMethod('sendFile', {
      peerIp: peer.ip,
      peerPort: peer.port,
      filePath,
      hymnName,
    });
  },

  async acceptFile(requestId: string, filePath: string, hymnName: string): Promise<string> {
    const result = await callPluginMethod('acceptFile', {
      requestId,
      filePath,
      hymnName,
    });
    return result.filePath || '';
  },

  async declineFile(filePath: string): Promise<void> {
    await callPluginMethod('declineFile', { filePath });
  },

  getHymnZipPath(hymnName: string, folderName: string = 'My Hymns'): string {
    const zipFileName = hymnName
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase() + '.zip';
    return `VocalisLibrary/${folderName}/${zipFileName}`;
  },

  getHymnFilePath(hymn: Hymn): string {
    const folderName = 'My Hymns';
    if (hymn.zipFile) {
      return `VocalisLibrary/${folderName}/${hymn.zipFile}`;
    }
    return WiFiShare.getHymnZipPath(hymn.name, folderName);
  },

  isSupported(): boolean {
    return isNative();
  },

  onPeerFound(callback: (peer: PeerDevice) => void): ListenerId {
    return addEventListener('peerFound', callback);
  },

  onPeerLost(callback: (peerId: string) => void): ListenerId {
    return addEventListener('peerLost', (data) => callback(data.id));
  },

  onTransferRequest(callback: (req: TransferRequest) => void): ListenerId {
    return addEventListener('transferRequest', callback);
  },

  onError(callback: (message: string) => void): ListenerId {
    return addEventListener('serverError', (data) => callback(data.message));
  },

  removeListener(eventName: string, id: ListenerId): void {
    removeEventListener(eventName, id);
  },
};