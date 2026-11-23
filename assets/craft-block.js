/**
 * <craft-block>: the carved printing block, in hand written WebGL2.
 * Follows the reading progress from <craft-story> (0 to 1):
 *   carve  0.00 to 0.33  the block turns to show its carved fern relief
 *   dye    0.33 to 0.66  it flips face down and dips into a tray of indigo
 *   print  0.66 to 1.00  it presses onto the cloth and lifts, leaving the print
 * The relief is a height map drawn on a 2D canvas; the carving is lit with
 * derivative bump mapping, so the block stays a simple box (no model file).
 * Renders only while the progress is changing. Reduced motion: the finished
 * print, still. No WebGL2 or low power: a flat drawing of the print.
 */
import {
  chain,
  compile,
  drawFern,
  lookAt,
  multiply,
  perspective,
  rotationX,
  rotationY,
  isSoftwareRenderer,
  scaling,
  seeded,
  translation,
} from './gl-kit.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* [progress, x, y, z, tiltX, turnY, dye, print] */
const KEYS = [
  [0.0, 0.0, 1.05, 0.35, -2.05, -0.55, 0, 0],
  [0.26, 0.0, 1.05, 0.35, -2.05, 0.55, 0, 0],
  [0.4, -1.0, 0.85, 0.0, 0.0, 0.0, 0, 0],
  [0.47, -1.0, 0.23, 0.0, 0.0, 0.0, 0, 0],
  [0.53, -1.0, 0.23, 0.0, 0.0, 0.0, 1, 0],
  [0.62, -1.0, 0.85, 0.0, 0.0, 0.0, 1, 0],
  [0.74, 0.85, 0.85, 0.0, 0.0, 0.0, 1, 0],
  [0.81, 0.85, 0.154, 0.0, 0.0, 0.0, 1, 0],
  [0.86, 0.85, 0.154, 0.0, 0.0, 0.0, 1, 1],
  [0.95, 0.85, 1.0, -0.15, -0.5, 0.25, 1, 1],
  [1.0, 0.85, 1.0, -0.15, -0.5, 0.25, 1, 1],
];

const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

function sample(progress) {
  const p = Math.min(Math.max(progress, 0), 1);
  for (let i = 1; i < KEYS.length; i += 1) {
    const a = KEYS[i - 1];
    const b = KEYS[i];
    if (p <= b[0]) {
      const t = smoother((p - a[0]) / (b[0] - a[0] || 1));
      return a.map((value, k) => value + (b[k] - value) * t);
    }
  }
  return KEYS[KEYS.length - 1];
}

/* ---------- Procedural textures ---------- */
function makeWood() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const random = seeded(77);
  ctx.fillStyle = '#7B4B2A';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i += 1) {
    const y = random() * size;
    ctx.strokeStyle = random() > 0.4 ? 'rgba(70, 38, 18, 0.35)' : 'rgba(170, 118, 76, 0.25)';
    ctx.lineWidth = 0.6 + random() * 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.03 + i) * 3 + (random() - 0.5) * 1.5);
    }
    ctx.stroke();
  }
  return canvas;
}

