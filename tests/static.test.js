// SPDX-License-Identifier: MIT
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("ships a dependency-free offline entrypoint", () => {
  const html = read("index.html");
  assert.match(html, /href="style\.css"/);
  assert.match(html, /src="js\/substratism-core\.js"/);
  assert.match(html, /src="js\/sonification\.js"/);
  assert.match(html, /src="js\/visuals\.js"/);
  assert.match(html, /src="js\/app\.js"/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
  assert.doesNotMatch(html, /<link[^>]+href="https?:/i);
  assert.doesNotMatch(html, /type="module"/i);
});

test("contains no runtime network client", () => {
  const scripts = [
    "js/substratism-core.js",
    "js/sonification.js",
    "js/visuals.js",
    "js/app.js"
  ].map(read).join("\n");
  assert.doesNotMatch(scripts, /\bfetch\s*\(/);
  assert.doesNotMatch(scripts, /\bXMLHttpRequest\b/);
  assert.doesNotMatch(scripts, /\bWebSocket\b/);
  assert.doesNotMatch(scripts, /\bEventSource\b/);
});

test("uses unique HTML identifiers and labelled canvases", () => {
  const html = read("index.html");
  const identifiers = Array.from(
    html.matchAll(/\bid="([^"]+)"/g),
    (match) => match[1]
  );
  assert.equal(new Set(identifiers).size, identifiers.length);
  assert.match(html, /id="fieldCanvas"[^>]+role="img"[^>]+aria-label=/);
  assert.match(html, /id="spectrumCanvas"[^>]+role="img"[^>]+aria-label=/);
});

test("preserves the research claim boundary and score caveat", () => {
  const html = read("index.html");
  assert.match(html, /Measurement is not ontology/);
  assert.match(html, /not a diagnostic/);
  assert.match(html, /not the authors’ individual-level fitted predictions/);
  assert.match(html, /defines substratism descriptively/);
});

test("ships local WAV and optional WEBM render paths", () => {
  const html = read("index.html");
  const app = read("js/app.js");
  assert.match(html, /id="renderWav"/);
  assert.match(html, /id="recordWebm"/);
  assert.match(app, /captureStream\(30\)/);
  assert.match(app, /MediaRecorder/);
  assert.match(app, /Audio\.renderWave/);
});

test("marks authored source files with MIT SPDX identifiers", () => {
  for (const relativePath of [
    "index.html",
    "style.css",
    "js/substratism-core.js",
    "js/sonification.js",
    "js/visuals.js",
    "js/app.js",
    "scripts/render_preview.py",
    ".github/workflows/pages.yml",
    ".github/workflows/verify.yml"
  ]) {
    assert.match(read(relativePath).slice(0, 200), /SPDX-License-Identifier: MIT/);
  }
});

test("deploys the static site with current Pages actions", () => {
  const workflow = read(".github/workflows/pages.yml");
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.match(workflow, /path: \./);
});
