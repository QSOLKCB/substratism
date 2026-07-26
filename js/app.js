// SPDX-License-Identifier: MIT
(function () {
  "use strict";

  const Core = globalThis.SubstratismCore;
  const Audio = globalThis.SubstratismAudio;
  const Visuals = globalThis.SubstratismVisuals;

  if (!Core || !Audio || !Visuals) {
    throw new Error("Substratism VIZ modules did not load in the required order.");
  }

  const byId = (id) => document.getElementById(id);
  const all = (selector) => Array.from(document.querySelectorAll(selector));
  const fieldCanvas = byId("fieldCanvas");
  const spectrumCanvas = byId("spectrumCanvas");
  const renderer = new Visuals.FieldRenderer(fieldCanvas);
  const state = {
    responses: Array(8).fill(4),
    profile: Core.scoreResponses(Array(8).fill(4)),
    activeItem: 0,
    metrics: {
      level: 0,
      bass: 0,
      mid: 0,
      high: 0,
      spectrum: new Uint8Array(64)
    },
    view: "map",
    recording: false,
    analyserFrame: 0,
    visualTime: 0
  };

  const audioEngine = new Audio.SonificationEngine({
    onStatus: (message) => {
      byId("audioStatus").textContent = message;
      byId("signalBadge").textContent = audioEngine.activeSource === "none"
        ? "signal idle"
        : `${audioEngine.activeSource} signal`;
    },
    onBeat: (beat) => {
      setActiveItem(beat.itemIndex);
    }
  });

  const VIEW_COPY = Object.freeze({
    map: {
      title: "Concept map · four-branch topology",
      summary: "The supplied research map is rebuilt as a responsive topology whose branches share the sonification clock.",
      canvas: "Substratism concept topology"
    },
    scale: {
      title: "Scale lattice · eight corrected channels",
      summary: "Each radial coordinate is one validated scale item; item 2 is reversed before the corrected polygon is drawn.",
      canvas: "Eight-channel corrected scale lattice"
    },
    outcomes: {
      title: "Moral delta · association reconstruction",
      summary: "Published controlled slopes and odds ratios move six outcome markers across a shared biological-to-digital field.",
      canvas: "Moral, resource, and advocacy outcome field"
    },
    coefficients: {
      title: "Effect field · substratism against four controls",
      summary: "Signed β values and odds-ratio displacements expose the reported effect directions without mixing their statistical scales.",
      canvas: "Regression coefficient field"
    }
  });

  function formatNumber(value, decimals) {
    return Number(value).toFixed(decimals);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function buildScaleControls() {
    const container = byId("scaleControls");
    Core.ITEMS.forEach((item, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "scale-item";
      wrapper.dataset.itemIndex = String(index);

      const label = document.createElement("label");
      label.htmlFor = `scaleItem${item.id}`;
      const title = document.createElement("span");
      title.textContent = `${item.id}. ${item.short}${item.reverse ? " (R)" : ""}`;
      const output = document.createElement("output");
      output.id = `scaleItem${item.id}Value`;
      output.htmlFor = `scaleItem${item.id}`;
      output.textContent = "4";
      const slider = document.createElement("input");
      slider.id = `scaleItem${item.id}`;
      slider.type = "range";
      slider.min = String(Core.SCALE_MIN);
      slider.max = String(Core.SCALE_MAX);
      slider.step = "1";
      slider.value = "4";
      slider.dataset.itemIndex = String(index);
      slider.setAttribute("aria-label", item.statement);
      const classification = document.createElement("small");
      classification.textContent = item.classifications.join(" · ");

      label.append(title, output, slider, classification);
      wrapper.append(label);
      container.append(wrapper);

      slider.addEventListener("input", () => {
        state.responses[index] = Number(slider.value);
        setActiveItem(index);
        updateProfile();
      });
      slider.addEventListener("focus", () => setActiveItem(index));
      slider.addEventListener("pointerenter", () => setActiveItem(index));
    });
  }

  function setScaleValues(values) {
    state.responses = values.slice();
    Core.ITEMS.forEach((item, index) => {
      byId(`scaleItem${item.id}`).value = String(values[index]);
    });
    updateProfile();
  }

  function setActiveItem(index) {
    state.activeItem = Core.clamp(Number(index) || 0, 0, Core.ITEMS.length - 1);
    renderer.setActiveItem(state.activeItem);
    all(".scale-item").forEach((element, elementIndex) => {
      element.classList.toggle("is-active", elementIndex === state.activeItem);
    });
    updateInspector();
  }

  function updateInspector() {
    const index = state.activeItem;
    const item = Core.ITEMS[index];
    const raw = state.profile.raw[index];
    const corrected = state.profile.corrected[index];
    byId("itemTitle").textContent = `Item ${item.id} · ${item.short}`;
    byId("itemValue").textContent = `${raw} → ${corrected} corrected`;
    byId("itemStatement").textContent = item.statement;
    byId("itemClass").textContent = item.classifications.join(" · ");
    byId("itemScoring").textContent = item.reverse ? "reverse-scored (8 − response)" : "direct";
    byId("itemAudio").textContent = item.channel === "substrate"
      ? "lower biological lane + paired digital lane"
      : item.channel === "capacity"
        ? "upper digital lane + capacity interval"
        : "rights/treatment interval pair";
  }

  function outcomeMarkerPercent(outcome) {
    return Core.clamp(
      (outcome.value - outcome.minimum) / (outcome.maximum - outcome.minimum) * 100,
      0,
      100
    );
  }

  function updateOutcomeCards(outcomes) {
    const container = byId("outcomeCards");
    container.replaceChildren();
    outcomes.forEach((outcome) => {
      const card = document.createElement("article");
      card.className = "outcome-card";
      const title = document.createElement("h3");
      title.textContent = outcome.label;
      const context = document.createElement("p");
      const effect = outcome.kind === "logistic"
        ? `OR ${outcome.oddsRatio.toFixed(2)}`
        : `β ${outcome.beta.toFixed(2)} · b ${outcome.slope.toFixed(2)}`;
      context.textContent = `${outcome.context} · ${outcome.study} · ${effect}`;
      const value = document.createElement("strong");
      value.textContent = Core.displayOutcome(outcome);
      const meter = document.createElement("div");
      meter.className = "outcome-meter";
      const marker = document.createElement("i");
      marker.className = "outcome-marker";
      marker.style.left = `${outcomeMarkerPercent(outcome)}%`;
      marker.setAttribute("aria-hidden", "true");
      card.append(title, context, value, meter, marker);
      container.append(card);
    });
  }

  function updateAudioParameters() {
    const params = Core.sonificationParameters(
      state.profile,
      Number(byId("tuning").value)
    );
    byId("tempoValue").textContent = `${params.tempo} BPM`;
    byId("digitalGain").textContent = `${params.digitalGain.toFixed(3)} gain`;
    byId("biologicalGain").textContent = `${params.biologicalGain.toFixed(3)} gain`;
    byId("filterValue").textContent = `${Math.round(params.filterFrequency).toLocaleString()} Hz`;
    byId("separationValue").textContent = `${params.separation.toFixed(1)} semitones`;
    audioEngine.setProfile(state.profile, params.tuning);
  }

  function updateProfile() {
    state.profile = Core.scoreResponses(state.responses);
    const outcomes = Core.outcomeProfile(state.profile.score);
    renderer.setProfile(state.profile);
    byId("scoreMetric").textContent = formatNumber(state.profile.score, 2);
    byId("explicitMetric").textContent = formatNumber(state.profile.substrateExplicit, 2);
    byId("implicitMetric").textContent = formatNumber(state.profile.treatmentCapacity, 2);
    Core.ITEMS.forEach((item, index) => {
      const raw = state.profile.raw[index];
      const corrected = state.profile.corrected[index];
      byId(`scaleItem${item.id}Value`).textContent = item.reverse
        ? `${raw} → ${corrected}`
        : String(raw);
    });
    updateOutcomeCards(outcomes);
    updateInspector();
    updateAudioParameters();
  }

  function setView(view) {
    state.view = view;
    renderer.setView(view);
    const copy = VIEW_COPY[view];
    byId("activeViewTitle").textContent = copy.title;
    byId("activeViewSummary").textContent = copy.summary;
    byId("canvasTitle").textContent = copy.canvas;
    byId("mapFocusLabel").hidden = view !== "map";
  }

  async function startAudio() {
    const source = byId("audioSource").value;
    byId("audioStatus").textContent = "Starting local audio…";
    try {
      if (source === "microphone") {
        await audioEngine.startMicrophone();
      } else if (source === "file") {
        await audioEngine.startFile(byId("audioFile").files[0]);
      } else {
        await audioEngine.startGenerated(state.profile, {
          tuning: Number(byId("tuning").value)
        });
      }
      byId("startAudio").disabled = true;
      byId("stopAudio").disabled = false;
    } catch (error) {
      byId("audioStatus").textContent = `Audio unavailable: ${error.message}`;
      byId("startAudio").disabled = false;
      byId("stopAudio").disabled = true;
    }
  }

  function stopAudio() {
    audioEngine.stop();
    state.metrics = {
      level: 0,
      bass: 0,
      mid: 0,
      high: 0,
      spectrum: new Uint8Array(64)
    };
    renderer.setMetrics(state.metrics);
    byId("startAudio").disabled = false;
    byId("stopAudio").disabled = true;
    byId("signalBadge").textContent = "signal idle";
  }

  function exportedState() {
    const outcomes = Core.outcomeProfile(state.profile.score).map((outcome) => ({
      id: outcome.id,
      value: Number(outcome.value.toFixed(8)),
      kind: outcome.kind,
      publishedEffect: outcome.kind === "logistic"
        ? { oddsRatio: outcome.oddsRatio }
        : { slope: outcome.slope, beta: outcome.beta }
    }));
    return {
      schema: "qsol-imc.substratism-viz.state.v1",
      source: {
        title: "Substratism: Conceptualizing and measuring moral bias against AI",
        doi: "10.1016/j.chb.2026.109120"
      },
      view: state.view,
      focusBranch: byId("mapFocus").value,
      responses: state.profile.raw,
      correctedResponses: state.profile.corrected,
      score: Number(state.profile.score.toFixed(8)),
      substrateExplicit: Number(state.profile.substrateExplicit.toFixed(8)),
      treatmentCapacity: Number(state.profile.treatmentCapacity.toFixed(8)),
      receiverTuning: Number(byId("tuning").value),
      outcomes,
      claimBoundary: "Outcome values and audiovisual mappings are authored explanatory receivers, not individual predictions or ontological claims."
    };
  }

  function snapshotPng() {
    fieldCanvas.toBlob((blob) => {
      if (!blob) {
        byId("renderStatus").textContent = "PNG export is unavailable in this browser.";
        return;
      }
      downloadBlob(blob, "substratism-viz.png");
      byId("renderStatus").textContent = "PNG snapshot rendered locally.";
    }, "image/png");
  }

  function downloadState() {
    const payload = JSON.stringify(exportedState(), null, 2);
    downloadBlob(
      new Blob([payload], { type: "application/json" }),
      "substratism-viz-state.json"
    );
    byId("renderStatus").textContent = "Canonical state JSON exported locally.";
  }

  function renderWav() {
    byId("renderStatus").textContent = "Rendering deterministic PCM locally…";
    globalThis.setTimeout(() => {
      try {
        const blob = Audio.renderWave(state.profile, {
          duration: Number(byId("renderDuration").value),
          sampleRate: 48000,
          tuning: Number(byId("tuning").value)
        });
        downloadBlob(blob, "substratism-sonification.wav");
        byId("renderStatus").textContent = "WAV sonification rendered locally.";
      } catch (error) {
        byId("renderStatus").textContent = `WAV render failed: ${error.message}`;
      }
    }, 20);
  }

  function preferredRecorderType() {
    const options = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    return options.find((type) => globalThis.MediaRecorder?.isTypeSupported(type)) || "";
  }

  async function recordWebm() {
    if (state.recording) {
      return;
    }
    if (!fieldCanvas.captureStream || !globalThis.MediaRecorder) {
      byId("renderStatus").textContent = "WEBM recording is unavailable in this browser.";
      return;
    }
    state.recording = true;
    byId("recordWebm").disabled = true;
    const duration = Number(byId("renderDuration").value);
    const includeAudio = byId("recordAudio").checked;
    try {
      if (includeAudio && audioEngine.activeSource !== "generated") {
        await audioEngine.startGenerated(state.profile, {
          tuning: Number(byId("tuning").value)
        });
        byId("startAudio").disabled = true;
        byId("stopAudio").disabled = false;
      }
      const canvasStream = fieldCanvas.captureStream(30);
      const tracks = [...canvasStream.getVideoTracks()];
      const audioStream = includeAudio ? audioEngine.recordingStream() : null;
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks().map((track) => track.clone()));
      }
      const stream = new MediaStream(tracks);
      const mimeType = preferredRecorderType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) {
          chunks.push(event.data);
        }
      });
      const stopped = new Promise((resolve) => recorder.addEventListener("stop", resolve, { once: true }));
      recorder.start(250);
      byId("renderStatus").textContent = `Recording ${duration}s WEBM locally${audioStream ? " with audio" : ""}…`;
      globalThis.setTimeout(() => recorder.stop(), duration * 1000);
      await stopped;
      for (const track of stream.getTracks()) {
        track.stop();
      }
      downloadBlob(
        new Blob(chunks, { type: mimeType || "video/webm" }),
        "substratism-viz.webm"
      );
      byId("renderStatus").textContent = "WEBM visual rendered locally.";
    } catch (error) {
      byId("renderStatus").textContent = `WEBM render failed: ${error.message}`;
    } finally {
      state.recording = false;
      byId("recordWebm").disabled = false;
    }
  }

  function analyserLoop(timestamp) {
    const sensitivity = Number(byId("sensitivity").value) / 100;
    state.metrics = audioEngine.metrics(sensitivity);
    state.visualTime = timestamp / 1000;
    renderer.setMetrics(state.metrics);
    Visuals.drawSpectrum(spectrumCanvas, state.metrics, state.visualTime);
    byId("audioLevel").textContent = `RMS ${state.metrics.level.toFixed(3)}`;
    state.analyserFrame = globalThis.requestAnimationFrame(analyserLoop);
  }

  function wireControls() {
    all('input[name="viewMode"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          setView(radio.value);
        }
      });
    });
    byId("mapFocus").addEventListener("change", () => {
      renderer.setFocusBranch(byId("mapFocus").value);
    });
    all("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = button.dataset.preset;
        if (preset === "lower") {
          setScaleValues([2, 6, 2, 2, 2, 2, 2, 2]);
        } else if (preset === "higher") {
          setScaleValues([6, 2, 6, 6, 6, 6, 6, 6]);
        } else {
          setScaleValues(Array(8).fill(4));
        }
      });
    });
    byId("audioSource").addEventListener("change", () => {
      byId("audioFileLabel").hidden = byId("audioSource").value !== "file";
      if (audioEngine.activeSource !== "none") {
        stopAudio();
      }
    });
    byId("startAudio").addEventListener("click", startAudio);
    byId("stopAudio").addEventListener("click", stopAudio);
    byId("sensitivity").addEventListener("input", () => {
      byId("sensitivityValue").textContent = `${(Number(byId("sensitivity").value) / 100).toFixed(2)}×`;
    });
    byId("tuning").addEventListener("change", updateAudioParameters);
    byId("reducedMotion").addEventListener("change", () => {
      renderer.setReducedMotion(byId("reducedMotion").checked);
    });
    byId("downloadPng").addEventListener("click", snapshotPng);
    byId("downloadState").addEventListener("click", downloadState);
    byId("renderWav").addEventListener("click", renderWav);
    byId("recordWebm").addEventListener("click", recordWebm);
  }

  function initialise() {
    buildScaleControls();
    wireControls();
    const prefersReduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    byId("reducedMotion").checked = Boolean(prefersReduced);
    renderer.setReducedMotion(Boolean(prefersReduced));
    renderer.setFocusBranch("all");
    setView("map");
    setActiveItem(0);
    updateProfile();
    state.analyserFrame = globalThis.requestAnimationFrame(analyserLoop);
  }

  initialise();
})();
