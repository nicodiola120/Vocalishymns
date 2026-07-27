import { Directory, Filesystem } from "@capacitor/filesystem";

const AUDIO_DIR = "choralis-audio";

async function ensureDir(hymnId: string): Promise<string> {
  const dir = `${AUDIO_DIR}/${hymnId}`;
  try {
    await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true });
  } catch {
    // already exists
  }
  return dir;
}

export async function saveVoiceAudio(hymnId: string, voiceId: string, data: ArrayBuffer): Promise<boolean> {
  try {
    const dir = await ensureDir(hymnId);
    const bytes = new Uint8Array(data);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    await Filesystem.writeFile({
      path: `${dir}/${voiceId}.bin`,
      data: b64,
      directory: Directory.Data,
    });
    return true;
  } catch (e) {
    console.warn(`[AudioStorage] Failed to save voice ${voiceId}:`, e);
    return false;
  }
}

export async function loadVoiceAudio(hymnId: string, voiceId: string): Promise<ArrayBuffer | null> {
  try {
    const dir = `${AUDIO_DIR}/${hymnId}`;
    const result = await Filesystem.readFile({
      path: `${dir}/${voiceId}.bin`,
      directory: Directory.Data,
    });
    const b64 = result.data as string;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  } catch (e) {
    console.warn(`[AudioStorage] Failed to load voice ${voiceId}:`, e);
    return null;
  }
}

export async function deleteVoiceAudio(hymnId: string): Promise<void> {
  try {
    const dir = `${AUDIO_DIR}/${hymnId}`;
    await Filesystem.rmdir({ path: dir, directory: Directory.Data, recursive: true });
  } catch {
    // ignore
  }
}

export async function persistHymnAudio(hymn: { id: string; voices: { id: string; audioData?: ArrayBuffer }[] }): Promise<void> {
  for (const v of hymn.voices) {
    if (v.audioData && v.audioData.byteLength > 0) {
      await saveVoiceAudio(hymn.id, v.id, v.audioData);
    }
  }
}
