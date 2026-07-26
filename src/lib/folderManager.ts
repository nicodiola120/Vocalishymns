import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';

const HANDLE_KEY = "vocalis_folder_handle";
const CAPACITOR_FOLDER_KEY = "vocalis_capacitor_folder";
const CAPACITOR_FOLDER_PATH_KEY = "vocalis_capacitor_folder_path";
const CAPACITOR_SUBFOLDER = "VocalisLibrary";

declare global {
  interface Window {
    electronFS?: {
      isElectron: boolean;
      pickFolder: () => Promise<{ path: string; name: string } | null>;
      pickZipFiles: () => Promise<{ name: string; buffer: ArrayBuffer }[]>;
      pickAudioFile: () => Promise<{ name: string; buffer: ArrayBuffer } | null>;
      pickPdfFile: () => Promise<{ name: string; buffer: ArrayBuffer } | null>;
      listFiles: (dirPath: string) => Promise<{ name: string; isDir: boolean }[]>;
      readFile: (filePath: string) => Promise<ArrayBuffer>;
      writeFile: (filePath: string, data: ArrayBuffer) => Promise<void>;
      deleteFile: (filePath: string) => Promise<void>;
      ensureDir: (dirPath: string) => Promise<void>;
      getStoredPath: () => Promise<string | null>;
      setStoredPath: (dirPath: string) => Promise<void>;
      saveZip: (defaultName: string, data: ArrayBuffer) => Promise<string | null>;
    };
  }
}

export function isElectronPlatform(): boolean {
  return !!(window as any).electronFS?.isElectron;
}

export function isNativePlatform(): boolean {
  if (isElectronPlatform()) return false;
  return Capacitor.isNativePlatform();
}

export async function pickFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (isElectronPlatform()) return pickFolderElectron();
  if (isNativePlatform()) {
    return pickFolderNative();
  }
  return pickFolderWeb();
}

export async function pickZipFiles(): Promise<File[]> {
  if (isElectronPlatform()) return pickZipFilesElectron();
  if (!isNativePlatform()) {
    return pickZipFilesWeb();
  }
  return pickZipFilesNative();
}

async function pickZipFilesNative(): Promise<File[]> {
  try {
    const result = await FilePicker.pickFiles({
      types: ["application/zip"],
      limit: 0,
      readData: true,
    });
    return result.files.map((f) => {
      const byteString = atob(f.data || "");
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        bytes[i] = byteString.charCodeAt(i);
      }
      return new File([bytes], f.name, { type: "application/zip" });
    });
  } catch (err: any) {
    if (err.message?.includes("canceled") || err.message?.includes("Canceled")) return [];
    throw err;
  }
}

// ── Electron File System Wrappers ─────────────────────────────

class ElectronWritableStream implements FileSystemWritableFileStream {
  private path: string;
  private chunks: (ArrayBuffer | Blob | string)[] = [];
  locked = false;

  constructor(filePath: string) {
    this.path = filePath;
  }

  async write(data: BufferSource | Blob | string): Promise<void> {
    if (typeof data === "string") {
      this.chunks.push(data);
    } else if (data instanceof Blob) {
      this.chunks.push(data);
    } else {
      const ab = data instanceof ArrayBuffer ? data : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      this.chunks.push(ab);
    }
  }

  async seek(_position: number): Promise<void> {}

  async truncate(_size?: number): Promise<void> {}

  getWriter(): WritableStreamDefaultWriter<any> {
    throw new Error("getWriter not supported");
  }

  async close(): Promise<void> {
    const parts: Uint8Array[] = [];
    for (const chunk of this.chunks) {
      if (typeof chunk === "string") {
        parts.push(new TextEncoder().encode(chunk));
      } else if (chunk instanceof Blob) {
        const buf = await chunk.arrayBuffer();
        parts.push(new Uint8Array(buf));
      } else {
        parts.push(new Uint8Array(chunk));
      }
    }
    const totalSize = parts.reduce((acc, p) => acc + p.length, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const part of parts) {
      combined.set(part, offset);
      offset += part.length;
    }
    await window.electronFS!.writeFile(this.path, combined.buffer);
  }

  abort(): Promise<void> {
    this.chunks = [];
    return Promise.resolve();
  }

