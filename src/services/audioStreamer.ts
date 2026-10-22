/**
 * AudioStreamer manages gapless playback of 24kHz PCM16 audio chunks
 * streamed from Gemini Live API, with instant interruption handling and
 * real-time frequency analysis.
 */
export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private onSpeakingChange?: (isSpeaking: boolean) => void;
  private checkSpeakingInterval: any = null;
  private isCurrentlySpeaking: boolean = false;

  constructor(onSpeakingChange?: (isSpeaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  public async initialize(): Promise<void> {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.nextStartTime = this.audioCtx.currentTime;
    this.startSpeakingMonitor();
  }

  public setVolume(volume: number): void {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioCtx.currentTime);
    }
  }

  public addPCMChunk(base64Chunk: string): void {
    if (!this.audioCtx || !this.analyser) {
      console.warn('[AudioStreamer] AudioContext not initialized yet');
      return;
    }

    try {
      // Decode base64 to binary
      const binaryString = atob(base64Chunk);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert little-endian 16-bit PCM bytes to Float32 [-1, 1]
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create AudioBuffer at 24000Hz (native Gemini Live output rate)
      const buffer = this.audioCtx.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);

      // Create BufferSourceNode
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser);

      // Precise gapless scheduling
      const startTime = Math.max(this.audioCtx.currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;

      this.activeSources.push(source);

      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };

      if (!this.isCurrentlySpeaking) {
        this.isCurrentlySpeaking = true;
        this.onSpeakingChange?.(true);
      }
    } catch (err) {
      console.error('[AudioStreamer] Error processing audio chunk:', err);
    }
  }

  /**
   * Immediately stops all currently playing audio and clears the buffer.
   * Crucial for conversational responsiveness when the user interrupts Zoya.
   */
  public stop(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might have already finished
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }

    if (this.isCurrentlySpeaking) {
      this.isCurrentlySpeaking = false;
      this.onSpeakingChange?.(false);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getVolumeLevel(): number {
    if (!this.analyser) return 0;
    const data = this.getFrequencyData();
    if (data.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length / 255;
  }

  private startSpeakingMonitor(): void {
    if (this.checkSpeakingInterval) clearInterval(this.checkSpeakingInterval);
    this.checkSpeakingInterval = setInterval(() => {
      if (!this.audioCtx) return;
      const isStillSpeaking = this.audioCtx.currentTime < this.nextStartTime || this.activeSources.length > 0;
      if (isStillSpeaking !== this.isCurrentlySpeaking) {
        this.isCurrentlySpeaking = isStillSpeaking;
        this.onSpeakingChange?.(isStillSpeaking);
      }
    }, 100);
  }

  public close(): void {
    this.stop();
    if (this.checkSpeakingInterval) {
      clearInterval(this.checkSpeakingInterval);
      this.checkSpeakingInterval = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
