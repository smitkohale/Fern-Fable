/**
 * <hero-cloth>: a block printed runner that drops and unrolls in 3D.
 *
 * Hand written WebGL2, no library (about 7 KB gzipped, three.js alone is 150 KB+).
 * - The print is drawn procedurally on a 2D canvas (no image download).
 * - The roll is an Archimedean spiral in the vertex shader, so the layers of
 *   the roll never overlap; the roll shrinks as the cloth unrolls.
 * - Starts only after the page has loaded and the hero is on screen, renders
 *   for about 8 seconds, then stops (zero work while idle).
 * - Reduced motion: draws the unrolled runner once, no movement.
 * - No WebGL2, fewer than 4 CPU cores or Save Data: the section gets
 *   .is-fallback and shows its photo, or a flat drawing of the runner.
 */

import { compileAsync, drawBerry, drawFern, hexToRgb, isSoftwareRenderer, lookAt, multiply, perspective, seeded } from './gl-kit.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 990px)');

/* ---------- Timeline (ms) ---------- */
const DROP = 650;
const UNROLL_START = 250;
const UNROLL = 1400; /* --dur-hero */
const WAVE_START = 1500;
const WAVE = 3500;
const END = WAVE_START + WAVE + 200;

/* ---------- Cloth geometry (scene units) ---------- */
const CLOTH_WIDTH = 0.95;
const CLOTH_LENGTH = 2.9;
const ROLL_CORE = 0.024; /* innermost radius of the roll */
const ROLL_STEP = 0.0011; /* radius lost per radian, about 7 mm a turn */
const SEGMENTS_U = 24;
const SEGMENTS_V = 160;

const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
};
const clamp01 = (t) => Math.min(Math.max(t, 0), 1);

/* ---------- Palettes from DESIGN.md ---------- */
const PRINTS = {
  dabu: {
    base: '#F3ECDF',
    motif: '#1C2754',
    accent: '#E3A72F',
    border: '#1C2754',
    stripe: '#A3302A',
    motifShape: 'fern',
  },
  winter_berry: {
    base: '#F3ECDF',
    motif: '#2E5B41',
    accent: '#A3302A',
    border: '#2E5B41',
    stripe: '#A3302A',
    motifShape: 'berry',
  },
};

/* Hand control back to the browser between drawing steps so no single task blocks input. */
const yieldToMain = () =>
  window.scheduler && window.scheduler.yield
    ? window.scheduler.yield()
    : new Promise((resolve) => window.setTimeout(resolve, 0));

/* ---------- The print: drawn like a block printer would stamp it ---------- */
async function makePrint(name) {
  const palette = PRINTS[name] || PRINTS.dabu;
  const random = seeded(name === 'winter_berry' ? 2412 : 1907);
  const width = 640;
  const height = Math.round((width * CLOTH_LENGTH) / CLOTH_WIDTH);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  /* Raw cotton with a little slub. */
  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 3500; i += 1) {
    ctx.fillStyle = random() > 0.5 ? 'rgba(120, 96, 60, 0.05)' : 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(random() * width, random() * height, 1 + random() * 3, 1);
  }
  await yieldToMain();

  /* Ink layer: stamped, then speckled so it reads as hand printed. */
  const ink = document.createElement('canvas');
  ink.width = width;
  ink.height = height;
  const ictx = ink.getContext('2d');

  const margin = 92;
  const step = 112;
  for (let row = 0, y = margin + 70; y < height - margin - 40; row += 1, y += step) {
    const offset = row % 2 ? step / 2 : 0;
    for (let x = margin + 40 + offset; x < width - margin - 20; x += step) {
      ictx.save();
      ictx.globalAlpha = 0.84 + random() * 0.14;
      ictx.translate(x + (random() - 0.5) * 4, y + (random() - 0.5) * 4);
      ictx.rotate((random() - 0.5) * 0.12);
      if (palette.motifShape === 'berry') drawBerry(ictx, 78, palette.motif, palette.accent);
      else drawFern(ictx, 82, palette.motif);
      ictx.restore();
    }
    /* Small accent dots between the rows. */
    if (palette.motifShape === 'fern') {
      ictx.fillStyle = palette.accent;
      for (let x = margin + 40 + (row % 2 ? 0 : step / 2); x < width - margin - 20; x += step) {
        ictx.globalAlpha = 0.9;
        ictx.beginPath();
        ictx.arc(x, y + step / 2, 5, 0, Math.PI * 2);
        ictx.fill();
      }
    }
    if (row % 4 === 3) await yieldToMain();
  }
  ictx.globalAlpha = 1;

  /* Borders: a madder stripe, fine lines and a row of stamped teeth. */
  const borders = (horizontal) => {
    const span = horizontal ? width : height;
    for (const edge of [0, 1]) {
      const at = (d) => (edge ? (horizontal ? height : width) - d : d);
      const band = (d, size, colour) => {
        ictx.fillStyle = colour;
        if (horizontal) ictx.fillRect(0, Math.min(at(d), at(d + size)), span, size);
        else ictx.fillRect(Math.min(at(d), at(d + size)), 0, size, span);
      };
      band(18, 26, palette.stripe);
      band(52, 4, palette.border);
      band(76, 3, palette.border);
      ictx.fillStyle = palette.border;
      for (let i = 0; i < span; i += 18) {
        ictx.beginPath();
        if (horizontal) {
          const y0 = at(56);
          const y1 = at(72);
          ictx.moveTo(i, y0);
          ictx.lineTo(i + 9, y1);
          ictx.lineTo(i + 18, y0);
        } else {
          const x0 = at(56);
          const x1 = at(72);
          ictx.moveTo(x0, i);
          ictx.lineTo(x1, i + 9);
          ictx.lineTo(x0, i + 18);
        }
        ictx.fill();
      }
    }
  };
  borders(false);
  borders(true);
  await yieldToMain();

  /* Speckle: little gaps where the block did not take the dye. */
  ictx.globalCompositeOperation = 'destination-out';
  // Squares, not arcs: identical at this size and far cheaper to draw.
  for (let i = 0; i < 7000; i += 1) {
    ictx.globalAlpha = 0.25 + random() * 0.6;
    const size = 0.8 + random() * 2;
    ictx.fillRect(random() * width, random() * height, size, size);
    if (i % 2000 === 1999) await yieldToMain();
  }

  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(ink, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

function modelMatrix(angle, tx, tz) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, tx, 0, tz, 1];
}

