// SPDX-License-Identifier: MIT
const test = require("node:test");
const assert = require("node:assert/strict");

const Core = require("../js/substratism-core.js");
const Audio = require("../js/sonification.js");

test("ships the exact eight-item scale with one reverse-scored item", () => {
  assert.equal(Core.ITEMS.length, 8);
  assert.deepEqual(
    Core.ITEMS.filter((item) => item.reverse).map((item) => item.id),
    [2]
  );
  assert.match(Core.ITEMS[0].statement, /computer chips instead of neurons/);
  assert.match(Core.ITEMS[7].statement, /fake intelligence/);
});

test("scores lower, midpoint, and higher configurations correctly", () => {
  const lower = Core.scoreResponses([1, 7, 1, 1, 1, 1, 1, 1]);
  const midpoint = Core.scoreResponses(Array(8).fill(4));
  const higher = Core.scoreResponses([7, 1, 7, 7, 7, 7, 7, 7]);
  assert.equal(lower.score, 1);
  assert.equal(midpoint.score, 4);
  assert.equal(higher.score, 7);
  assert.equal(lower.corrected[1], 1);
  assert.equal(higher.corrected[1], 7);
});

test("separates the four explicit and four treatment/capacity channels", () => {
  const profile = Core.scoreResponses([7, 7, 7, 1, 7, 1, 7, 1]);
  assert.equal(profile.substrateExplicit, 7);
  assert.equal(profile.treatmentCapacity, 1);
  assert.equal(profile.contrast, 6);
});

test("reconstructs published sample means at each study mean", () => {
  const study4 = Core.outcomeProfile(4.71);
  assert.equal(study4[0].value, 3.07);
  assert.equal(study4[1].value, 3.35);
  assert.ok(Math.abs(study4[4].value - 0.28) < 1e-12);

  const study5 = Core.outcomeProfile(4.82);
  assert.equal(study5[2].value, 17.14);
  assert.equal(study5[3].value, 20.48);
  assert.ok(Math.abs(study5[5].value - 0.20) < 1e-12);
});

test("association receivers move monotonically with score", () => {
  const lower = Core.outcomeProfile(1);
  const higher = Core.outcomeProfile(7);
  for (let index = 0; index < lower.length; index += 1) {
    assert.ok(
      lower[index].value > higher[index].value,
      `${lower[index].id} should decrease as configured substratism increases`
    );
  }
});

test("centralizes the chart's exact coefficient fixtures", () => {
  assert.equal(Core.REGRESSION_RECEIVERS.length, 6);
  assert.equal(
    Core.REGRESSION_RECEIVERS.find((row) => row.id === "animal-donation")
      .values.substratism,
    -0.31
  );
  assert.equal(
    Core.REGRESSION_RECEIVERS.find((row) => row.id === "charity-link")
      .values.moralExpansiveness,
    1.56
  );
  assert.equal(
    Core.REGRESSION_RECEIVERS.find((row) => row.id === "petition-link")
      .values.substratism,
    0.74
  );
});

test("centralizes the supplied relation-map fixtures", () => {
  assert.equal(
    Core.RELATION_FIXTURES.find((fixture) => fixture.label === "Speciesism").minimum,
    0.12
  );
  assert.equal(
    Core.RELATION_FIXTURES.find((fixture) => fixture.label === "Transphobia").maximum,
    0.14
  );
  assert.deepEqual(
    Core.RELATION_FIXTURES
      .find((fixture) => fixture.label === "Social dominance orientation"),
    {
      label: "Social dominance orientation",
      minimum: 0.01,
      maximum: 0.03,
      significance: "uncorrelated"
    }
  );
});

test("creates deterministic receiver seeds and WAV output", async () => {
  const profile = Core.scoreResponses([4, 3, 5, 2, 6, 1, 7, 4]);
  assert.equal(Core.responseSeed(profile.raw), Core.responseSeed(profile.raw));
  const first = Audio.renderWave(profile, {
    duration: 4,
    sampleRate: 8000,
    tuning: 432
  });
  const second = Audio.renderWave(profile, {
    duration: 4,
    sampleRate: 8000,
    tuning: 432
  });
  assert.equal(first.size, 64044);
  assert.deepEqual(
    Buffer.from(await first.arrayBuffer()),
    Buffer.from(await second.arrayBuffer())
  );
});

test("maps higher configured scores to the declared voice balance", () => {
  const lower = Core.sonificationParameters(
    Core.scoreResponses([1, 7, 1, 1, 1, 1, 1, 1]),
    432
  );
  const higher = Core.sonificationParameters(
    Core.scoreResponses([7, 1, 7, 7, 7, 7, 7, 7]),
    432
  );
  assert.ok(lower.digitalGain > higher.digitalGain);
  assert.ok(lower.biologicalGain < higher.biologicalGain);
  assert.ok(lower.filterFrequency > higher.filterFrequency);
  assert.ok(lower.tempo < higher.tempo);
});
