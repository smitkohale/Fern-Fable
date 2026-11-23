/**
 * Shared helpers for the hand written WebGL2 scenes (hero cloth, craft block)
 * and the procedural block print motifs. No library.
 */

/* Seeded random so the print looks the same on every visit. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- Block print motifs (2D canvas, centred on 0,0) ---------- */
export function drawFern(ctx, size, colour) {
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.055;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.5);
  ctx.quadraticCurveTo(size * 0.09, 0, 0, -size * 0.52);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    const t = i / 6;
    const y = size * 0.38 - t * size * 0.82;
    const len = size * (0.36 - t * 0.22);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(size * 0.04 * (1 - t), y);
      ctx.rotate(-side * (0.75 - t * 0.25));
      ctx.beginPath();
      ctx.ellipse(side * len * 0.5, 0, len * 0.5, len * 0.17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.54, size * 0.045, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBerry(ctx, size, colour, accent) {
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.48);
  ctx.quadraticCurveTo(-size * 0.08, 0, size * 0.02, -size * 0.3);
  ctx.stroke();
  const leaves = [
    [0.18, -0.6],
    [0.0, 0.7],
    [-0.16, -0.75],
  ];
  leaves.forEach(([y, angle]) => {
    ctx.save();
    ctx.translate(0, y * size);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(size * 0.17, 0, size * 0.18, size * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.fillStyle = accent;
  [
    [0.02, -0.38],
    [0.12, -0.3],
    [-0.08, -0.29],
    [0.04, -0.21],
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x * size, y * size, size * 0.075, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ---------- Small matrix helpers (column major, like GLSL) ---------- */
export function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}

export function lookAt(eye, target, up) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const z = norm(sub(eye, target));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}

export function multiply(a, b) {
  const out = new Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

export function translation(x, y, z) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}

export function rotationX(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

export function rotationY(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

export function scaling(x, y, z) {
  return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
}

/** Multiply any number of matrices, left to right. */
export function chain(...matrices) {
  return matrices.reduce((acc, m) => multiply(acc, m));
}

export function compile(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  [
    [gl.VERTEX_SHADER, vertexSource],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ].forEach(([type, source]) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Shader failed to compile');
    }
    gl.attachShader(program, shader);
  });
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'Program failed to link');
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i += 1) {
    const { name } = gl.getActiveUniform(program, i);
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms, aUv: gl.getAttribLocation(program, 'aUv') };
}

export function hexToRgb(hex) {
  const value = parseInt(hex.replace('#', ''), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/**
 * True when WebGL is running on the CPU (SwiftShader, llvmpipe, Microsoft
 * Basic Render, any "software" renderer). Those devices, and headless audit
 * tools like Lighthouse, get the flat fallback instead of a 3D scene that
 * would block the main thread for seconds.
 */
export function isSoftwareRenderer(gl) {
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(
      info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    ).toLowerCase();
    return /swiftshader|llvmpipe|softpipe|software|basic render/.test(renderer);
  } catch (error) {
    return false;
  }
}