/* ---------- Shaders ---------- */
const CLOTH_VERTEX = `#version 300 es
precision highp float;
in vec2 aUv;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform float uLength;
uniform float uWidth;
uniform float uFront;
uniform float uOuter;
uniform float uStep;
uniform float uLift;
uniform float uTime;
uniform float uWave;
out vec2 vUv;
out vec3 vPos;

void main() {
  float x = aUv.y * uLength;
  float z = (aUv.x - 0.5) * uWidth;
  float p = uFront * uLength;
  vec3 pos;
  if (x <= p) {
    float settle = smoothstep(0.0, 0.5, p - x);
    float wave = sin(x * 4.2 - uTime * 1.7) * 0.6 + sin(x * 2.1 + z * 5.0 - uTime * 1.1) * 0.4;
    pos = vec3(x, wave * uWave * settle, z);
  } else {
    // Archimedean spiral: radius shrinks by uStep per radian going into the roll.
    float s = x - p;
    float th = (uOuter - sqrt(max(uOuter * uOuter - 2.0 * uStep * s, 0.0))) / uStep;
    float r = uOuter - uStep * th;
    pos = vec3(p + r * sin(th), uOuter - r * cos(th), z);
  }
  pos.x -= uLength * 0.5;
  pos.y += uLift;
  vec4 world = uModel * vec4(pos, 1.0);
  vPos = world.xyz;
  vUv = aUv;
  gl_Position = uViewProj * world;
}`;

const CLOTH_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vPos;
uniform sampler2D uPrint;
uniform vec3 uBack;
uniform vec3 uLight;
out vec4 outColor;

void main() {
  vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
  float diffuse = abs(dot(n, normalize(uLight)));
  vec3 base = gl_FrontFacing ? texture(uPrint, vUv).rgb : uBack;
  float weave = 0.988 + 0.012 * sin(vUv.x * 1100.0) * sin(vUv.y * 3200.0);
  vec3 colour = base * (0.58 + 0.48 * diffuse) * weave;
  outColor = vec4(colour, 1.0);
}`;

const SHADOW_VERTEX = `#version 300 es
precision highp float;
in vec2 aUv;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform vec2 uHalf;
out vec2 vLocal;

void main() {
  vec2 local = (aUv * 2.0 - 1.0) * uHalf;
  vLocal = local;
  gl_Position = uViewProj * uModel * vec4(local.x, -0.002, local.y, 1.0);
}`;

const SHADOW_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
uniform vec2 uRectCenter;
uniform vec2 uRectHalf;
uniform float uStrength;
out vec4 outColor;

void main() {
  vec2 d = abs(vLocal - uRectCenter) - uRectHalf;
  float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  float alpha = uStrength * (1.0 - smoothstep(-0.03, 0.16, dist));
  outColor = vec4(0.0, 0.0, 0.0, alpha);
}`;

