/**
 * AudioSystem for Arithma Knights
 * Uses the Web Audio API to procedurally generate:
 * 1. Retro medieval arcade combat sound effects
 * 2. An atmospheric Procedural Medieval Dungeon Crawler BGM (D minor / D Dorian)
 * Requires zero external audio files.
 */
export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;

    // BGM Sequencer state: Climactic Chiptune Metal & Progressive Electronic Rock
    this.isPlayingBgm = false;
    this.schedulerTimer = null;
    this.currentStep = 0; // 0 to 63 (4 bars of 16 steps each)
    this.nextStepTime = 0;
    this.tempo = 148; // High-stakes climactic battle tempo (148 BPM)
    this.secondsPerStep = 60 / (this.tempo * 4); // 16th note duration (~101ms)
    this.distortionCurve = this._makeDistortionCurve(50);
    this.customAudio = null;

    this._initAudioOnUserAction = this._initAudioOnUserAction.bind(this);
    this._schedulerLoop = this._schedulerLoop.bind(this);

    // Modern browsers require a user interaction to resume/unlock the audio context
    window.addEventListener('click', this._initAudioOnUserAction, { once: true });
    window.addEventListener('keydown', this._initAudioOnUserAction, { once: true });
  }

  _initAudioOnUserAction() {
    if (!this.ctx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX Sub-bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // BGM Sub-bus (balanced so it sits comfortably in background)
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        // Start Dungeon BGM
        this.startBgm();
      } catch (e) {
        console.warn('Web Audio API unavailable or blocked:', e);
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      this.startBgm();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  // =========================================================================
  // CLIMACTIC CHIPTUNE METAL & PROGRESSIVE ELECTRONIC ROCK BGM ENGINE
  // =========================================================================

  _makeDistortionCurve(amount = 50) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  loadCustomBgm(url) {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }
    try {
      this.customAudio = new Audio(url);
      this.customAudio.loop = true;
      this.customAudio.volume = this.isMuted ? 0 : 0.65;
      this.stopBgm();
      this.customAudio.play().catch((err) => {
        console.warn('Custom audio playback blocked, falling back to procedural synthesizer:', err);
        this.startBgm();
      });
    } catch (e) {
      console.warn('Could not load custom audio file:', e);
    }
  }

  startBgm() {
    if (this.customAudio) {
      this.customAudio.play().catch(() => {});
      return;
    }
    if (this.isPlayingBgm || !this.ctx) return;
    this.isPlayingBgm = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.schedulerTimer = setInterval(this._schedulerLoop, 25);
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  _schedulerLoop() {
    if (!this.isPlayingBgm || !this.ctx) return;
    // Schedule ahead by 100ms
    while (this.nextStepTime < this.ctx.currentTime + 0.1) {
      this._scheduleBattleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.secondsPerStep;
      this.currentStep = (this.currentStep + 1) % 64; // 4 bars (16 steps each)
    }
  }

  /**
   * High-Stakes Climactic Chiptune Metal & Progressive Electronic Rock Sequencer
   * Renders 16th-note steps across:
   * 1. Aggressive Metal Drums (Double-kick, snappy snare, ride/crash cymbals)
   * 2. Heavy Chugging Distorted Guitar Riffs (Dual detuned saw/square + waveshaper distortion)
   * 3. Raw 8-Bit Game Boy Pulse-Wave Arpeggios (Urgent cascading 16th sweeps)
   * 4. Soaring Harmonized Shred Lead Guitar (Epic dual-voice melodic climax)
   */
  _scheduleBattleStep(step, time) {
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // 1. AGGRESSIVE METAL DRUMS WITH TIGHT DOUBLE-KICK PATTERNS
    // Double kick pattern: drives relentlessly on even 16ths
    const isDoubleKick = stepInBar % 2 === 0;
    if (isDoubleKick) {
      const kickVol = (stepInBar === 0 || stepInBar === 8) ? 0.38 : 0.26;
      this._synthDoubleKickDrum(time, kickVol);
    }

    // Snare hits on beats 2 & 4 (steps 4, 12), plus syncopated fills on bar 3
    const isSnareBackbeat = stepInBar === 4 || stepInBar === 12;
    const isBar3Fill = bar === 3 && (stepInBar === 10 || stepInBar === 14 || stepInBar === 15);
    if (isSnareBackbeat || isBar3Fill) {
      this._synthSnareHit(time, isBar3Fill ? 0.28 : 0.34);
    }

    // Hi-hat / Ride cymbal drive on 16ths + crash on bar start
    if (stepInBar === 0) {
      this._synthHiHat(time, true, bar === 0 ? 0.25 : 0.18); // Open crash
    } else if (stepInBar % 2 === 1) {
      this._synthHiHat(time, false, 0.08); // Closed tight hat
    }

    // 2. HEAVY CHUGGING DISTORTED ELECTRIC GUITAR RIFFS
    // Riff Progression:
    // Bar 0: D minor chug (D2 / F2 / G2 accents)
    // Bar 1: Bb to C power shifts (Bb1 / C2 / D2)
    // Bar 2: Ascending progressive tension (F2 -> G2 -> Ab2 diminished)
    // Bar 3: A Phrygian Dominant turnaround (A1 -> Bb1 -> C#2 -> D2)
    const guitarRiffs = [
      [73.42, 73.42, 87.31, 73.42, 73.42, 98.00, 73.42, 73.42], // Bar 0 (D Minor)
      [58.27, 58.27, 65.41, 58.27, 65.41, 65.41, 73.42, 65.41], // Bar 1 (Bb / C)
      [87.31, 87.31, 98.00, 87.31, 103.83, 103.83, 98.00, 87.31], // Bar 2 (F / G / Ab)
      [55.00, 55.00, 58.27, 55.00, 69.30, 69.30, 73.42, 55.00]  // Bar 3 (A Phrygian)
    ];

    const currentRiff = guitarRiffs[bar];
    const chugFreq = currentRiff[Math.floor(stepInBar / 2)];
    // Chug on 16th notes for heavy rhythm momentum
    if (stepInBar % 2 === 0 || stepInBar === 7 || stepInBar === 15) {
      this._synthChugGuitar(chugFreq, time, this.secondsPerStep * 1.6, 0.22);
    }

    // 3. RAW 8-BIT GAME BOY PULSE-WAVE ARPEGGIOS (Frantic, urgent runs)
    const chiptuneArps = [
      // Bar 0: D minor cascade (D4, F4, A4, D5, F5, D5, A4, F4)
      [293.66, 349.23, 440.00, 587.33, 698.46, 587.33, 440.00, 349.23],
      // Bar 1: Bb major / C cascade
      [233.08, 293.66, 349.23, 466.16, 523.25, 466.16, 349.23, 293.66],
      // Bar 2: G minor / F tension
      [196.00, 233.08, 293.66, 392.00, 440.00, 392.00, 293.66, 233.08],
      // Bar 3: A dominant / D turnaround
      [220.00, 277.18, 329.63, 440.00, 554.37, 440.00, 329.63, 277.18]
    ];
    const arpNotes = chiptuneArps[bar];
    const arpFreq = arpNotes[stepInBar % 8];
    this._synthGameBoyArp(arpFreq, time, this.secondsPerStep * 0.85, 0.12);

    // 4. SOARING HARMONIZED SHRED LEAD GUITAR (Triumphant Video Game Melody)
    // Slower melodic lead notes that soar over the chugging metal drive
    const shredMelodies = [
      // Bar 0: D5 -> F5 -> E5 -> D5 (Triumphant entrance)
      { step: 0, freq: 587.33, dur: 4 }, // D5
      { step: 4, freq: 698.46, dur: 4 }, // F5
      { step: 8, freq: 659.25, dur: 4 }, // E5
      { step: 12, freq: 587.33, dur: 4 }, // D5

      // Bar 1: F5 -> G5 -> A5 (Ascending guitar climb)
      { step: 16, freq: 698.46, dur: 4 }, // F5
      { step: 20, freq: 783.99, dur: 4 }, // G5
      { step: 24, freq: 880.00, dur: 8 }, // A5 (long soaring sustain)

      // Bar 2: Bb5 -> A5 -> G5 -> F5 (Technical progressive run)
      { step: 32, freq: 932.33, dur: 4 }, // Bb5
      { step: 36, freq: 880.00, dur: 4 }, // A5
      { step: 40, freq: 783.99, dur: 4 }, // G5
      { step: 44, freq: 698.46, dur: 4 }, // F5

      // Bar 3: C#5 -> D5 -> E5 -> D5 (Climactic resolving cadence)
      { step: 48, freq: 554.37, dur: 4 }, // C#5
      { step: 52, freq: 587.33, dur: 4 }, // D5
      { step: 56, freq: 659.25, dur: 4 }, // E5
      { step: 60, freq: 587.33, dur: 4 }  // D5
    ];

    const currentLead = shredMelodies.find((m) => m.step === step);
    if (currentLead) {
      this._synthShredLead(currentLead.freq, time, currentLead.dur * this.secondsPerStep, 0.19);
    }
  }

  // Double-Kick Bass Drum with aggressive sub-bass punch
  _synthDoubleKickDrum(time, gainVal = 0.35) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, time);
      osc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

      gain.gain.setValueAtTime(gainVal, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + 0.12);
    } catch {}
  }

  // Snappy Metal Snare with noise burst + 180Hz punch
  _synthSnareHit(time, gainVal = 0.32) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, time);
      filter.Q.setValueAtTime(1.2, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(gainVal, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.bgmGain);

      noise.start(time);
      noise.stop(time + 0.1);

      const osc = this.ctx.createOscillator();
      const toneGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.07);

      toneGain.gain.setValueAtTime(gainVal * 0.7, time);
      toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      osc.connect(toneGain);
      toneGain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + 0.08);
    } catch {}
  }

  // Metallic Hi-Hat / Crash Cymbal
  _synthHiHat(time, isOpen = false, gainVal = 0.1) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const dur = isOpen ? 0.28 : 0.04;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(isOpen ? 4800 : 7500, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      noise.start(time);
      noise.stop(time + dur);
    } catch {}
  }

  // Chugging Distorted Electric Guitar (Dual detuned saw + Waveshaper distortion + Cabinet filter)
  _synthChugGuitar(freq, time, duration, gainVal = 0.22) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 1.498, time); // Perfect fifth harmony
      osc2.detune.setValueAtTime(8, time);

      const waveshaper = this.ctx.createWaveShaper();
      waveshaper.curve = this.distortionCurve;
      waveshaper.oversample = '2x';

      const cabFilter = this.ctx.createBiquadFilter();
      cabFilter.type = 'lowpass';
      cabFilter.frequency.setValueAtTime(3200, time);
      cabFilter.Q.setValueAtTime(1.8, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc1.connect(waveshaper);
      osc2.connect(waveshaper);
      waveshaper.connect(cabFilter);
      cabFilter.connect(gain);
      gain.connect(this.bgmGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    } catch {}
  }

  // Raw 8-Bit Game Boy Pulse-Wave Arpeggios (Urgent square wave runs)
  _synthGameBoyArp(freq, time, duration, gainVal = 0.12) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(gainVal, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + duration);
    } catch {}
  }

  // Soaring Harmonized Shred Lead Guitar (Dual voice with pitch vibrato)
  _synthShredLead(freq, time, duration, gainVal = 0.18) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(freq * 1.25, time); // Third interval harmony
      osc2.detune.setValueAtTime(6, time);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.8, time); // 5.8Hz rapid shred vibrato
      lfoGain.gain.setValueAtTime(6, time);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);
      lfo.start(time + 0.05);
      lfo.stop(time + duration);

      const waveshaper = this.ctx.createWaveShaper();
      waveshaper.curve = this.distortionCurve;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4500, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(gainVal, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc1.connect(waveshaper);
      osc2.connect(waveshaper);
      waveshaper.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    } catch {}
  }

  // =========================================================================
  // RETRO COMBAT SFX (Sound Effects)
  // =========================================================================

  _playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.3, detune = 0, startDelay = 0) {
    if (!this.ctx || this.isMuted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const startTime = this.ctx.currentTime + startDelay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime(detune, startTime);

      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {}
  }

  playClick() {
    this._playTone(480, 'triangle', 0.05, 0.2);
  }

  playSelect() {
    this._playTone(600, 'sine', 0.08, 0.25);
  }

  playEquip() {
    this._playTone(440, 'triangle', 0.1, 0.2, 0, 0);
    this._playTone(660, 'sine', 0.14, 0.25, 0, 0.08);
  }

  playKnightSlash() {
    if (!this.ctx || this.isMuted) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain || this.masterGain);

      whiteNoise.start();

      this._playTone(320, 'sawtooth', 0.2, 0.2, 0, 0.02);
      this._playTone(580, 'sine', 0.25, 0.25, 0, 0.04);
    } catch {}
  }

  playBerserkerDivision() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);

      this._playTone(90, 'square', 0.25, 0.35, 0, 0.05);
    } catch {}
  }

  playClericHeal() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this._playTone(freq, 'sine', 0.3, 0.2, 0, idx * 0.07);
    });
  }

  playPaladinBuff() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(now);
      osc.stop(now + 0.35);

      this._playTone(880, 'sine', 0.3, 0.2, 0, 0.2);
    } catch {}
  }

  playEnemyAttack() {
    this._playTone(150, 'sawtooth', 0.2, 0.35);
    this._playTone(70, 'triangle', 0.25, 0.4, 0, 0.05);
  }

  playRoundStart() {
    this._playTone(330, 'sine', 0.12, 0.2, 0, 0);
    this._playTone(493.88, 'sine', 0.18, 0.22, 0, 0.08);
  }

  playBossPhaseShift() {
    const chords = [
      { f: 220, t: 0, d: 0.25 },
      { f: 277.18, t: 0.05, d: 0.25 },
      { f: 329.63, t: 0.1, d: 0.3 },
      { f: 440, t: 0.15, d: 0.4 },
      { f: 554.37, t: 0.2, d: 0.5 },
    ];
    chords.forEach((c) => {
      this._playTone(c.f, 'sawtooth', c.d, 0.25, 0, c.t);
      this._playTone(c.f * 2, 'sine', c.d, 0.2, 0, c.t);
    });
  }

  playStageClear() {
    const melody = [
      { f: 440, d: 0.12, t: 0 },
      { f: 554.37, d: 0.12, t: 0.12 },
      { f: 659.25, d: 0.15, t: 0.24 },
      { f: 880, d: 0.45, t: 0.38 },
    ];
    melody.forEach((note) => {
      this._playTone(note.f, 'triangle', note.d, 0.3, 0, note.t);
      this._playTone(note.f * 1.5, 'sine', note.d, 0.15, 0, note.t);
    });
  }

  playGameOver() {
    const notes = [
      { f: 392.00, t: 0 },
      { f: 369.99, t: 0.2 },
      { f: 329.63, t: 0.4 },
      { f: 261.63, t: 0.65 },
    ];
    notes.forEach((n) => {
      this._playTone(n.f, 'sawtooth', 0.35, 0.25, 0, n.t);
    });
  }

  playVictory() {
    const melody = [
      { f: 523.25, t: 0 },
      { f: 659.25, t: 0.15 },
      { f: 783.99, t: 0.3 },
      { f: 1046.5, t: 0.5 },
      { f: 880, t: 0.75 },
      { f: 1046.5, t: 0.95 },
    ];
    melody.forEach((n) => {
      this._playTone(n.f, 'sine', 0.35, 0.3, 0, n.t);
      this._playTone(n.f * 0.5, 'triangle', 0.4, 0.2, 0, n.t);
    });
  }
}