  releaseLock(): void {}
}

class ElectronFileHandle {
  kind: "file" = "file";
  name: string;
  private fullPath: string;

  constructor(filePath: string) {
    this.fullPath = filePath;
    this.name = filePath.split(/[\\/]/).pop() || filePath;
  }

  async getFile(): Promise<File> {
    const buffer = await window.electronFS!.readFile(this.fullPath);
    return new File([new Uint8Array(buffer)], this.name, { type: "application/zip" });
  }

  async createWritable(): Promise<ElectronWritableStream> {
    return new ElectronWritableStream(this.fullPath);
  }

  async isSameEntry(other: ElectronFileHandle): Promise<boolean> {
    return this.fullPath === other.fullPath;
  }
}

class ElectronDirectoryHandle {
  kind: "directory" = "directory";
  name: string;
  private basePath: string;

  constructor(dirPath: string) {
    this.basePath = dirPath;
    this.name = dirPath.split(/[\\/]/).pop() || "Folder";
  }

  async *entries(): AsyncIterableIterator<[string, FileSystemHandle]> {
    const entries = await window.electronFS!.listFiles(this.basePath);
    for (const entry of entries) {
      const entryPath = `${this.basePath}\\${entry.name}`;
      const handle = entry.isDir
        ? new ElectronDirectoryHandle(entryPath)
        : new ElectronFileHandle(entryPath);
      yield [entry.name, handle as unknown as FileSystemHandle];
    }
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<ElectronFileHandle> {
    const filePath = `${this.basePath}\\${name}`;
    return new ElectronFileHandle(filePath);
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<ElectronDirectoryHandle> {
    const dirPath = `${this.basePath}\\${name}`;
    if (options?.create) {
      await window.electronFS!.ensureDir(dirPath);
    }
    return new ElectronDirectoryHandle(dirPath);
  }

  async removeEntry(name: string): Promise<void> {
    const filePath = `${this.basePath}\\${name}`;
    await window.electronFS!.deleteFile(filePath);
  }

  async isSameEntry(other: ElectronDirectoryHandle): Promise<boolean> {
    return this.basePath === other.basePath;
  }

  async resolve(possibleDescendant: ElectronFileHandle | ElectronDirectoryHandle): Promise<string[]> {
    const descendantPath = (possibleDescendant as any).fullPath || (possibleDescendant as any).basePath;
    if (!descendantPath || !descendantPath.startsWith(this.basePath)) return [];
    const relative = descendantPath.slice(this.basePath.length + 1);
    return relative.split(/[\\/]/);
  }

  getDirectoryHandle2(): never {
    throw new Error("not implemented");
  }
}

async function pickFolderElectron(): Promise<FileSystemDirectoryHandle | null> {
  const result = await window.electronFS!.pickFolder();
  if (!result) return null;
  return new ElectronDirectoryHandle(result.path) as unknown as FileSystemDirectoryHandle;
}

async function pickZipFilesElectron(): Promise<File[]> {
  const files = await window.electronFS!.pickZipFiles();
  return files.map((f) => new File([new Uint8Array(f.buffer)], f.name, { type: "application/zip" }));
}

export async function pickAudioFile(): Promise<File | null> {
  if (!isElectronPlatform()) return null;
  const result = await window.electronFS!.pickAudioFile();
  if (!result) return null;
  return new File([new Uint8Array(result.buffer)], result.name);
}

export async function pickPdfFile(): Promise<{ name: string; data: ArrayBuffer } | null> {
  if (!isElectronPlatform()) return null;
  const result = await window.electronFS!.pickPdfFile();
  if (!result) return null;
  return { name: result.name, data: result.buffer.buffer.slice(result.buffer.byteOffset, result.buffer.byteOffset + result.buffer.byteLength) };
}

export async function saveZipToFile(defaultName: string, data: ArrayBuffer): Promise<string | null> {
  if (!isElectronPlatform()) return null;
  return window.electronFS!.saveZip(defaultName, data);
}

async function pickZipFilesWeb(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip,application/zip";
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      resolve(files);
    };
    input.oncancel = () => resolve([]);
    input.click();
  });
}

