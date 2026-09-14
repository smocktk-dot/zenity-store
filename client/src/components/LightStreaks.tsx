import React, { useEffect, useRef } from "react";

interface LightStreaksProps {
  className?: string;
  colors?: string[];
  backgroundColor?: string;
  speed?: number;
  streakCount?: number;
  streakWidth?: number;
  streakLength?: number;
  glow?: number;
  density?: number;
  twinkle?: number;
  zoom?: number;
  backgroundGlow?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
}

const VERTEX_SHADER = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec3 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform vec3 uColor0, uColor1, uColor2, uColor3, uColor4, uColor5, uColor6, uColor7;
uniform int uColorCount;
uniform vec3 uBgColor, uMouseColor;
uniform float uSpeed, uStreakWidth, uStreakLength, uGlow, uDensity, uTwinkle, uZoom, uBgGlow, uOpacity, uMouseEnabled, uMouseStrength, uMouseRadius;
uniform int uStreakCount;
varying vec2 vUv;

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

vec3 tanhv(vec3 x) {
  vec3 e = exp(-2.0 * x);
  return (1.0 - e) / (1.0 + e);
}

vec2 sceneC(vec2 frag, vec2 r) {
  vec2 P = (frag + frag - r) / r.x;
  float z = 0.0;
  float d = 1e3;
  vec4 O = vec4(0.0);
  for (int k = 0; k < 39; k++) {
    if (d <= 1e-4) break;
    O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
    d = 1.0 - sqrt(length(O * O));
    z += d;
  }
  return vec2(O.x, atan(O.z, O.y));
}

void mainImage(out vec4 o, vec2 C) {
  vec2 r = iResolution.xy;
  vec2 uv0 = (C + C - r) / r.x;
  float T = 0.1 * iTime * uSpeed + 9.0;
  float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
  vec2 Y = vec2(5e-3, 6.28318530718 / angRings);
  vec2 c0 = sceneC(C, r);
  vec2 cdx = sceneC(C + vec2(1.0, 0.0), r);
  vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
  vec2 dCx = cdx - c0;
  vec2 dCy = cdy - c0;
  dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5);
  dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
  vec2 fw = abs(dCx) + abs(dCy);
  C = c0;
  vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
  vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);
  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mN = (iMouse + iMouse - r) / r.x;
    float md = length(uv0 - mN);
    mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength;
    O.rgb += uMouseColor * mGlow * 0.25;
  }
  float zr = 5e-4 * uStreakWidth;
  vec2 rr = vec2(max(length(fw), 1e-5));
  float tail = 19.0 / max(uStreakLength, 0.05);
  for (int m = 0; m < 16; m++) {
    if (m >= uStreakCount) break;
    float jf = float(m) + 1.0;
    float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
    vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
    Pp -= floor(Pp / Y + 0.5) * Y;
    float h = fract(8663.0 * ic);
    vec3 col = palette(h);
    float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle);
    weight *= (1.0 + mGlow * 2.0);
    vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
    vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
    O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
    C.x += Y.x / 8.0;
  }
  vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
  o = vec4(colr, uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

function parseColors(colors: string[]) {
  const list = (colors.length ? colors : ["#ffffff", "#888888", "#cccccc"]).slice(0, 8);
  const count = list.length;
  const rgbList: [number, number, number][] = [];
  const avg: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 8; i++) {
    const rgb = hexToRgb(list[Math.min(i, count - 1)]);
    rgbList.push(rgb);
    if (i < count) {
      avg[0] += rgb[0];
      avg[1] += rgb[1];
      avg[2] += rgb[2];
    }
  }
  avg[0] /= count;
  avg[1] /= count;
  avg[2] /= count;
  return { rgbList, count, avg };
}

