declare module "gif-encoder-2" {
  export default class GIFEncoder {
    constructor(width: number, height: number, algorithm?: string, useOptimizer?: boolean, totalFrames?: number);
    setDelay(milliseconds: number): void;
    setRepeat(repeat: number): void;
    setQuality(quality: number): void;
    start(): void;
    finish(): void;
    abort(): void;
    addFrame(input: Uint8Array): void;
    createReadStream(): NodeJS.ReadableStream;
  }
}
