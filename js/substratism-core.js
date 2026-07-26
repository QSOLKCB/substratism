// SPDX-License-Identifier: MIT
(function (global, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.SubstratismCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCALE_MIN = 1;
  const SCALE_MAX = 7;
  const REVERSE_ITEM_INDEX = 1;

  const ITEMS = Object.freeze([
    {
      id: 1,
      short: "Chips ≠ neurons",
      statement: "The fact that artificial intelligences are made with computer chips instead of neurons means that they cannot matter morally.",
      channel: "substrate",
      classifications: Object.freeze(["Substrate-Explicit"]),
      reverse: false
    },
    {
      id: 2,
      short: "AI rights",
      statement: "Artificial intelligences should have rights.",
      channel: "treatment",
      classifications: Object.freeze([
        "Substrate-Explicit",
        "Functional Limit",
        "General Rights",
        "Implicit"
      ]),
      reverse: true
    },
    {
      id: 3,
      short: "Less consideration",
      statement: "Artificial intelligences deserve less moral consideration due to their non-biological composition.",
      channel: "substrate",
      classifications: Object.freeze(["Substrate-Explicit"]),
      reverse: false
    },
    {
      id: 4,
      short: "Only tools",
      statement: "Artificial intelligences cannot be more than tools.",
      channel: "treatment",
      classifications: Object.freeze(["Functional Limit", "Implicit"]),
      reverse: false
    },
    {
      id: 5,
      short: "Wrong kind of stuff",
      statement: "Artificial intelligences are simply made of the wrong kind of stuff to deserve moral consideration.",
      channel: "substrate",
      classifications: Object.freeze(["Substrate-Explicit"]),
      reverse: false
    },
    {
      id: 6,
      short: "Fake emotions",
      statement: "Artificial intelligences can only have fake emotions.",
      channel: "capacity",
      classifications: Object.freeze(["Capacity Denial", "Implicit"]),
      reverse: false
    },
    {
      id: 7,
      short: "Always inferior",
      statement: "Artificial intelligences should always be treated as inferior to biological intelligences (e.g., humans, animals).",
      channel: "substrate",
      classifications: Object.freeze(["Substrate-Explicit", "Functional Limit"]),
      reverse: false
    },
    {
      id: 8,
      short: "Fake intelligence",
      statement: "Artificial intelligences can only have fake intelligence.",
      channel: "capacity",
      classifications: Object.freeze(["Capacity Denial", "Implicit"]),
      reverse: false
    }
  ]);

  const STUDY_MEANS = Object.freeze({
    study4: 4.71,
    study5: 4.82
  });

  /*
   * Outcome receivers reconstruct an association around the published sample
   * mean. They are explanatory receivers, not the authors' fitted models and
   * not predictions about an individual.
   */
  const OUTCOMES = Object.freeze([
    {
      id: "human-dilemma",
      label: "Digital humans",
      context: "vs 1 biological human",
      kind: "linear",
      study: "Study 4",
      sampleMean: STUDY_MEANS.study4,
      outcomeMean: 3.07,
      slope: -0.52,
      beta: -0.29,
      minimum: 1,
      maximum: 7,
      unit: "/ 7"
    },
    {
      id: "pig-dilemma",
      label: "Digital pigs",
      context: "vs 1 biological pig",
      kind: "linear",
      study: "Study 4",
      sampleMean: STUDY_MEANS.study4,
      outcomeMean: 3.35,
      slope: -0.42,
      beta: -0.23,
      minimum: 1,
      maximum: 7,
      unit: "/ 7"
    },
    {
      id: "human-donation",
      label: "AI welfare",
      context: "vs human charity",
      kind: "linear",
      study: "Study 5",
      sampleMean: STUDY_MEANS.study5,
      outcomeMean: 17.14,
      slope: -4.77,
      beta: -0.25,
      minimum: 0,
      maximum: 100,
      unit: "%"
    },
    {
      id: "animal-donation",
      label: "AI welfare",
      context: "vs animal charity",
      kind: "linear",
      study: "Study 5",
      sampleMean: STUDY_MEANS.study5,
      outcomeMean: 20.48,
      slope: -6.65,
      beta: -0.31,
      minimum: 0,
      maximum: 100,
      unit: "%"
    },
    {
      id: "charity-link",
      label: "AI rights charity",
      context: "learn-more choice",
      kind: "logistic",
      study: "Study 4",
      sampleMean: STUDY_MEANS.study4,
      outcomeMean: 0.28,
      oddsRatio: 0.66,
      minimum: 0,
      maximum: 1,
      unit: "%"
    },
    {
      id: "petition-link",
      label: "AI rights petition",
      context: "learn-more choice",
      kind: "logistic",
      study: "Study 5",
      sampleMean: STUDY_MEANS.study5,
      outcomeMean: 0.20,
      oddsRatio: 0.74,
      minimum: 0,
      maximum: 1,
      unit: "%"
    }
  ]);

  const REGRESSION_RECEIVERS = Object.freeze([
    {
      id: "human-dilemma",
      outcome: "Help digital humans",
      metric: "β",
      values: Object.freeze({
        substratism: -0.29,
        positiveAttitudes: 0.03,
        negativeAttitudes: 0.05,
        moralExpansiveness: -0.05,
        interactionFrequency: 0.01
      })
    },
    {
      id: "pig-dilemma",
      outcome: "Help digital pigs",
      metric: "β",
      values: Object.freeze({
        substratism: -0.23,
        positiveAttitudes: 0.09,
        negativeAttitudes: 0.03,
        moralExpansiveness: -0.09,
        interactionFrequency: 0.04
      })
    },
    {
      id: "human-donation",
      outcome: "AI vs human donation",
      metric: "β",
      values: Object.freeze({
        substratism: -0.25,
        positiveAttitudes: 0.15,
        negativeAttitudes: -0.04,
        moralExpansiveness: -0.06,
        interactionFrequency: 0.07
      })
    },
    {
      id: "animal-donation",
      outcome: "AI vs animal donation",
      metric: "β",
      values: Object.freeze({
        substratism: -0.31,
        positiveAttitudes: 0.05,
        negativeAttitudes: -0.03,
        moralExpansiveness: 0.03,
        interactionFrequency: 0.10
      })
    },
    {
      id: "charity-link",
      outcome: "AI charity learn-more",
      metric: "OR",
      values: Object.freeze({
        substratism: 0.66,
        positiveAttitudes: 1.10,
        negativeAttitudes: 1.17,
        moralExpansiveness: 1.56,
        interactionFrequency: 1.18
      })
    },
    {
      id: "petition-link",
      outcome: "AI petition learn-more",
      metric: "OR",
      values: Object.freeze({
        substratism: 0.74,
        positiveAttitudes: 1.29,
        negativeAttitudes: 1.24,
        moralExpansiveness: 1.03,
        interactionFrequency: 1.27
      })
    }
  ]);

  const PREDICTOR_LABELS = Object.freeze({
    substratism: "Substratism",
    positiveAttitudes: "AI attitudes (+)",
    negativeAttitudes: "AI attitudes (−)",
    moralExpansiveness: "Moral expansiveness",
    interactionFrequency: "AI interaction"
  });

  const RELATION_FIXTURES = Object.freeze([
    Object.freeze({ label: "Speciesism", minimum: 0.12, maximum: 0.12, significance: "weak positive" }),
    Object.freeze({ label: "Transphobia", minimum: 0.14, maximum: 0.14, significance: "weak positive" }),
    Object.freeze({ label: "Xenophobia", minimum: 0.10, maximum: 0.10, significance: "weak positive" }),
    Object.freeze({ label: "Social dominance orientation", minimum: 0.01, maximum: 0.03, significance: "uncorrelated" }),
    Object.freeze({ label: "Right-wing authoritarianism", minimum: 0.08, maximum: 0.13, significance: "weak / inconsistent" }),
    Object.freeze({ label: "Perspective taking", minimum: -0.06, maximum: -0.02, significance: "uncorrelated" }),
    Object.freeze({ label: "Sexism, racism, homophobia", minimum: 0.02, maximum: 0.08, significance: "not statistically significant" })
  ]);

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function normaliseResponses(responses) {
    if (!Array.isArray(responses) || responses.length !== ITEMS.length) {
      throw new TypeError("Eight scale responses are required.");
    }
    return responses.map((value) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        throw new TypeError("Scale responses must be finite numbers.");
      }
      return clamp(numeric, SCALE_MIN, SCALE_MAX);
    });
  }

  function scoreResponses(responses) {
    const raw = normaliseResponses(responses);
    const corrected = raw.map((value, index) => (
      index === REVERSE_ITEM_INDEX ? SCALE_MIN + SCALE_MAX - value : value
    ));
    const substrateValues = [0, 2, 4, 6].map((index) => corrected[index]);
    const treatmentCapacityValues = [1, 3, 5, 7].map((index) => corrected[index]);
    const score = mean(corrected);
    return Object.freeze({
      raw: Object.freeze(raw),
      corrected: Object.freeze(corrected),
      score,
      normalised: (score - SCALE_MIN) / (SCALE_MAX - SCALE_MIN),
      substrateExplicit: mean(substrateValues),
      treatmentCapacity: mean(treatmentCapacityValues),
      contrast: mean(substrateValues) - mean(treatmentCapacityValues)
    });
  }

  function logit(probability) {
    const p = clamp(probability, 1e-9, 1 - 1e-9);
    return Math.log(p / (1 - p));
  }

  function logistic(value) {
    return 1 / (1 + Math.exp(-value));
  }

  function reconstructOutcome(outcome, score) {
    const safeScore = clamp(Number(score), SCALE_MIN, SCALE_MAX);
    let value;
    if (outcome.kind === "logistic") {
      value = logistic(
        logit(outcome.outcomeMean)
        + Math.log(outcome.oddsRatio) * (safeScore - outcome.sampleMean)
      );
    } else {
      value = outcome.outcomeMean + outcome.slope * (safeScore - outcome.sampleMean);
    }
    return {
      ...outcome,
      value: clamp(value, outcome.minimum, outcome.maximum)
    };
  }

  function outcomeProfile(score) {
    return OUTCOMES.map((outcome) => Object.freeze(reconstructOutcome(outcome, score)));
  }

  function displayOutcome(outcome) {
    if (outcome.kind === "logistic" || outcome.maximum === 100) {
      const percent = outcome.kind === "logistic" ? outcome.value * 100 : outcome.value;
      return `${percent.toFixed(1)}%`;
    }
    return `${outcome.value.toFixed(2)} ${outcome.unit}`;
  }

  function xorshift32(seed) {
    let state = (seed >>> 0) || 0x9e3779b9;
    return function random() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 0x100000000;
    };
  }

  function responseSeed(responses) {
    const raw = normaliseResponses(responses);
    let hash = 2166136261;
    for (const value of raw) {
      hash ^= Math.round(value * 1000);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function sonificationParameters(profile, tuning) {
    const score = clamp(profile.score, SCALE_MIN, SCALE_MAX);
    const n = profile.normalised;
    const baseTuning = clamp(Number(tuning) || 432, 400, 480);
    return Object.freeze({
      tuning: baseTuning,
      tempo: 72 + Math.round(n * 36),
      digitalGain: 0.20 - n * 0.12,
      biologicalGain: 0.10 + n * 0.10,
      noiseGain: 0.018 + Math.abs(profile.contrast) * 0.009,
      filterFrequency: 1850 - n * 950,
      pulseWidth: 0.16 + (1 - n) * 0.18,
      digitalBase: baseTuning / 4,
      biologicalBase: baseTuning / 8,
      separation: 3 + n * 9
    });
  }

  return Object.freeze({
    SCALE_MIN,
    SCALE_MAX,
    REVERSE_ITEM_INDEX,
    ITEMS,
    OUTCOMES,
    REGRESSION_RECEIVERS,
    PREDICTOR_LABELS,
    RELATION_FIXTURES,
    clamp,
    mean,
    scoreResponses,
    outcomeProfile,
    displayOutcome,
    responseSeed,
    xorshift32,
    sonificationParameters
  });
});
