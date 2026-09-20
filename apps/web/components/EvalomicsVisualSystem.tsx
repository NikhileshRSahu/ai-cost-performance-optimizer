'use client';

import { useEffect, useRef } from 'react';

type LiquidMarkProps = {
  size?: number;
  className?: string;
};

export function LiquidMark({ size = 18, className = '' }: LiquidMarkProps) {
  return (
    <svg
      className={`liquid-mark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Evalomics"
    >
      <defs>
        <linearGradient id="evalomics-liquid-metal" x1="4" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff5e7" />
          <stop offset=".22" stopColor="#ffb35c" />
          <stop offset=".5" stopColor="#ff6b2c" />
          <stop offset=".72" stopColor="#1747b8" />
          <stop offset="1" stopColor="#08090d" />
        </linearGradient>
        <filter id="evalomics-liquid-warp" x="-35%" y="-35%" width="170%" height="170%">
          <feTurbulence type="fractalNoise" baseFrequency=".018 .032" numOctaves="2" seed="9" result="noise">
            <animate attributeName="baseFrequency" dur="9s" values=".018 .032;.024 .018;.018 .032" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </defs>
      <path
        filter="url(#evalomics-liquid-warp)"
        fill="url(#evalomics-liquid-metal)"
        d="M11 16.5C11 11.253 15.253 7 20.5 7h23C48.747 7 53 11.253 53 16.5S48.747 26 43.5 26H28v6h14.5C47.747 32 52 36.253 52 41.5S47.747 51 42.5 51h-22C15.253 51 11 46.747 11 41.5S15.253 32 20.5 32H25v-6h-4.5C15.253 26 11 21.747 11 16.5Z"
      />
      <path
        d="M18 13.5h28"
        stroke="rgba(255,255,255,.76)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity=".72"
      />
    </svg>
  );
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ShaderField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
      premultipliedAlpha: true,
    });
    if (!gl) return;

    const vertex = createShader(
      gl,
      gl.VERTEX_SHADER,
      `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }`,
    );

    const fragment = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      `
      precision highp float;
      uniform vec2 uResolution;
      uniform vec2 uPointer;
      uniform float uTime;

      float softCircle(vec2 uv, vec2 p, float radius, float blur) {
        float d = length(uv - p);
        return 1.0 - smoothstep(radius - blur, radius + blur, d);
      }

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        vec2 p = uPointer;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 q = vec2((uv.x - .5) * aspect + .5, uv.y);

        float t = uTime * .075;
        vec2 driftA = vec2(.73 + sin(t) * .08, .30 + cos(t * .8) * .07);
        vec2 driftB = vec2(.25 + cos(t * .72) * .10, .68 + sin(t * .55) * .08);
        vec2 pointer = vec2((p.x - .5) * aspect + .5, p.y);

        float amber = softCircle(q, driftA, .34, .28);
        float blue = softCircle(q, driftB, .30, .30);
        float focus = softCircle(q, pointer, .20, .22);

        // Faint request/cost trajectories: these are deliberately semantic,
        // not generic particles. Warm traces represent waste signals and
        // cobalt traces represent tested/efficient routes.
        float waveA = .34 + .055 * sin(uv.x * 8.0 + t * 2.2);
        float waveB = .61 + .045 * sin(uv.x * 9.5 - t * 1.8);
        float traceA = 1.0 - smoothstep(.006, .020, abs(uv.y - waveA));
        float traceB = 1.0 - smoothstep(.006, .019, abs(uv.y - waveB));
        float pulseA = pow(max(0.0, sin(uv.x * 23.0 - t * 8.0)), 18.0);
        float pulseB = pow(max(0.0, sin(uv.x * 19.0 + t * 6.0)), 20.0);

        vec3 paper = vec3(.985, .982, .972);
        vec3 warm = vec3(1.0, .48, .12);
        vec3 cobalt = vec3(.09, .28, .72);
        vec3 ink = vec3(.025, .028, .04);

        vec3 color = paper;
        color = mix(color, warm, amber * .28);
        color = mix(color, cobalt, blue * .16);
        color = mix(color, warm, traceA * (.055 + pulseA * .16));
        color = mix(color, cobalt, traceB * (.050 + pulseB * .14));
        color = mix(color, vec3(1.0), focus * .18);

        float grain = (noise(gl_FragCoord.xy + uTime) - .5) * .025;
        color += grain;

        float vignette = smoothstep(.95, .28, distance(uv, vec2(.5)));
        color = mix(paper, color, .74 + vignette * .26);

        gl_FragColor = vec4(color, .98);
      }`,
    );

    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, 'uResolution');
    const pointerUniform = gl.getUniformLocation(program, 'uPointer');
    const timeUniform = gl.getUniformLocation(program, 'uTime');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pointer = { x: .68, y: .34 };
    let raf = 0;
    let running = true;
    const startedAt = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const onPointer = (event: PointerEvent) => {
      pointer = {
        x: Math.min(1, Math.max(0, event.clientX / window.innerWidth)),
        y: 1 - Math.min(1, Math.max(0, event.clientY / window.innerHeight)),
      };
    };

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) raf = requestAnimationFrame(draw);
    };

    const draw = (now: number) => {
      if (!running) return;
      resize();
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(pointerUniform, pointer.x, pointer.y);
      gl.uniform1f(timeUniform, prefersReduced.matches ? 0 : (now - startedAt) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!prefersReduced.matches) raf = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas ref={canvasRef} className="evalomics-shader-field" aria-hidden="true" />;
}