export default function LightStreaks({
  className = "",
  colors = ["#ffffff", "#888888", "#cccccc"],
  backgroundColor = "#050508",
  speed = 0.4,
  streakCount = 6,
  streakWidth = 1,
  streakLength = 1.2,
  glow = 0.8,
  density = 0.5,
  twinkle = 0.8,
  zoom = 2.5,
  backgroundGlow = 0.3,
  opacity = 0.7,
  mouseInteraction = true,
  mouseStrength = 0.4,
  mouseRadius = 0.8,
}: LightStreaksProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, powerPreference: "high-performance" });
    if (!gl) {
      console.warn("[LightStreaks] WebGL not supported");
      return;
    }

    // Compile vertex shader
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error("[LightStreaks] VS error:", gl.getShaderInfoLog(vs));
      return;
    }

    // Compile fragment shader
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("[LightStreaks] FS error:", gl.getShaderInfoLog(fs));
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[LightStreaks] Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full screen triangle
    const quadVertices = new Float32Array([
      -1, -1, 0, 0,
       3, -1, 2, 0,
      -1,  3, 0, 2,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "position");
    const uvLoc = gl.getAttribLocation(program, "uv");

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);

    // Uniform locations
    const uResLoc = gl.getUniformLocation(program, "iResolution");
    const uMouseLoc = gl.getUniformLocation(program, "iMouse");
    const uTimeLoc = gl.getUniformLocation(program, "iTime");
    const uBgColorLoc = gl.getUniformLocation(program, "uBgColor");
    const uMouseColorLoc = gl.getUniformLocation(program, "uMouseColor");
    const uSpeedLoc = gl.getUniformLocation(program, "uSpeed");
    const uStreakCountLoc = gl.getUniformLocation(program, "uStreakCount");
    const uStreakWidthLoc = gl.getUniformLocation(program, "uStreakWidth");
    const uStreakLengthLoc = gl.getUniformLocation(program, "uStreakLength");
    const uGlowLoc = gl.getUniformLocation(program, "uGlow");
    const uDensityLoc = gl.getUniformLocation(program, "uDensity");
    const uTwinkleLoc = gl.getUniformLocation(program, "uTwinkle");
    const uZoomLoc = gl.getUniformLocation(program, "uZoom");
    const uBgGlowLoc = gl.getUniformLocation(program, "uBgGlow");
    const uOpacityLoc = gl.getUniformLocation(program, "uOpacity");
    const uMouseEnabledLoc = gl.getUniformLocation(program, "uMouseEnabled");
    const uMouseStrengthLoc = gl.getUniformLocation(program, "uMouseStrength");
    const uMouseRadiusLoc = gl.getUniformLocation(program, "uMouseRadius");
    const uColorCountLoc = gl.getUniformLocation(program, "uColorCount");

    const { rgbList, count, avg } = parseColors(colors);
    for (let i = 0; i < 8; i++) {
      const loc = gl.getUniformLocation(program, `uColor${i}`);
      if (loc) gl.uniform3fv(loc, rgbList[i]);
    }

    if (uColorCountLoc) gl.uniform1i(uColorCountLoc, count);
    if (uBgColorLoc) gl.uniform3fv(uBgColorLoc, hexToRgb(backgroundColor));
    if (uMouseColorLoc) gl.uniform3fv(uMouseColorLoc, avg);
    if (uSpeedLoc) gl.uniform1f(uSpeedLoc, speed);
    if (uStreakCountLoc) gl.uniform1i(uStreakCountLoc, Math.max(1, Math.min(16, Math.round(streakCount))));
    if (uStreakWidthLoc) gl.uniform1f(uStreakWidthLoc, streakWidth);
    if (uStreakLengthLoc) gl.uniform1f(uStreakLengthLoc, streakLength);
    if (uGlowLoc) gl.uniform1f(uGlowLoc, glow);
    if (uDensityLoc) gl.uniform1f(uDensityLoc, density);
    if (uTwinkleLoc) gl.uniform1f(uTwinkleLoc, twinkle);
    if (uZoomLoc) gl.uniform1f(uZoomLoc, zoom);
    if (uBgGlowLoc) gl.uniform1f(uBgGlowLoc, backgroundGlow);
    if (uOpacityLoc) gl.uniform1f(uOpacityLoc, opacity);
    if (uMouseEnabledLoc) gl.uniform1f(uMouseEnabledLoc, mouseInteraction ? 1.0 : 0.0);
    if (uMouseStrengthLoc) gl.uniform1f(uMouseStrengthLoc, mouseStrength);
    if (uMouseRadiusLoc) gl.uniform1f(uMouseRadiusLoc, mouseRadius);

    let mouse = [0, 0];
    let targetMouse = [0, 0];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      if (uResLoc) gl.uniform3f(uResLoc, width, height, 1.0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      targetMouse = [(e.clientX - rect.left) * dpr, (rect.height - (e.clientY - rect.top)) * dpr];
    };

    if (mouseInteraction) {
      canvas.addEventListener("pointermove", onPointerMove);
    }

    let animId: number;
    let lastTime = 0;

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      if (uTimeLoc) gl.uniform1f(uTimeLoc, time * 0.001);

      if (lastTime > 0) {
        const dt = (time - lastTime) / 1000;
        const factor = Math.min(1.0, dt * 8.0);
        mouse[0] += (targetMouse[0] - mouse[0]) * factor;
        mouse[1] += (targetMouse[1] - mouse[1]) * factor;
      }
      lastTime = time;

      if (uMouseLoc) gl.uniform2f(uMouseLoc, mouse[0], mouse[1]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      if (mouseInteraction) {
        canvas.removeEventListener("pointermove", onPointerMove);
      }
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [
    colors,
    backgroundColor,
    speed,
    streakCount,
    streakWidth,
    streakLength,
    glow,
    density,
    twinkle,
    zoom,
    backgroundGlow,
    opacity,
    mouseInteraction,
    mouseStrength,
    mouseRadius,
  ]);

  return <div ref={containerRef} className={`w-full h-full relative overflow-hidden ${className}`} />;
}
