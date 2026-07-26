import { Mp3Encoder } from "@breezystack/lamejs";

export async function encodeMp3(audioData: ArrayBuffer): Promise<ArrayBuffer> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const decoded = await ctx.decodeAudioData(audioData.slice(0));
    const numChannels = decoded.numberOfChannels;
    const sampleRate = decoded.sampleRate;
    const bitrate = 192;

    const mp3encoder = new Mp3Encoder(numChannels, sampleRate, bitrate);
    const mp3Data: Uint8Array[] = [];

    const blockSize = 1152;
    const left = decoded.getChannelData(0);
    const right = numChannels > 1 ? decoded.getChannelData(1) : left;

    for (let i = 0; i < left.length; i += blockSize) {
      const leftBlock = left.subarray(i, i + blockSize);
      const rightBlock = right.subarray(i, i + blockSize);

      const leftInt16 = floatTo16BitPCM(leftBlock);
      const rightInt16 = floatTo16BitPCM(rightBlock);

      let mp3buf: Uint8Array;
      if (numChannels === 1) {
        mp3buf = mp3encoder.encodeBuffer(leftInt16);
      } else {
        mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16);
      }
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const end = mp3encoder.flush();
    if (end.length > 0) {
      mp3Data.push(end);
    }

    return concatUint8Arrays(mp3Data);
  } finally {
    ctx.close();
  }
}

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

function concatUint8Arrays(arrays: Uint8Array[]): ArrayBuffer {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result.buffer;
}
