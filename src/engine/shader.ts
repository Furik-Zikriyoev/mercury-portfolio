export const MAX_BLOBS = 48

export const vertexShader = /* glsl */ `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

/*
 * Поле — сумма вкладов:
 *  - капли: r² / (d² + r²/4), на расстоянии ~0.87r поле = 1;
 *  - текст: 2 · размытая маска букв (край ≈ 1);
 *  - рамка: SDF скруглённого прямоугольника, 1 / (1 + d/L)², L — половина толщины.
 * Поверхность там, где поле > 1. Высота — sqrt(1 - 1/f), нормаль — из её градиента,
 * цвет — отражение процедурного окружения.
 */
export const fragmentShader = /* glsl */ `#version 300 es
precision highp float;

#define MAX_BLOBS ${MAX_BLOBS}

uniform vec2 uRes;
uniform float uPR;
uniform vec4 uBlobs[MAX_BLOBS];
uniform int uBlobCount;

uniform sampler2D uText;
uniform vec4 uTextRect;
uniform float uTextAmount;

uniform vec4 uFrameRect;
uniform vec3 uFrameParams;

// аквариум песочницы: капли с флагом w = 1 видны только внутри него
uniform vec4 uArenaRect;
uniform float uArenaRadius;

uniform float uBevel;
uniform vec2 uLight;
uniform vec3 uAccent;

out vec4 outColor;

float textMask(vec2 uv) {
  return texture(uText, uv).r;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float frameDist(vec2 p) {
  vec2 c = uFrameRect.xy + uFrameRect.zw * 0.5;
  return abs(sdRoundBox(p - c, uFrameRect.zw * 0.5, uFrameParams.x)) - uFrameParams.y * 0.5;
}

void addShape(float d, vec2 gd, float amount, float L, inout float f, inout vec2 g) {
  float x = 1.0 + d / L;
  if (x < 0.02) {
    f += amount * 2500.0;
    return;
  }
  f += amount / (x * x);
  g += amount * (-2.0 / L) / (x * x * x) * gd;
}

vec3 environment(vec3 r) {
  // горизонт опущен: плоские участки, смотрящие на зрителя, отражают светлое небо
  float y = r.y + 0.38 + uLight.y * 0.12;
  float x = r.x + uLight.x * 0.3;
  vec3 sky = mix(vec3(0.46, 0.48, 0.53), vec3(1.0), smoothstep(-0.05, 1.1, y));
  vec3 ground = mix(vec3(0.02), vec3(0.2, 0.2, 0.21), smoothstep(-0.9, -0.1, y));
  vec3 c = mix(ground, sky, smoothstep(-0.06, 0.06, y));
  c += 0.5 * smoothstep(0.45, 0.0, length(vec2((x - 0.38) * 0.8, y - 0.9)));
  c += 0.28 * smoothstep(0.5, 0.0, length(vec2(x + 0.55, (y - 0.6) * 1.4)));
  return c;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uPR;

  float f = 0.0;
  vec2 g = vec2(0.0);
  float fa = 0.0;
  vec2 ga = vec2(0.0);

  for (int i = 0; i < MAX_BLOBS; i++) {
    if (i >= uBlobCount) break;
    vec4 b = uBlobs[i];
    vec2 d = p - b.xy;
    float r2 = b.z * b.z;
    float q = dot(d, d) + 0.25 * r2;
    float v = r2 / q;
    vec2 gv = (-2.0 * r2 / (q * q)) * d;
    if (b.w > 0.5) {
      fa += v;
      ga += gv;
    } else {
      f += v;
      g += gv;
    }
  }

  // металл аквариума обрезается по стеклу: прижимается к стенкам, как жидкость
  if (fa > 0.0 && uArenaRect.z > 0.0) {
    vec2 c = uArenaRect.xy + uArenaRect.zw * 0.5;
    float wall = sdRoundBox(p - c, uArenaRect.zw * 0.5 - 1.5, uArenaRadius);
    float inside = clamp(0.5 - wall, 0.0, 1.0);
    f += fa * inside;
    g += ga * inside;
  }

  if (uTextAmount > 0.001) {
    vec2 uv = (p - uTextRect.xy) / uTextRect.zw;
    if (all(greaterThan(uv, vec2(0.0))) && all(lessThan(uv, vec2(1.0)))) {
      vec2 texel = 1.0 / vec2(textureSize(uText, 0));
      float m = textMask(uv);
      vec2 gm = vec2(
        textMask(uv + vec2(texel.x, 0.0)) - textMask(uv - vec2(texel.x, 0.0)),
        textMask(uv + vec2(0.0, texel.y)) - textMask(uv - vec2(0.0, texel.y))
      ) / (2.0 * texel * uTextRect.zw);
      f += 2.0 * uTextAmount * m;
      g += 2.0 * uTextAmount * gm;
    }
  }

  if (uFrameParams.z > 0.001) {
    float d = frameDist(p);
    vec2 gd = vec2(
      frameDist(p + vec2(1.0, 0.0)) - frameDist(p - vec2(1.0, 0.0)),
      frameDist(p + vec2(0.0, 1.0)) - frameDist(p - vec2(0.0, 1.0))
    ) * 0.5;
    addShape(d, gd, uFrameParams.z, uFrameParams.y * 0.525, f, g);
  }

  if (f < 0.6) {
    outColor = vec4(0.0);
    return;
  }

  float s = max(1.0 - 1.0 / f, 1e-4);
  vec2 slope = g / (f * f) / (2.0 * sqrt(s)) * uBevel;
  // в толще металла (много слившихся капель) поверхность выравнивается, без «ямок»
  slope /= 1.0 + max(f - 1.6, 0.0) * 0.9;
  vec3 n = normalize(vec3(-slope.x, slope.y, 1.0));

  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 col = environment(r);
  col *= mix(0.55, 1.0, pow(n.z, 1.5));
  col += pow(max(dot(r, normalize(vec3(0.4, 0.6, 0.7))), 0.0), 60.0) * 0.8;

  float rim = pow(1.0 - n.z, 2.5) * smoothstep(0.0, 0.9, dot(normalize(n.xy + 1e-5), vec2(0.6, -0.8)));
  col += uAccent * rim * 0.55;

  float w = fwidth(f) * 0.8;
  float a = smoothstep(1.0 - w, 1.0 + w, f);
  outColor = vec4(col * a, a);
}
`