/* ---------- Fallback: a flat drawing of the runner ---------- */
async function showFlatRunner(host, print) {
  const image = await makePrint(print);
  image.className = 'hero__flat-runner';
  image.setAttribute('aria-hidden', 'true');
  host.replaceChildren(image);
}

class HeroCloth extends HTMLElement {
  connectedCallback() {
    this.section = this.closest('.hero');
    this.canvas = this.querySelector('canvas');
    this.print = this.dataset.print || 'dabu';
    this.back = hexToRgb(this.dataset.back || '#E6DCC8');

    const saveData = navigator.connection && navigator.connection.saveData;
    const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    if (saveData || lowPower) {
      this.fallback();
      return;
    }

    const start = () => {
      const run = () => this.whenVisible(() => this.init());
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1200 });
      else window.setTimeout(run, 200);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  disconnectedCallback() {
    this.stop();
    this.resizeObserver?.disconnect();
    this.visibility?.disconnect();
  }

  fallback() {
    this.section?.classList.add('is-fallback');
    if (!this.section?.classList.contains('hero--has-image')) showFlatRunner(this, this.print);
  }

  whenVisible(callback) {
    this.visibility = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      this.isVisible = visible;
      if (visible && !this.started) {
        this.started = true;
        callback();
      } else if (visible && this.pendingFrames) {
        this.loop();
      }
    });
    this.visibility.observe(this);
  }

  async init() {
    // Multisampling is wasted work on high density screens: the pixels are already tiny.
    const antialias = (window.devicePixelRatio || 1) < 2;
    const gl = this.canvas.getContext('webgl2', { antialias, alpha: true, premultipliedAlpha: true });
    if (!gl || isSoftwareRenderer(gl)) {
      this.fallback();
      return;
    }
    this.gl = gl;

    try {
      [this.cloth, this.shadow] = await Promise.all([
        compileAsync(gl, CLOTH_VERTEX, CLOTH_FRAGMENT),
        compileAsync(gl, SHADOW_VERTEX, SHADOW_FRAGMENT),
      ]);
    } catch (error) {
      this.fallback();
      return;
    }

    /* Grid mesh: u across the width, v along the length. */
    const uvs = [];
    for (let j = 0; j <= SEGMENTS_V; j += 1) {
      for (let i = 0; i <= SEGMENTS_U; i += 1) uvs.push(i / SEGMENTS_U, j / SEGMENTS_V);
    }
    const indices = [];
    const row = SEGMENTS_U + 1;
    for (let j = 0; j < SEGMENTS_V; j += 1) {
      for (let i = 0; i < SEGMENTS_U; i += 1) {
        const a = j * row + i;
        indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
      }
    }
    this.indexCount = indices.length;

    this.clothVao = gl.createVertexArray();
    gl.bindVertexArray(this.clothVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.cloth.aUv);
    gl.vertexAttribPointer(this.cloth.aUv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.shadowVao = gl.createVertexArray();
    gl.bindVertexArray(this.shadowVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.shadow.aUv);
    gl.vertexAttribPointer(this.shadow.aUv, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    /* The print, as a mipmapped texture. */
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Each heavy GPU step gets its own task, so none of them adds up to one long block.
    const print = await makePrint(this.print);
    await yieldToMain();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, print);
    await yieldToMain();
    gl.generateMipmap(gl.TEXTURE_2D);
    await yieldToMain();
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);

    gl.enable(gl.DEPTH_TEST);
    /* Our grid winds clockwise seen from above: the printed side faces up. */
    gl.frontFace(gl.CW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.resize();
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      this.requestFrames(1);
    });
    this.resizeObserver.observe(this);

    if (desktop.matches && !reducedMotion.matches) {
      this.section?.addEventListener('pointermove', this.onPointer, { passive: true });
    }

    // Warm-up draw while still invisible: the driver finishes its pipeline set up
    // here, in its own task, instead of inside the first animation frame.
    this.render(0);
    await yieldToMain();

    this.startTime = performance.now();
    this.classList.add('is-ready');
    if (reducedMotion.matches) {
      this.startTime -= END;
      this.requestFrames(1);
    } else {
      this.requestFrames(Infinity);
    }
  }

  onPointer = (event) => {
    const rect = this.getBoundingClientRect();
    this.pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    this.pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    this.requestFrames(60);
  };

  resize() {
    // Phones render at up to 1.5x: the cloth stays sharp and each frame costs far less.
    const ratio = Math.min(window.devicePixelRatio || 1, desktop.matches ? 2 : 1.5);
    const width = Math.max(1, Math.round(this.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  requestFrames(count) {
    this.pendingFrames = Math.max(this.pendingFrames || 0, count);
    this.loop();
  }

  loop() {
    if (this.frame || !this.isVisible) return;
    this.frame = requestAnimationFrame((now) => {
      this.frame = null;
      const elapsed = now - this.startTime;
      this.render(elapsed);
      if (elapsed < END && this.pendingFrames === Infinity) {
        this.loop();
        return;
      }
      if (this.pendingFrames === Infinity) this.pendingFrames = 0;
      if (this.pendingFrames > 0) {
        this.pendingFrames -= 1;
        this.loop();
      }
    });
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  render(elapsed) {
    const gl = this.gl;
    const t = Math.min(elapsed, END);
    const isDesktop = desktop.matches;

    /* Animation state */
    const lift = 0.7 * (1 - ease.outCubic(clamp01(t / DROP)));
    const front = ease.outQuint(clamp01((t - UNROLL_START) / UNROLL));
    const waveIn = clamp01((t - WAVE_START) / 500);
    const waveOut = 1 - clamp01((t - WAVE_START) / WAVE);
    const wave = 0.02 * waveIn * waveOut * waveOut;
    const remaining = CLOTH_LENGTH * (1 - front);
    const outer = Math.sqrt(ROLL_CORE * ROLL_CORE + 2 * ROLL_STEP * remaining);

    /* Camera with a little pointer parallax */
    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.08;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.08;
    const aspect = this.canvas.width / this.canvas.height;
    const eye = isDesktop
      ? [0.3 + this.pointer.x * 0.2, 3.5 - this.pointer.y * 0.14, 2.7]
      : [0, 4.6, 2.5];
    const target = isDesktop ? [0.35, 0, -0.35] : [0, 0, -0.4];
    const fov = isDesktop ? 0.6 : 0.62;
    const viewProj = multiply(perspective(fov, aspect, 0.1, 20), lookAt(eye, target, [0, 1, 0]));

    /* Desktop: runner lies across the top right, clear of the words. Mobile: centred. */
    const angle = isDesktop ? 0.36 : 0.5;
    const offsetX = isDesktop ? Math.min(1.5, 0.74 * aspect) : 0;
    const offsetZ = isDesktop ? -1.1 : 0;
    const model = modelMatrix(angle, offsetX, offsetZ);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Soft contact shadow under the unrolled part and the roll */
    const covered = front * CLOTH_LENGTH + outer * 2;
    gl.depthMask(false);
    gl.useProgram(this.shadow.program);
    gl.bindVertexArray(this.shadowVao);
    gl.uniformMatrix4fv(this.shadow.uniforms.uViewProj, false, viewProj);
    gl.uniformMatrix4fv(this.shadow.uniforms.uModel, false, model);
    gl.uniform2f(this.shadow.uniforms.uHalf, CLOTH_LENGTH / 2 + 0.4, CLOTH_WIDTH / 2 + 0.4);
    gl.uniform2f(this.shadow.uniforms.uRectCenter, -CLOTH_LENGTH / 2 + covered / 2, 0);
    gl.uniform2f(this.shadow.uniforms.uRectHalf, covered / 2, CLOTH_WIDTH / 2);
    gl.uniform1f(this.shadow.uniforms.uStrength, 0.5 * (1 - clamp01(lift / 0.5)));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.depthMask(true);

    /* The cloth */
    gl.useProgram(this.cloth.program);
    gl.bindVertexArray(this.clothVao);
    const u = this.cloth.uniforms;
    gl.uniformMatrix4fv(u.uViewProj, false, viewProj);
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform1f(u.uLength, CLOTH_LENGTH);
    gl.uniform1f(u.uWidth, CLOTH_WIDTH);
    gl.uniform1f(u.uFront, front);
    gl.uniform1f(u.uOuter, outer);
    gl.uniform1f(u.uStep, ROLL_STEP);
    gl.uniform1f(u.uLift, lift);
    gl.uniform1f(u.uTime, t / 1000);
    gl.uniform1f(u.uWave, wave);
    gl.uniform3fv(u.uBack, this.back);
    gl.uniform3f(u.uLight, -0.4, 1.0, 0.6);
    gl.uniform1i(u.uPrint, 0);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
}

if (!customElements.get('hero-cloth')) {
  customElements.define('hero-cloth', HeroCloth);
}
