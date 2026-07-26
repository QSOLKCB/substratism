// SPDX-License-Identifier: MIT
(function (global, factory) {
  const core = global.SubstratismCore || (
    typeof require !== "undefined" ? require("./substratism-core.js") : null
  );
  const api = factory(core);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.SubstratismVisuals = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Core) {
  "use strict";

  if (!Core) {
    throw new Error("SubstratismCore must load before SubstratismVisuals.");
  }

  const PALETTE = Object.freeze({
    background: "#070909",
    surface: "#0c1010",
    grid: "#29312f",
    line: "#44504d",
    ink: "#e5e4dc",
    muted: "#929b96",
    dim: "#5d6864",
    amber: "#d4a85f",
    amberBright: "#efd18d",
    oxide: "#b76e55",
    mineral: "#70a39a",
    biological: "#d4a85f",
    digital: "#70a39a",
    neutral: "#9d9482"
  });

  const MAP = Object.freeze([
    {
      title: "Definition and core concept",
      key: "definition",
      children: [
        "Non-biological substrate",
        "Chips rather than neurons",
        "Direct substrate bias",
        "Indirect capacity denial"
      ]
    },
    {
      title: "8-item validated scale",
      key: "scale",
      children: [
        "Unidimensional · 8 items",
        "7-point · item 2 reversed",
        "α = 0.84–0.91",
        "Substrate · rights · tools · capacity"
      ]
    },
    {
      title: "Relation to other prejudices",
      key: "relations",
      children: [
        "Racism / sexism / homophobia: n.s.",
        "Speciesism .12 · transphobia .14",
        "Xenophobia .10 · SDO .01–.03",
        "Demographic paradox"
      ]
    },
    {
      title: "Moral and behavioural impact",
      key: "impact",
      children: [
        "Dilemmas β −.29 / −.23",
        "Donations β −.25 / −.31",
        "Advocacy OR .66 / .74",
        "Persists with sentience controls"
      ]
    }
  ]);

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function bezier(context, fromX, fromY, toX, toY) {
    const bend = Math.max(24, (toX - fromX) * 0.48);
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.bezierCurveTo(fromX + bend, fromY, toX - bend, toY, toX, toY);
    context.stroke();
  }

  function fitText(context, text, maxWidth) {
    if (context.measureText(text).width <= maxWidth) {
      return text;
    }
    let shortened = text;
    while (shortened.length > 4 && context.measureText(`${shortened}…`).width > maxWidth) {
      shortened = shortened.slice(0, -1);
    }
    return `${shortened}…`;
  }

  function prepareCanvas(canvas, minimumHeight) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(minimumHeight, Math.round(rect.height || minimumHeight));
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, width, height, dpr };
  }

  function drawGrid(context, width, height, time, metrics) {
    context.fillStyle = PALETTE.background;
    context.fillRect(0, 0, width, height);
    context.save();
    const cell = 34 + metrics.bass * 10;
    const offset = (time * (3 + metrics.mid * 9)) % cell;
    context.strokeStyle = PALETTE.grid;
    context.globalAlpha = 0.22 + metrics.level * 0.16;
    context.lineWidth = 1;
    for (let x = -cell + offset; x < width + cell; x += cell) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = -cell + offset * 0.4; y < height + cell; y += cell) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.restore();
  }

  function node(
    context,
    x,
    y,
    width,
    height,
    label,
    options
  ) {
    const active = Boolean(options?.active);
    const accent = options?.accent || PALETTE.amber;
    const strength = Core.clamp(Number(options?.strength) || 0, 0, 1);
    context.save();
    if (active || strength > 0.55) {
      context.shadowColor = accent;
      context.shadowBlur = 10 + strength * 18;
    }
    roundedRect(context, x, y, width, height, 3);
    context.fillStyle = options?.root ? "#181712" : "#111817";
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = active ? PALETTE.amberBright : accent;
    context.globalAlpha = active ? 1 : 0.45 + strength * 0.44;
    context.lineWidth = active ? 1.8 : 1;
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = active ? PALETTE.ink : PALETTE.muted;
    context.font = `${options?.root ? 700 : 600} ${options?.fontSize || 11}px ui-monospace, monospace`;
    context.textBaseline = "middle";
    const fitted = fitText(context, label, width - 18);
    context.fillText(fitted, x + 9, y + height / 2);
    context.restore();
  }

  function branchStrength(branch, profile, metrics) {
    switch (branch) {
      case "definition":
        return 0.42 + metrics.high * 0.42;
      case "scale":
        return 0.35 + Math.abs(profile.contrast) / 6 * 0.35 + metrics.mid * 0.3;
      case "relations":
        return 0.32 + (1 - profile.normalised) * 0.22 + metrics.high * 0.34;
      case "impact":
        return 0.35 + profile.normalised * 0.45 + metrics.bass * 0.2;
      default:
        return 0.4;
    }
  }

  class FieldRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.view = "map";
      this.profile = Core.scoreResponses([4, 4, 4, 4, 4, 4, 4, 4]);
      this.outcomes = Core.outcomeProfile(this.profile.score);
      this.metrics = {
        level: 0,
        bass: 0,
        mid: 0,
        high: 0,
        spectrum: new Uint8Array(64)
      };
      this.activeItem = -1;
      this.focusBranch = "all";
      this.time = 0;
      this.reducedMotion = false;
      this.frame = 0;
      this.lastTime = 0;
      this.animate = this.animate.bind(this);
      this.frame = global.requestAnimationFrame(this.animate);
    }

    setView(view) {
      this.view = ["map", "scale", "outcomes", "coefficients"].includes(view)
        ? view
        : "map";
    }

    setProfile(profile) {
      this.profile = profile;
      this.outcomes = Core.outcomeProfile(profile.score);
    }

    setMetrics(metrics) {
      this.metrics = metrics;
    }

    setActiveItem(index) {
      this.activeItem = Number.isInteger(index) ? index : -1;
    }

    setFocusBranch(branch) {
      this.focusBranch = branch;
    }

    setReducedMotion(reduced) {
      this.reducedMotion = Boolean(reduced);
    }

    destroy() {
      global.cancelAnimationFrame(this.frame);
    }

    animate(timestamp) {
      const delta = this.lastTime ? Math.min(0.05, (timestamp - this.lastTime) / 1000) : 0;
      this.lastTime = timestamp;
      if (!this.reducedMotion) {
        this.time += delta;
      }
      this.draw();
      this.frame = global.requestAnimationFrame(this.animate);
    }

    draw() {
      const { context, width, height } = prepareCanvas(this.canvas, 560);
      drawGrid(context, width, height, this.time, this.metrics);
      switch (this.view) {
        case "scale":
          this.drawScale(context, width, height);
          break;
        case "outcomes":
          this.drawOutcomes(context, width, height);
          break;
        case "coefficients":
          this.drawCoefficients(context, width, height);
          break;
        default:
          this.drawMap(context, width, height);
      }
    }

    drawMap(context, width, height) {
      const compact = width < 760;
      const rootX = compact ? 24 : 34;
      const rootW = compact ? 130 : 170;
      const rootH = 40;
      const rootY = height / 2 - rootH / 2;
      const branchX = compact ? width * 0.34 : width * 0.30;
      const branchW = compact ? width * 0.26 : Math.min(210, width * 0.23);
      const childX = compact ? width * 0.66 : width * 0.64;
      const childW = width - childX - 24;
      const branchH = 38;
      const branchYs = [
        height * 0.13,
        height * 0.37,
        height * 0.63,
        height * 0.87
      ];
      const pulse = 0.5 + Math.sin(this.time * 2.4) * 0.5;

      context.save();
      context.strokeStyle = PALETTE.line;
      context.lineWidth = 1.1 + this.metrics.level * 2.2;
      for (let branchIndex = 0; branchIndex < MAP.length; branchIndex += 1) {
        const branch = MAP[branchIndex];
        const branchY = branchYs[branchIndex] - branchH / 2;
        const strength = branchStrength(branch.key, this.profile, this.metrics);
        const branchFocused = this.focusBranch === "all" || this.focusBranch === branch.key;
        context.globalAlpha = branchFocused ? 0.52 + strength * 0.42 : 0.16;
        context.strokeStyle = branchIndex < 2 ? PALETTE.mineral : PALETTE.amber;
        bezier(
          context,
          rootX + rootW,
          rootY + rootH / 2,
          branchX,
          branchY + branchH / 2
        );

        const childGap = compact ? 7 : 9;
        const childH = compact ? 30 : 31;
        const childrenHeight = branch.children.length * childH
          + (branch.children.length - 1) * childGap;
        const startY = branchYs[branchIndex] - childrenHeight / 2;
        for (let childIndex = 0; childIndex < branch.children.length; childIndex += 1) {
          const childY = startY + childIndex * (childH + childGap);
          const isScaleActive = branch.key === "scale"
            && this.activeItem >= 0
            && childIndex === Math.floor(this.activeItem / 2);
          const isImpactActive = branch.key === "impact"
            && this.activeItem >= 0
            && childIndex === this.activeItem % 4;
          context.globalAlpha = branchFocused
            ? 0.35 + strength * 0.5 + (isScaleActive || isImpactActive ? pulse * 0.15 : 0)
            : 0.11;
          context.strokeStyle = branchIndex % 2 ? PALETTE.mineral : PALETTE.amber;
          bezier(
            context,
            branchX + branchW,
            branchY + branchH / 2,
            childX,
            childY + childH / 2
          );
          node(
            context,
            childX,
            childY,
            childW,
            childH,
            branch.children[childIndex],
            {
              accent: branchIndex % 2 ? PALETTE.mineral : PALETTE.amber,
              active: isScaleActive || isImpactActive,
              strength: branchFocused ? strength : 0.1,
              fontSize: compact ? 8 : 10
            }
          );
        }
        node(
          context,
          branchX,
          branchY,
          branchW,
          branchH,
          branch.title,
          {
            accent: branchIndex < 2 ? PALETTE.mineral : PALETTE.amber,
            active: this.focusBranch === branch.key,
            strength: branchFocused ? strength : 0.1,
            fontSize: compact ? 8 : 10
          }
        );
      }
      context.restore();

      node(context, rootX, rootY, rootW, rootH, "SUBSTRATISM", {
        root: true,
        active: true,
        accent: PALETTE.amber,
        strength: 0.8 + this.metrics.level * 0.2,
        fontSize: compact ? 10 : 12
      });
      context.fillStyle = PALETTE.dim;
      context.font = "9px ui-monospace, monospace";
      context.fillText(
        `configured score ${this.profile.score.toFixed(2)} / 7`,
        rootX,
        rootY + rootH + 17
      );
    }

    drawScale(context, width, height) {
      const centerX = width * 0.5;
      const centerY = height * 0.51;
      const radius = Math.min(width * 0.31, height * 0.34);
      const breathing = this.metrics.level * 18
        + Math.sin(this.time * 1.5) * (2 + this.metrics.mid * 7);

      context.save();
      context.translate(centerX, centerY);
      for (let ring = 1; ring <= 7; ring += 1) {
        context.beginPath();
        for (let index = 0; index < Core.ITEMS.length; index += 1) {
          const angle = -Math.PI / 2 + index / Core.ITEMS.length * Math.PI * 2;
          const r = radius * ring / 7;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (index === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.closePath();
        context.strokeStyle = ring === 4 ? PALETTE.line : PALETTE.grid;
        context.globalAlpha = ring === 4 ? 0.75 : 0.38;
        context.stroke();
      }

      const points = this.profile.corrected.map((value, index) => {
        const angle = -Math.PI / 2 + index / Core.ITEMS.length * Math.PI * 2;
        const r = radius * value / 7 + breathing;
        return {
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          angle,
          value
        };
      });

      context.globalAlpha = 1;
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.closePath();
      const fill = context.createRadialGradient(0, 0, 0, 0, 0, radius);
      fill.addColorStop(0, "rgba(112, 163, 154, 0.10)");
      fill.addColorStop(1, `rgba(212, 168, 95, ${0.12 + this.metrics.bass * 0.2})`);
      context.fillStyle = fill;
      context.fill();
      context.strokeStyle = PALETTE.amberBright;
      context.lineWidth = 1.5 + this.metrics.level * 3;
      context.globalAlpha = 0.84;
      context.stroke();

      points.forEach((point, index) => {
        const active = index === this.activeItem;
        context.beginPath();
        context.arc(point.x, point.y, active ? 7 : 4.5, 0, Math.PI * 2);
        context.fillStyle = Core.ITEMS[index].channel === "substrate"
          ? PALETTE.amber
          : PALETTE.mineral;
        context.shadowColor = context.fillStyle;
        context.shadowBlur = active ? 24 : 5 + this.metrics.high * 10;
        context.fill();
        context.shadowBlur = 0;

        const labelRadius = radius + 38;
        const labelX = Math.cos(point.angle) * labelRadius;
        const labelY = Math.sin(point.angle) * labelRadius;
        context.fillStyle = active ? PALETTE.ink : PALETTE.muted;
        context.font = `${active ? 700 : 550} 10px ui-monospace, monospace`;
        context.textAlign = Math.cos(point.angle) > 0.2
          ? "left"
          : Math.cos(point.angle) < -0.2 ? "right" : "center";
        context.textBaseline = "middle";
        context.fillText(
          `${index + 1} · ${Core.ITEMS[index].short}`,
          labelX,
          labelY
        );
      });

      context.textAlign = "center";
      context.fillStyle = PALETTE.ink;
      context.font = "700 29px ui-monospace, monospace";
      context.fillText(this.profile.score.toFixed(2), 0, -3);
      context.fillStyle = PALETTE.muted;
      context.font = "10px ui-monospace, monospace";
      context.fillText("corrected mean / 7", 0, 18);
      context.restore();
    }

    drawOutcomes(context, width, height) {
      const left = Math.max(24, width * 0.05);
      const right = width - left;
      const top = 54;
      const rowHeight = (height - top - 34) / this.outcomes.length;

      this.outcomes.forEach((outcome, index) => {
        const y = top + index * rowHeight;
        const barY = y + 35;
        const barHeight = Math.max(14, rowHeight * 0.22);
        const t = (outcome.value - outcome.minimum)
          / (outcome.maximum - outcome.minimum);
        const markerX = left + t * (right - left);
        const shimmer = Math.sin(this.time * 2.2 + index) * this.metrics.mid * 7;

        context.fillStyle = PALETTE.ink;
        context.font = "650 12px ui-monospace, monospace";
        context.textAlign = "left";
        context.fillText(outcome.label, left, y + 13);
        context.fillStyle = PALETTE.muted;
        context.font = "10px ui-monospace, monospace";
        context.fillText(`${outcome.context} · ${outcome.study}`, left, y + 28);
        context.textAlign = "right";
        context.fillStyle = PALETTE.amberBright;
        context.font = "700 13px ui-monospace, monospace";
        context.fillText(Core.displayOutcome(outcome), right, y + 19);

        const gradient = context.createLinearGradient(left, 0, right, 0);
        gradient.addColorStop(0, PALETTE.biological);
        gradient.addColorStop(0.5, PALETTE.neutral);
        gradient.addColorStop(1, PALETTE.digital);
        context.fillStyle = "#151a19";
        context.fillRect(left, barY, right - left, barHeight);
        context.globalAlpha = 0.42 + this.metrics.level * 0.3;
        context.fillStyle = gradient;
        context.fillRect(left, barY, right - left, barHeight);
        context.globalAlpha = 1;
        context.strokeStyle = PALETTE.line;
        context.strokeRect(left, barY, right - left, barHeight);

        context.beginPath();
        context.arc(
          markerX + shimmer,
          barY + barHeight / 2,
          6 + this.metrics.bass * 7,
          0,
          Math.PI * 2
        );
        context.fillStyle = PALETTE.ink;
        context.shadowColor = t > 0.5 ? PALETTE.digital : PALETTE.biological;
        context.shadowBlur = 12 + this.metrics.high * 16;
        context.fill();
        context.shadowBlur = 0;
      });

      context.textAlign = "left";
      context.fillStyle = PALETTE.amber;
      context.font = "9px ui-monospace, monospace";
      context.fillText("BIOLOGICAL PRIORITY", left, height - 12);
      context.textAlign = "right";
      context.fillStyle = PALETTE.mineral;
      context.fillText("DIGITAL PRIORITY", right, height - 12);
    }

    drawCoefficients(context, width, height) {
      const predictors = Object.keys(Core.PREDICTOR_LABELS);
      const left = Math.max(130, width * 0.22);
      const top = 58;
      const rowHeight = (height - top - 22) / Core.REGRESSION_RECEIVERS.length;
      const centerX = left + (width - left - 30) * 0.5;
      const halfWidth = (width - left - 40) * 0.44;

      context.strokeStyle = PALETTE.line;
      context.globalAlpha = 0.7;
      context.beginPath();
      context.moveTo(centerX, 28);
      context.lineTo(centerX, height - 18);
      context.stroke();
      context.globalAlpha = 1;

      Core.REGRESSION_RECEIVERS.forEach((receiver, row) => {
        const y = top + row * rowHeight;
        context.textAlign = "right";
        context.fillStyle = PALETTE.muted;
        context.font = "10px ui-monospace, monospace";
        context.fillText(receiver.outcome, left - 14, y + 3);

        predictors.forEach((predictor, index) => {
          const raw = receiver.values[predictor];
          const neutral = receiver.metric === "OR" ? 1 : 0;
          const effect = receiver.metric === "OR" ? Math.log(raw) : raw;
          const scale = receiver.metric === "OR" ? 0.55 : 0.35;
          const barLength = Core.clamp(effect / scale, -1, 1) * halfWidth;
          const spread = (index - (predictors.length - 1) / 2) * 5.2;
          const active = predictor === "substratism";
          const audioPush = Math.sin(this.time * 2.4 + row + index) * this.metrics.high * 3;
          context.strokeStyle = active ? PALETTE.amber : PALETTE.mineral;
          context.globalAlpha = active ? 0.95 : 0.36;
          context.lineWidth = active ? 4 : 2;
          context.beginPath();
          context.moveTo(centerX, y + spread);
          context.lineTo(centerX + barLength + audioPush, y + spread);
          context.stroke();
          context.beginPath();
          context.arc(
            centerX + barLength + audioPush,
            y + spread,
            active ? 4.5 : 2.5,
            0,
            Math.PI * 2
          );
          context.fillStyle = active ? PALETTE.amberBright : PALETTE.mineral;
          context.fill();

          if (index === 0) {
            context.textAlign = barLength < 0 ? "right" : "left";
            context.fillStyle = PALETTE.amberBright;
            context.font = "700 10px ui-monospace, monospace";
            context.fillText(
              `${receiver.metric} ${raw.toFixed(2)}`,
              centerX + barLength + (barLength < 0 ? -8 : 8),
              y + spread + 3
            );
          }
          void neutral;
        });
      });

      context.textAlign = "left";
      context.globalAlpha = 1;
      context.font = "9px ui-monospace, monospace";
      let legendX = 20;
      predictors.forEach((predictor) => {
        const label = Core.PREDICTOR_LABELS[predictor];
        context.fillStyle = predictor === "substratism" ? PALETTE.amber : PALETTE.mineral;
        context.fillRect(legendX, 20, 10, 2);
        context.fillStyle = PALETTE.muted;
        context.fillText(label, legendX + 15, 23);
        legendX += context.measureText(label).width + 34;
      });
    }
  }

  function drawSpectrum(canvas, metrics, time) {
    const { context, width, height } = prepareCanvas(canvas, 110);
    context.fillStyle = PALETTE.background;
    context.fillRect(0, 0, width, height);
    const spectrum = metrics?.spectrum || new Uint8Array(64);
    const gap = 2;
    const barWidth = Math.max(1, (width - gap * (spectrum.length - 1)) / spectrum.length);
    for (let index = 0; index < spectrum.length; index += 1) {
      const value = spectrum[index] / 255;
      const barHeight = Math.max(1, value * (height - 16));
      const mix = index / Math.max(1, spectrum.length - 1);
      context.fillStyle = mix < 0.5 ? PALETTE.amber : PALETTE.mineral;
      context.globalAlpha = 0.4 + value * 0.58;
      context.fillRect(
        index * (barWidth + gap),
        height - barHeight,
        barWidth,
        barHeight
      );
    }
    context.globalAlpha = 0.5;
    context.strokeStyle = PALETTE.ink;
    context.beginPath();
    const y = height - 8 - (metrics?.level || 0) * (height - 20);
    context.moveTo(0, y);
    for (let x = 0; x <= width; x += 12) {
      context.lineTo(
        x,
        y + Math.sin(x * 0.04 + time * 5) * (metrics?.level || 0) * 9
      );
    }
    context.stroke();
    context.globalAlpha = 1;
  }

  return Object.freeze({
    MAP,
    PALETTE,
    prepareCanvas,
    drawSpectrum,
    FieldRenderer
  });
});
