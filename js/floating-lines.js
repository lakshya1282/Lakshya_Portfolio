// Vanilla JS port of the provided FloatingLines (React + three) component
// Mount with: import { mountFloatingLines } from './floating-lines.js';
// const cleanup = mountFloatingLines(document.getElementById('portfolio-lines'), options)

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const vertexShader = `
precision highp float;
void main(){
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r){ return mat2(cos(r), sin(r), -sin(r), cos(r)); }

vec3 background_color(vec2 uv){
  vec3 col = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor){
  if (lineGradientCount <= 0) return baseColor;
  vec3 gradientColor;
  if (lineGradientCount == 1){
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);
    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];
    gradientColor = mix(c1, c2, f);
  }
  return gradientColor * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend){
  float time = iTime * animationSpeed;
  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;
  if (shouldBend){
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }
  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  if (parallax){ baseUv += parallaxOffset; }
  vec3 col = vec3(0.0);
  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);
  vec2 mouseUv = vec2(0.0);
  if (interactive){
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }
  if (enableBottom){
    for (int i=0;i<bottomLineCount;++i){
      float fi=float(i); float t=fi/max(float(bottomLineCount-1),1.0);
      vec3 lineCol=getLineColor(t,b);
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv, mouseUv, interactive
      ) * 0.2;
    }
  }
  if (enableMiddle){
    for (int i=0;i<middleLineCount;++i){
      float fi=float(i); float t=fi/max(float(middleLineCount-1),1.0);
      vec3 lineCol=getLineColor(t,b);
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv, mouseUv, interactive
      );
    }
  }
  if (enableTop){
    for (int i=0;i<topLineCount;++i){
      float fi=float(i); float t=fi/max(float(topLineCount-1),1.0);
      vec3 lineCol=getLineColor(t,b);
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle); ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv, mouseUv, interactive
      ) * 0.1;
    }
  }
  fragColor = vec4(col, 1.0);
}

void main(){ vec4 color=vec4(0.0); mainImage(color, gl_FragCoord.xy); gl_FragColor=color; }
`;

const MAX_GRADIENT_STOPS = 8;
function hexToVec3(hex){
  let value = (hex||'').trim();
  if (value.startsWith('#')) value = value.slice(1);
  let r=255,g=255,b=255;
  if (value.length===3){
    r=parseInt(value[0]+value[0],16); g=parseInt(value[1]+value[1],16); b=parseInt(value[2]+value[2],16);
  } else if (value.length===6){
    r=parseInt(value.slice(0,2),16); g=parseInt(value.slice(2,4),16); b=parseInt(value.slice(4,6),16);
  }
  return new THREE.Vector3(r/255, g/255, b/255);
}