/* White = raised (the part that takes the dye). Blurred for a soft bevel. */
function makeRelief() {
  const size = 512;
  const sharp = document.createElement('canvas');
  sharp.width = size;
  sharp.height = size;
  const ctx = sharp.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 24;
  ctx.strokeRect(36, 36, size - 72, size - 72);
  ctx.lineWidth = 7;
  ctx.strokeRect(78, 78, size - 156, size - 156);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  drawFern(ctx, 300, '#fff');
  ctx.restore();
  ctx.fillStyle = '#fff';
  [
    [58, 58],
    [size - 58, 58],
    [58, size - 58],
    [size - 58, size - 58],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  const soft = document.createElement('canvas');
  soft.width = size;
  soft.height = size;
  const sctx = soft.getContext('2d');
  sctx.filter = 'blur(3px)';
  sctx.drawImage(sharp, 0, 0);
  return soft;
}

/* ---------- Geometry ---------- */
function boxGeometry() {
  const faces = [
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
    [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  ];
  return buildFaces(faces, 0.5);
}

function quadGeometry() {
  /* A flat square centred on the origin, facing up. */
  return buildFaces([[[0, 1, 0], [1, 0, 0], [0, 0, -1]]], 0);
}

/* push = how far each face sits from the centre along its normal (0.5 for a unit cube). */
function buildFaces(faces, push) {
  const data = [];
  const indices = [];
  faces.forEach(([n, u, v], f) => {
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].forEach(([a, b]) => {
      data.push(
        push * n[0] + 0.5 * (a * u[0] + b * v[0]),
        push * n[1] + 0.5 * (a * u[1] + b * v[1]),
        push * n[2] + 0.5 * (a * u[2] + b * v[2]),
        n[0],
        n[1],
        n[2],
        (a + 1) / 2,
        (b + 1) / 2
      );
    });
    const o = f * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return { data: new Float32Array(data), indices: new Uint16Array(indices) };
}

/* ---------- Shaders ---------- */
const VERTEX = `#version 300 es
precision highp float;
in vec3 aPos;
in vec3 aNormal;
in vec2 aUv;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform mat4 uRot;
out vec3 vPos;
out vec3 vNormal;
out vec2 vUv;
void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vPos = world.xyz;
  vNormal = mat3(uRot) * aNormal;
  vUv = aUv;
  gl_Position = uViewProj * world;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vPos;
in vec3 vNormal;
in vec2 vUv;
uniform int uMaterial;
uniform sampler2D uWood;
uniform sampler2D uRelief;
uniform vec3 uColor;
uniform float uDye;
uniform float uPrint;
uniform float uPrintScale;
uniform vec3 uLight;
uniform vec4 uShadow;
out vec4 outColor;

const vec3 INDIGO = vec3(0.11, 0.153, 0.329);
const vec3 KORA = vec3(0.961, 0.937, 0.894);

void main() {
  vec3 n = normalize(vNormal);
  vec3 base;
  if (uMaterial == 0) {
    base = texture(uWood, vUv).rgb;
  } else if (uMaterial == 1) {
    float h = texture(uRelief, vUv).r;
    vec3 dpdx = dFdx(vPos);
    vec3 dpdy = dFdy(vPos);
    float dhx = dFdx(h);
    float dhy = dFdy(h);
    vec3 r1 = cross(dpdy, n);
    vec3 r2 = cross(n, dpdx);
    float det = dot(dpdx, r1);
    vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
    n = normalize(abs(det) * n - grad * 0.06);
    vec3 wood = texture(uWood, vUv * 0.8).rgb;
    vec3 raised = mix(wood * 1.12, INDIGO, uDye * 0.92);
    base = mix(wood * 0.5, raised, smoothstep(0.3, 0.7, h));
  } else if (uMaterial == 2) {
    float weave = 0.975 + 0.025 * sin(vUv.x * 700.0) * sin(vUv.y * 700.0);
    vec2 pu = (vUv - 0.5) * uPrintScale + 0.5;
    float m = 0.0;
    if (pu.x >= 0.0 && pu.x <= 1.0 && pu.y >= 0.0 && pu.y <= 1.0) {
      m = texture(uRelief, pu).r;
    }
    m = smoothstep(0.42, 0.62, m) * uPrint;
    base = mix(KORA * weave, INDIGO, m * 0.92);
  } else {
    base = uColor;
  }
  float diffuse = max(dot(n, normalize(uLight)), 0.0);
  vec3 colour = base * (0.42 + 0.66 * diffuse);
  if (vPos.y < 0.16) {
    float d = length(vPos.xz - uShadow.xy);
    colour *= 1.0 - uShadow.w * (1.0 - smoothstep(uShadow.z * 0.5, uShadow.z * 1.4, d));
  }
  outColor = vec4(colour, 1.0);
}`;

/* ---------- Fallback: the stamped print, flat ---------- */
function drawFlatPrint(host) {
  const relief = makeRelief();
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 640;
  canvas.className = 'craft__flat';
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#F5EFE4';
  ctx.fillRect(0, 0, 640, 640);
  const ink = document.createElement('canvas');
  ink.width = 512;
  ink.height = 512;
  const ictx = ink.getContext('2d');
  ictx.drawImage(relief, 0, 0);
  ictx.globalCompositeOperation = 'source-in';
  ictx.fillStyle = '#1C2754';
  ictx.fillRect(0, 0, 512, 512);
  // Use the relief brightness as the ink's alpha.
  const data = relief.getContext('2d').getImageData(0, 0, 512, 512).data;
  const out = ictx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < data.length; i += 4) {
    out.data[i + 3] = data[i] > 120 ? 235 : 0;
  }
  ictx.putImageData(out, 0, 0);
  ctx.drawImage(ink, 64, 64);
  host.replaceChildren(canvas);
}

class CraftBlock extends HTMLElement {
  connectedCallback() {
    this.canvas = this.querySelector('canvas');
    this.story = this.closest('craft-story');
    this.current = 0;
    this.target = 0;

    const saveData = navigator.connection && navigator.connection.saveData;
    const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    if (saveData || lowPower) {
      this.fallback();
      return;
    }

    this.story?.addEventListener('craft:progress', (event) => {
      this.target = reducedMotion.matches ? 1 : event.detail.progress;
      this.kick();
    });

    // Build the scene shortly before it scrolls into view, after the page has loaded.
    const start = () => {
      this.observer = new IntersectionObserver(
        (entries) => {
          this.isVisible = entries.some((entry) => entry.isIntersecting);
          if (this.isVisible && !this.gl) this.init();
          if (this.isVisible) this.kick();
        },
        { rootMargin: '300px 0px' }
      );
      this.observer.observe(this);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    if (this.frame) cancelAnimationFrame(this.frame);
  }

  fallback() {
    this.classList.add('is-fallback');
    drawFlatPrint(this);
  }

  init() {
    const gl = this.canvas.getContext('webgl2', { antialias: true, alpha: true });
    if (!gl || isSoftwareRenderer(gl)) {
      this.fallback();
      return;
    }
    let program;
    try {
      program = compile(gl, VERTEX, FRAGMENT);
    } catch (error) {
      this.fallback();
      return;
    }
    this.gl = gl;
    this.program = program;

    const makeMesh = ({ data, indices }) => {
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const stride = 8 * 4;
      [
        ['aPos', 3, 0],
        ['aNormal', 3, 12],
        ['aUv', 2, 24],
      ].forEach(([name, size, offset]) => {
        const location = gl.getAttribLocation(program.program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
      });
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      return { vao, count: indices.length };
    };
    this.box = makeMesh(boxGeometry());
    this.quad = makeMesh(quadGeometry());

    const texture = (unit, source, repeat) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    };
    texture(0, makeWood(), true);
    texture(1, makeRelief(), false);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    this.resize();
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      this.render();
    });
    this.resizeObserver.observe(this);

    if (reducedMotion.matches) {
      this.target = 1;
      this.current = 1;
    } else {
      this.target = this.story?.progress ?? 0;
      this.current = this.target;
    }
    this.classList.add('is-ready');
    this.render();
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(this.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /* Ease towards the scroll position; stop drawing once it has caught up. */
  kick() {
    if (!this.gl || this.frame || !this.isVisible) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      const diff = this.target - this.current;
      this.current = Math.abs(diff) < 0.0005 ? this.target : this.current + diff * 0.14;
      this.render();
      if (this.current !== this.target) this.kick();
    });
  }

  draw(mesh, model, rot, material, extra = {}) {
    const gl = this.gl;
    const u = this.program.uniforms;
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniformMatrix4fv(u.uRot, false, rot);
    gl.uniform1i(u.uMaterial, material);
    if (extra.color) gl.uniform3fv(u.uColor, extra.color);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  render() {
    const gl = this.gl;
    if (!gl) return;
    const [, x, y, z, tiltX, turnY, dye, print] = sample(this.current);
    const aspect = this.canvas.width / this.canvas.height;

    /* Camera far enough back to fit the tray and the cloth side by side. */
    const fov = 0.6;
    const distance = Math.max(4.6, 2.1 / (Math.tan(fov / 2) * aspect));
    const target = [-0.05, 0.3, 0];
    const eye = [target[0], target[1] + distance * 0.42, target[2] + distance * 0.91];
    const viewProj = multiply(perspective(fov, aspect, 0.1, 40), lookAt(eye, target, [0, 1, 0]));

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program.program);
    const u = this.program.uniforms;
    gl.uniformMatrix4fv(u.uViewProj, false, viewProj);
    gl.uniform1i(u.uWood, 0);
    gl.uniform1i(u.uRelief, 1);
    gl.uniform3f(u.uLight, -0.4, 1.0, 0.55);
    gl.uniform1f(u.uDye, dye);
    gl.uniform1f(u.uPrint, print);
    gl.uniform1f(u.uPrintScale, 1.55 / 0.88);
    const height = Math.max(y - 0.15, 0);
    gl.uniform4f(u.uShadow, x, z, 0.62, 0.45 * (1 - Math.min(height / 1.0, 1)) + 0.08);

    const identity = translation(0, 0, 0);

    /* Cloth */
    this.draw(this.quad, chain(translation(0.85, 0, 0), scaling(1.55, 1, 1.3)), identity, 2);

    /* Dye tray: base, four rims, indigo */
    const trayWood = [0.33, 0.2, 0.12];
    this.draw(this.box, chain(translation(-1.0, 0.03, 0), scaling(1.18, 0.06, 1.18)), identity, 4, { color: trayWood });
    [
      [0, -0.56, 1.18, 0.06],
      [0, 0.56, 1.18, 0.06],
      [-0.56, 0, 0.06, 1.06],
      [0.56, 0, 0.06, 1.06],
    ].forEach(([dx, dz, sx, sz]) => {
      this.draw(this.box, chain(translation(-1.0 + dx, 0.09, dz), scaling(sx, 0.18, sz)), identity, 4, {
        color: [0.38, 0.23, 0.14],
      });
    });
    this.draw(this.quad, chain(translation(-1.0, 0.1, 0), scaling(1.06, 1, 1.06)), identity, 3, {
      color: [0.09, 0.12, 0.27],
    });

    /* The block: body, handle, carved face */
    const rot = chain(rotationY(turnY), rotationX(tiltX));
    const place = chain(translation(x, y, z), rot);
    this.draw(this.box, chain(place, scaling(0.9, 0.3, 0.9)), rot, 0);
    this.draw(this.box, chain(place, translation(0, 0.3, 0), scaling(0.32, 0.32, 0.32)), rot, 0);
    const faceRot = chain(rot, rotationX(Math.PI));
    this.draw(this.quad, chain(place, translation(0, -0.151, 0), rotationX(Math.PI), scaling(0.88, 1, 0.88)), faceRot, 1);

    gl.bindVertexArray(null);
  }
}

if (!customElements.get('craft-block')) {
  customElements.define('craft-block', CraftBlock);
}
