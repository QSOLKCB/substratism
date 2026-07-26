// SPDX-License-Identifier: MIT
(function (global, factory) {
  const core = global.SubstratismCore || (
    typeof require !== "undefined" ? require("./substratism-core.js") : null
  );
  const api = factory(core);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.SubstratismAudio = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Core) {
  "use strict";

  if (!Core) {
    throw new Error("SubstratismCore must load before SubstratismAudio.");
  }

  const TWO_PI = Math.PI * 2;

  function midiOffsetFrequency(base, semitones) {
    return base * 2 ** (semitones / 12);
  }

  function createSilentMetrics() {
    return {
      level: 0,
      bass: 0,
      mid: 0,
      high: 0,
      spectrum: new Uint8Array(64)
    };
  }

  function frequencyBand(data, sampleRate, fftSize, lowHz, highHz) {
    if (!data || !data.length) {
      return 0;
    }
    const binHz = sampleRate / fftSize;
    const start = Math.max(0, Math.floor(lowHz / binHz));
    const end = Math.min(data.length - 1, Math.ceil(highHz / binHz));
    if (end < start) {
      return 0;
    }
    let sum = 0;
    for (let index = start; index <= end; index += 1) {
      sum += data[index] / 255;
    }
    return sum / (end - start + 1);
  }

  function encodeWave(samples, sampleRate) {
    const bytesPerSample = 2;
    const dataLength = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    function textAt(offset, value) {
      for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
      }
    }

    textAt(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    textAt(8, "WAVE");
    textAt(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    textAt(36, "data");
    view.setUint32(40, dataLength, true);

    for (let index = 0; index < samples.length; index += 1) {
      const sample = Core.clamp(samples[index], -1, 1);
      view.setInt16(
        44 + index * bytesPerSample,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

  function renderWave(profile, options) {
    const duration = Core.clamp(Number(options?.duration) || 16, 4, 60);
    const sampleRate = Core.clamp(Number(options?.sampleRate) || 48000, 8000, 96000);
    const tuning = Core.clamp(Number(options?.tuning) || 432, 400, 480);
    const params = Core.sonificationParameters(profile, tuning);
    const sampleCount = Math.floor(duration * sampleRate);
    const samples = new Float32Array(sampleCount);
    const random = Core.xorshift32(Core.responseSeed(profile.raw));
    const secondsPerStep = 60 / params.tempo / 2;
    const corrected = profile.corrected;
    let lowPhase = 0;
    let highPhase = 0;
    let shimmerPhase = 0;
    let previousNoise = 0;

    for (let index = 0; index < sampleCount; index += 1) {
      const time = index / sampleRate;
      const stepFloat = time / secondsPerStep;
      const step = Math.floor(stepFloat) % corrected.length;
      const stepPhase = stepFloat - Math.floor(stepFloat);
      const value = corrected[step];
      const direct = Core.ITEMS[step].channel === "substrate";
      const lowFrequency = midiOffsetFrequency(
        params.biologicalBase,
        value + (direct ? -3 : 0)
      );
      const highFrequency = midiOffsetFrequency(
        params.digitalBase,
        value * 2 + params.separation + (direct ? 0 : 4)
      );
      const shimmerFrequency = highFrequency * (1.5 + value / 56);
      lowPhase += TWO_PI * lowFrequency / sampleRate;
      highPhase += TWO_PI * highFrequency / sampleRate;
      shimmerPhase += TWO_PI * shimmerFrequency / sampleRate;

      const attack = Math.min(1, stepPhase / 0.035);
      const decay = Math.exp(-stepPhase / params.pulseWidth);
      const envelope = attack * decay;
      const low = Math.sin(lowPhase) * params.biologicalGain;
      const digital = (
        Math.sin(highPhase)
        + 0.28 * Math.sin(shimmerPhase)
      ) * params.digitalGain;
      const white = random() * 2 - 1;
      previousNoise += 0.12 * (white - previousNoise);
      const noise = previousNoise * params.noiseGain;
      const movement = Math.sin(TWO_PI * time / 8) * 0.018;
      samples[index] = Math.tanh((low + digital + noise) * envelope * 1.85 + movement);
    }

    return encodeWave(samples, sampleRate);
  }

  class SonificationEngine {
    constructor(callbacks) {
      this.onStatus = callbacks?.onStatus || function () {};
      this.onBeat = callbacks?.onBeat || function () {};
      this.context = null;
      this.analyser = null;
      this.frequencyData = null;
      this.timeData = null;
      this.activeSource = "none";
      this.nodes = [];
      this.oscillators = [];
      this.mediaElement = null;
      this.mediaStream = null;
      this.objectUrl = null;
      this.timer = 0;
      this.step = 0;
      this.profile = Core.scoreResponses([4, 4, 4, 4, 4, 4, 4, 4]);
      this.tuning = 432;
      this.generated = null;
      this.recordDestination = null;
    }

    async ensureContext() {
      if (!this.context) {
        const ContextClass = global.AudioContext || global.webkitAudioContext;
        if (!ContextClass) {
          throw new Error("This browser does not expose the Web Audio API.");
        }
        this.context = new ContextClass();
      }
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
      return this.context;
    }

    createAnalyser() {
      const analyser = this.context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.78;
      analyser.minDecibels = -96;
      analyser.maxDecibels = -16;
      this.analyser = analyser;
      this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
      this.timeData = new Uint8Array(analyser.fftSize);
      return analyser;
    }

    setProfile(profile, tuning) {
      this.profile = profile;
      this.tuning = Core.clamp(Number(tuning) || this.tuning, 400, 480);
      if (this.generated) {
        this.applyGeneratedStep(this.step, false);
      }
    }

    clearNodes() {
      for (const oscillator of this.oscillators) {
        try {
          oscillator.stop();
        } catch (error) {
          void error;
        }
      }
      this.oscillators = [];
      for (const node of this.nodes) {
        try {
          node.disconnect();
        } catch (error) {
          void error;
        }
      }
      this.nodes = [];
      this.generated = null;
      this.analyser = null;
      this.frequencyData = null;
      this.timeData = null;
      this.recordDestination = null;
    }

    stop() {
      if (this.timer) {
        global.clearTimeout(this.timer);
        this.timer = 0;
      }
      if (this.mediaElement) {
        this.mediaElement.pause();
        this.mediaElement.removeAttribute("src");
        this.mediaElement.load();
        this.mediaElement = null;
      }
      if (this.mediaStream) {
        for (const track of this.mediaStream.getTracks()) {
          track.stop();
        }
        this.mediaStream = null;
      }
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = null;
      }
      this.clearNodes();
      this.activeSource = "none";
      this.onStatus("Audio idle");
    }

    applyGeneratedStep(step, scheduleNext) {
      if (!this.generated || this.activeSource !== "generated") {
        return;
      }
      const now = this.context.currentTime;
      const itemIndex = step % Core.ITEMS.length;
      const value = this.profile.corrected[itemIndex];
      const item = Core.ITEMS[itemIndex];
      const params = Core.sonificationParameters(this.profile, this.tuning);
      const biologicalFrequency = midiOffsetFrequency(
        params.biologicalBase,
        value + (item.channel === "substrate" ? -3 : 0)
      );
      const digitalFrequency = midiOffsetFrequency(
        params.digitalBase,
        value * 2 + params.separation + (item.channel === "substrate" ? 0 : 4)
      );

      this.generated.biological.frequency.setTargetAtTime(
        biologicalFrequency,
        now,
        0.018
      );
      this.generated.digital.frequency.setTargetAtTime(
        digitalFrequency,
        now,
        0.018
      );
      this.generated.filter.frequency.setTargetAtTime(
        params.filterFrequency + value * 115,
        now,
        0.03
      );
      this.generated.biologicalGain.gain.cancelScheduledValues(now);
      this.generated.biologicalGain.gain.setValueAtTime(0.0001, now);
      this.generated.biologicalGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, params.biologicalGain),
        now + 0.025
      );
      this.generated.biologicalGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + params.pulseWidth
      );
      this.generated.digitalGain.gain.cancelScheduledValues(now);
      this.generated.digitalGain.gain.setValueAtTime(0.0001, now);
      this.generated.digitalGain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, params.digitalGain),
        now + 0.018
      );
      this.generated.digitalGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + params.pulseWidth * 0.82
      );
      this.generated.panner.pan.setTargetAtTime(
        -0.68 + (itemIndex / 7) * 1.36,
        now,
        0.025
      );

      this.step = (itemIndex + 1) % Core.ITEMS.length;
      this.onBeat({
        itemIndex,
        item,
        value,
        tempo: params.tempo
      });

      if (scheduleNext) {
        const delay = (60 / params.tempo / 2) * 1000;
        this.timer = global.setTimeout(
          () => this.applyGeneratedStep(this.step, true),
          delay
        );
      }
    }

    async startGenerated(profile, options) {
      this.stop();
      await this.ensureContext();
      this.profile = profile;
      this.tuning = Core.clamp(Number(options?.tuning) || 432, 400, 480);
      this.step = 0;

      const analyser = this.createAnalyser();
      const biological = this.context.createOscillator();
      const digital = this.context.createOscillator();
      const biologicalGain = this.context.createGain();
      const digitalGain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      const panner = this.context.createStereoPanner();
      const master = this.context.createGain();
      const recordDestination = this.context.createMediaStreamDestination();

      biological.type = "sine";
      digital.type = "triangle";
      filter.type = "lowpass";
      filter.Q.value = 4.5;
      biologicalGain.gain.value = 0.0001;
      digitalGain.gain.value = 0.0001;
      master.gain.value = 0.64;

      biological.connect(biologicalGain);
      digital.connect(digitalGain);
      biologicalGain.connect(filter);
      digitalGain.connect(filter);
      filter.connect(panner);
      panner.connect(master);
      master.connect(analyser);
      analyser.connect(this.context.destination);
      master.connect(recordDestination);

      biological.start();
      digital.start();
      this.oscillators = [biological, digital];
      this.nodes = [
        biological,
        digital,
        biologicalGain,
        digitalGain,
        filter,
        panner,
        master,
        analyser,
        recordDestination
      ];
      this.recordDestination = recordDestination;
      this.generated = {
        biological,
        digital,
        biologicalGain,
        digitalGain,
        filter,
        panner,
        master
      };
      this.activeSource = "generated";
      this.onStatus("Generated scale receiver active");
      this.applyGeneratedStep(0, true);
    }

    async startMicrophone() {
      this.stop();
      await this.ensureContext();
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone capture is unavailable in this browser context.");
      }
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.context.createMediaStreamSource(this.mediaStream);
      const analyser = this.createAnalyser();
      source.connect(analyser);
      this.nodes = [source, analyser];
      this.activeSource = "microphone";
      this.onStatus("Microphone analyser active — audio remains local");
    }

    async startFile(file) {
      this.stop();
      await this.ensureContext();
      if (!file) {
        throw new Error("Choose a local audio file first.");
      }
      const analyser = this.createAnalyser();
      const element = new Audio();
      this.objectUrl = URL.createObjectURL(file);
      element.src = this.objectUrl;
      element.loop = true;
      element.preload = "auto";
      const source = this.context.createMediaElementSource(element);
      source.connect(analyser);
      analyser.connect(this.context.destination);
      this.nodes = [source, analyser];
      this.mediaElement = element;
      this.activeSource = "file";
      await element.play();
      this.onStatus(`Local file active — ${file.name}`);
    }

    metrics(sensitivity) {
      if (!this.analyser || !this.frequencyData || !this.timeData) {
        return createSilentMetrics();
      }
      this.analyser.getByteFrequencyData(this.frequencyData);
      this.analyser.getByteTimeDomainData(this.timeData);
      const scale = Core.clamp(Number(sensitivity) || 1, 0.25, 3);
      let sumSquares = 0;
      for (const value of this.timeData) {
        const sample = (value - 128) / 128;
        sumSquares += sample * sample;
      }
      const level = Core.clamp(Math.sqrt(sumSquares / this.timeData.length) * scale, 0, 1);
      const spectrum = new Uint8Array(64);
      const stride = Math.max(1, Math.floor(this.frequencyData.length / spectrum.length));
      for (let index = 0; index < spectrum.length; index += 1) {
        let peak = 0;
        const start = index * stride;
        const end = Math.min(this.frequencyData.length, start + stride);
        for (let cursor = start; cursor < end; cursor += 1) {
          peak = Math.max(peak, this.frequencyData[cursor]);
        }
        spectrum[index] = Core.clamp(Math.round(peak * scale), 0, 255);
      }
      return {
        level,
        bass: Core.clamp(
          frequencyBand(
            this.frequencyData,
            this.context.sampleRate,
            this.analyser.fftSize,
            30,
            180
          ) * scale,
          0,
          1
        ),
        mid: Core.clamp(
          frequencyBand(
            this.frequencyData,
            this.context.sampleRate,
            this.analyser.fftSize,
            180,
            2200
          ) * scale,
          0,
          1
        ),
        high: Core.clamp(
          frequencyBand(
            this.frequencyData,
            this.context.sampleRate,
            this.analyser.fftSize,
            2200,
            12000
          ) * scale,
          0,
          1
        ),
        spectrum
      };
    }

    recordingStream() {
      return this.recordDestination?.stream || null;
    }
  }

  return Object.freeze({
    midiOffsetFrequency,
    frequencyBand,
    encodeWave,
    renderWave,
    SonificationEngine
  });
});