async function pickFolderNative(): Promise<FileSystemDirectoryHandle | null> {
  const folderName = "My Hymns";
  try {
    await Filesystem.mkdir({
      path: `${CAPACITOR_SUBFOLDER}/${folderName}`,
      directory: Directory.Documents,
      recursive: true,
    });
  } catch {}
  localStorage.setItem(CAPACITOR_FOLDER_KEY, folderName);
  return createNativeHandle(folderName);
}

async function pickFolderWeb(): Promise<FileSystemDirectoryHandle | null> {
  if (!("showDirectoryPicker" in window)) {
    throw new Error(
      "Folder selection requires Chrome, Edge, or the desktop app."
    );
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    await persistHandle(handle);
    return handle;
  } catch (err: any) {
    if (err.name === "AbortError") return null;
    throw err;
  }
}

function createNativeHandle(name: string): NativeDirectoryHandle {
  return new NativeDirectoryHandle(name);
}

class NativePathHandle {
  kind: "directory" = "directory";
  name: string;
  private basePath: string;

  constructor(path: string) {
    this.name = path.split("/").pop() || "Folder";
    this.basePath = path;
  }

  async *entries(): AsyncIterableIterator<[string, FileSystemHandle]> {
    try {
      const result = await Filesystem.readdir({
        path: this.basePath,
        directory: Directory.ExternalStorage,
      });
      for (const entry of result.files) {
        const entryPath = `${this.basePath}/${entry.name}`;
        const isDir = entry.type === "directory";
        const handle = isDir
          ? new NativePathHandle(entryPath)
          : new NativeFileHandle(entryPath);
        yield [entry.name, handle as unknown as FileSystemHandle];
      }
    } catch {
      // Directory doesn't exist yet
    }
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<NativeFileHandle> {
    return new NativeFileHandle(`${this.basePath}/${name}`);
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<NativePathHandle> {
    const dirPath = `${this.basePath}/${name}`;
    if (options?.create) {
      await Filesystem.mkdir({
        path: dirPath,
        directory: Directory.ExternalStorage,
        recursive: true,
      });
    }
    return new NativePathHandle(dirPath);
  }

  async removeEntry(name: string): Promise<void> {
    await Filesystem.deleteFile({
      path: `${this.basePath}/${name}`,
      directory: Directory.ExternalStorage,
    });
  }
}

class NativeDirectoryHandle {
  kind: "directory" = "directory";
  name: string;
  private basePath: string;

  constructor(name: string) {
    this.name = name;
    this.basePath = `${CAPACITOR_SUBFOLDER}/${name}`;
  }

  async *entries(): AsyncIterableIterator<[string, FileSystemHandle]> {
    try {
      const result = await Filesystem.readdir({
        path: this.basePath,
        directory: Directory.Documents,
      });
      for (const entry of result.files) {
        const entryPath = `${this.basePath}/${entry.name}`;
        const isDir = entry.type === "directory";
        const handle = isDir
          ? new NativeDirectoryHandle(entry.name)
          : new NativeFileHandle(entryPath);
        yield [entry.name, handle as unknown as FileSystemHandle];
      }
    } catch {
      // Directory doesn't exist yet
    }
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<NativeFileHandle> {
    return new NativeFileHandle(`${this.basePath}/${name}`);
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<NativeDirectoryHandle> {
    if (options?.create) {
      await Filesystem.mkdir({
        path: `${this.basePath}/${name}`,
        directory: Directory.Documents,
        recursive: true,
      });
    }
    return new NativeDirectoryHandle(name);
  }

  async removeEntry(name: string): Promise<void> {
    await Filesystem.deleteFile({
      path: `${this.basePath}/${name}`,
      directory: Directory.Documents,
    });
  }
}

class NativeFileHandle {
  kind: "file" = "file";
  name: string;
  private fullPath: string;

  constructor(fullPath: string) {
    this.fullPath = fullPath;
    this.name = fullPath.split("/").pop() || fullPath;
  }

  async getFile(): Promise<File> {
    const result = await Filesystem.readFile({
      path: this.fullPath,
      directory: Directory.Documents,
    });

    const base64 = result.data as string;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new File([bytes], this.name, { type: "application/zip" });
  }

  async createWritable(): Promise<NativeWritableStream> {
    return new NativeWritableStream(this.fullPath);
  }
}

class NativeWritableStream {
  private path: string;
  private chunks: (ArrayBuffer | Blob | string)[] = [];

  constructor(path: string) {
    this.path = path;
  }

  async write(data: BufferSource | Blob | string): Promise<void> {
    this.chunks.push(data);
  }

  async close(): Promise<void> {
    const parts: Uint8Array[] = [];
    for (const chunk of this.chunks) {
      if (typeof chunk === "string") {
        const encoder = new TextEncoder();
        parts.push(encoder.encode(chunk));
      } else if (chunk instanceof Blob) {
        const buf = await chunk.arrayBuffer();
        parts.push(new Uint8Array(buf));
      } else {
        parts.push(new Uint8Array(chunk));
      }
    }

    const totalSize = parts.reduce((acc, p) => acc + p.length, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const part of parts) {
      combined.set(part, offset);
      offset += part.length;
    }

    const base64 = btoa(
      Array.from(combined)
        .map((b) => String.fromCharCode(b))
        .join("")
    );

    await Filesystem.writeFile({
      path: this.path,
      data: base64,
      directory: Directory.Documents,
      encoding: undefined as any,
    });
  }
}

export async function persistHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDB();
  const tx = db.transaction("handles", "readwrite");
  tx.objectStore("handles").put(handle, HANDLE_KEY);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (isElectronPlatform()) return getStoredHandleElectron();
  if (isNativePlatform()) {
    return getStoredHandleNative();
  }
  return getStoredHandleWeb();
}

async function getStoredHandleElectron(): Promise<FileSystemDirectoryHandle | null> {
  const dirPath = await window.electronFS!.getStoredPath();
  if (!dirPath) return null;
  return new ElectronDirectoryHandle(dirPath) as unknown as FileSystemDirectoryHandle;
}

async function getStoredHandleNative(): Promise<FileSystemDirectoryHandle | null> {
  const folderPath = localStorage.getItem(CAPACITOR_FOLDER_PATH_KEY);
  if (folderPath) {
    try {
      return createNativePathHandle(folderPath);
    } catch {
      return null;
    }
  }

  const folderName = localStorage.getItem(CAPACITOR_FOLDER_KEY);
  if (!folderName) return null;

  try {
    await Filesystem.mkdir({
      path: `${CAPACITOR_SUBFOLDER}/${folderName}`,
      directory: Directory.Documents,
      recursive: true,
    });
    return createNativeHandle(folderName);
  } catch {
    return null;
  }
}

async function getStoredHandleWeb(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction("handles", "readonly");
    const req = tx.objectStore("handles").get(HANDLE_KEY);
    const handle: FileSystemDirectoryHandle | undefined = await new Promise(
      (resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }
    );
    db.close();
    if (!handle) return null;
    const perm = await handle.requestPermission({ mode: "readwrite" });
    if (perm !== "granted") return null;
    return handle;
  } catch {
    return null;
  }
}

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("VocalisFolderHandles", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("handles")) {
        db.createObjectStore("handles");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listZipFiles(
  handle: FileSystemDirectoryHandle
): Promise<{ name: string; fileHandle: FileSystemFileHandle }[]> {
  const results: { name: string; fileHandle: FileSystemFileHandle }[] = [];
  for await (const [key, value] of handle.entries()) {
    if (
      value.kind === "file" &&
      key.toLowerCase().endsWith(".zip")
    ) {
      results.push({ name: key, fileHandle: value as unknown as FileSystemFileHandle });
    }
  }
  return results;
}

export async function writeZipToFolder(
  handle: FileSystemDirectoryHandle,
  fileName: string,
  data: ArrayBuffer
): Promise<void> {
  const zipName = fileName.toLowerCase().endsWith(".zip") ? fileName : `${fileName}.zip`;
  const fileHandle = await handle.getFileHandle(zipName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

export async function readZipFromFolder(
  fileHandle: FileSystemFileHandle
): Promise<File> {
  const file = await fileHandle.getFile();
  return file;
}

export async function deleteZipFromFolder(
  handle: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  const zipName = fileName.toLowerCase().endsWith(".zip") ? fileName : `${fileName}.zip`;
  await handle.removeEntry(zipName);
}

export async function getFolderName(
  handle: FileSystemDirectoryHandle
): Promise<string> {
  return handle.name;
}