export function mountFloatingLines(container, options={}){
  if (!container) return () => {};
  const {
    linesGradient,
    enabledWaves=['top','middle','bottom'],
    lineCount=[6],
    lineDistance=[5],
    topWavePosition,
    middleWavePosition,
    bottomWavePosition={ x:2.0, y:-0.7, rotate:-1 },
    animationSpeed=1,
    interactive=true,
    bendRadius=5.0,
    bendStrength=-0.5,
    mouseDamping=0.05,
    parallax=true,
    parallaxStrength=0.2,
    mixBlendMode='screen'
  } = options;

  container.style.mixBlendMode = mixBlendMode;

  const getLineCount = (waveType)=>{
    if (typeof lineCount === 'number') return lineCount;
    if (!enabledWaves.includes(waveType)) return 0;
    const index = enabledWaves.indexOf(waveType);
    return lineCount[index] ?? 6;
  };
  const getLineDistance = (waveType)=>{
    if (typeof lineDistance === 'number') return lineDistance;
    if (!enabledWaves.includes(waveType)) return 0.1;
    const index = enabledWaves.indexOf(waveType);
    return lineDistance[index] ?? 0.1;
  };

  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(1,1,1) },
    animationSpeed: { value: animationSpeed },

    enableTop: { value: enabledWaves.includes('top') },
    enableMiddle: { value: enabledWaves.includes('middle') },
    enableBottom: { value: enabledWaves.includes('bottom') },

    topLineCount: { value: enabledWaves.includes('top') ? getLineCount('top') : 0 },
    middleLineCount: { value: enabledWaves.includes('middle') ? getLineCount('middle') : 0 },
    bottomLineCount: { value: enabledWaves.includes('bottom') ? getLineCount('bottom') : 0 },

    topLineDistance: { value: enabledWaves.includes('top') ? getLineDistance('top') * 0.01 : 0.01 },
    middleLineDistance: { value: enabledWaves.includes('middle') ? getLineDistance('middle') * 0.01 : 0.01 },
    bottomLineDistance: { value: enabledWaves.includes('bottom') ? getLineDistance('bottom') * 0.01 : 0.01 },

    topWavePosition: { value: new THREE.Vector3(topWavePosition?.x ?? 10.0, topWavePosition?.y ?? 0.5, topWavePosition?.rotate ?? -0.4) },
    middleWavePosition: { value: new THREE.Vector3(middleWavePosition?.x ?? 5.0, middleWavePosition?.y ?? 0.0, middleWavePosition?.rotate ?? 0.2) },
    bottomWavePosition: { value: new THREE.Vector3(bottomWavePosition?.x ?? 2.0, bottomWavePosition?.y ?? -0.7, bottomWavePosition?.rotate ?? 0.4) },

    iMouse: { value: new THREE.Vector2(-1000, -1000) },
    interactive: { value: interactive },
    bendRadius: { value: bendRadius },
    bendStrength: { value: bendStrength },
    bendInfluence: { value: 0 },

    parallax: { value: parallax },
    parallaxStrength: { value: parallaxStrength },
    parallaxOffset: { value: new THREE.Vector2(0,0) },

    lineGradient: { value: Array.from({length: MAX_GRADIENT_STOPS}, ()=> new THREE.Vector3(1,1,1)) },
    lineGradientCount: { value: 0 }
  };

  if (linesGradient && linesGradient.length > 0){
    const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS);
    uniforms.lineGradientCount.value = stops.length;
    stops.forEach((hex,i)=>{
      const c = hexToVec3(hex);
      uniforms.lineGradient.value[i].set(c.x,c.y,c.z);
    });
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1); camera.position.z = 1;
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  const geometry = new THREE.PlaneGeometry(2,2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const setSize = ()=>{
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    const canvasWidth = renderer.domElement.width;
    const canvasHeight = renderer.domElement.height;
    uniforms.iResolution.value.set(canvasWidth, canvasHeight, 1);
  };
  setSize();

  const ro = ('ResizeObserver' in window) ? new ResizeObserver(setSize) : null;
  if (ro) ro.observe(container);

  const targetMouse = new THREE.Vector2(-1000,-1000);
  const currentMouse = new THREE.Vector2(-1000,-1000);
  let targetInfluence = 0; let currentInfluence = 0;
  const targetParallax = new THREE.Vector2(0,0);
  const currentParallax = new THREE.Vector2(0,0);

  function onPointerMove(e){
    const rect = renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const dpr = renderer.getPixelRatio();
    targetMouse.set(x*dpr, (rect.height - y)*dpr);
    targetInfluence = 1.0;
    if (parallax){
      const cx = rect.width/2, cy = rect.height/2;
      const offsetX = (x - cx)/rect.width; const offsetY = -(y - cy)/rect.height;
      targetParallax.set(offsetX*parallaxStrength, offsetY*parallaxStrength);
    }
  }
  function onPointerLeave(){ targetInfluence = 0.0; }
  if (interactive){
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
  }

  const clock = new THREE.Clock();
  let raf = 0;
  const loop = ()=>{
    uniforms.iTime.value = clock.getElapsedTime();
    if (interactive){
      currentMouse.lerp(targetMouse, mouseDamping);
      uniforms.iMouse.value.copy(currentMouse);
      currentInfluence += (targetInfluence - currentInfluence) * mouseDamping;
      uniforms.bendInfluence.value = currentInfluence;
    }
    if (parallax){
      currentParallax.lerp(targetParallax, mouseDamping);
      uniforms.parallaxOffset.value.copy(currentParallax);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return () => {
    cancelAnimationFrame(raf);
    if (ro) ro.disconnect();
    if (interactive){
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
    }
    geometry.dispose(); material.dispose(); renderer.dispose();
    if (renderer.domElement.parentElement){
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };
}
