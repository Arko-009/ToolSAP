// Web Audio API Procedural Sound Synthesizer for 404 Archive Experience
// 100% Zero-dependency, purely synthesized in-browser, no external audio files required.

class ArchiveSoundSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  constructor() {
    // Initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopDrone();
    } else {
      this.initContext();
      this.startDrone();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft ambient cosmic drone
  public startDrone() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.droneOsc1) return; // already playing

    try {
      const now = this.ctx.currentTime;
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, now);
      this.droneGain.gain.linearRampToValueAtTime(0.04, now + 2);

      // Low foundation tone (55Hz = A1)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, now);

      // Ethereal harmonic fifth (82.4Hz = E2) with slight vibrato
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.setValueAtTime(82.4, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      this.droneOsc1.connect(this.droneGain);
      this.droneOsc2.connect(this.droneGain);
      this.droneGain.connect(filter);
      filter.connect(this.ctx.destination);

      this.droneOsc1.start();
      this.droneOsc2.start();
    } catch {
      // Audio context might be restricted
    }
  }

  public stopDrone() {
    if (this.droneGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.droneGain.gain.linearRampToValueAtTime(0, now + 0.5);
        setTimeout(() => {
          this.droneOsc1?.stop();
          this.droneOsc2?.stop();
          this.droneOsc1?.disconnect();
          this.droneOsc2?.disconnect();
          this.droneOsc1 = null;
          this.droneOsc2 = null;
          this.droneGain = null;
        }, 600);
      } catch {
        this.droneOsc1 = null;
        this.droneOsc2 = null;
        this.droneGain = null;
      }
    }
  }

  // Paper rustle when moving / throwing floating pages
  public playPaperRustle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Ignore
    }
  }

  // Realistic tactile page turn audio synthesis (friction, aerodynamic swoosh, soft settle)
  public playPageTurn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.32;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Organic paper turn noise envelope: initial lift friction -> swoosh -> soft landing
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        const envelope = Math.sin(t * Math.PI) * (1 - t * 0.4);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Sweeping dynamic bandpass filter mimicking page swinging through air
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(950, now + duration * 0.7);
      filter.frequency.exponentialRampToValueAtTime(1400, now + duration);
      filter.Q.setValueAtTime(2.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);

      // Subtle warm lowpass landing thud as paper settles onto the opposite stack
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(180, now + duration * 0.65);
      thudOsc.frequency.exponentialRampToValueAtTime(70, now + duration);

      thudGain.gain.setValueAtTime(0.0, now);
      thudGain.gain.setValueAtTime(0.05, now + duration * 0.65);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);

      thudOsc.start(now + duration * 0.65);
      thudOsc.stop(now + duration);
    } catch {
      // Audio might be suspended or blocked
    }
  }

  // Dynamic air whoosh when dragging fast or throwing a floating page out of screen
  public playPageWhoosh(strength: number = 0.5) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.26 + Math.min(1.0, Math.max(0.1, strength)) * 0.18;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pinkish aerodynamic whoosh envelope
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.5362;
        const t = i / bufferSize;
        const env = Math.sin(t * Math.PI);
        data[i] = pink * env * 0.25;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const baseFreq = 800 + Math.min(1.0, strength) * 1400;
      filter.frequency.setValueAtTime(baseFreq * 0.6, now);
      filter.frequency.exponentialRampToValueAtTime(baseFreq, now + duration * 0.35);
      filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + duration);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      const vol = Math.min(0.18, 0.05 + strength * 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + duration * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Audio context might be restricted
    }
  }

  // Crystal chime when inspecting an artifact card
  public playInspectChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3); // A6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.5);
    } catch {
      // Ignore
    }
  }

  // Sci-fi warp & pulse sequence for "Restore Archive"
  public playRestoreSequence() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Rising sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 1.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 1.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 1.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.5);

      // Final settling chime at 2.0s
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const chimeNow = this.ctx.currentTime;
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(523.25, chimeNow); // C5
        chimeGain.gain.setValueAtTime(0.15, chimeNow);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeNow + 1.2);

        chime.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chime.start(chimeNow);
        chime.stop(chimeNow + 1.2);
      }, 1900);
    } catch {
      // Ignore
    }
  }

  // Controlled digital glitch burst for secret Chaos Mode
  public playChaosGlitch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      // Jump rapidly between chaotic harmonics
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(800, now + 0.05);
      osc.frequency.setValueAtTime(180, now + 0.1);
      osc.frequency.setValueAtTime(1200, now + 0.15);
      osc.frequency.setValueAtTime(90, now + 0.2);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }
}

export const archiveAudio = new ArchiveSoundSynth();
