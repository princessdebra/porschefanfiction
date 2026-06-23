import { useRef, useEffect } from 'react';
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from 'ogl';
import './FlyingPosters.css';

const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform float uPosition;
uniform float uTime;
uniform float uSpeed;
uniform vec3 distortionAxis;
uniform vec3 rotationAxis;
uniform float uDistortion;

varying vec2 vUv;
varying vec3 vNormal;

float PI = 3.141592653589793238;
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(
      oc * axis.x * axis.x + c,          oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
      oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
      oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
      0.0,                               0.0,                                 0.0,                                1.0
    );
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  mat4 m = rotationMatrix(axis, angle);
  return (m * vec4(v, 1.0)).xyz;
}

float qinticInOut(float t) {
  return t < 0.5
    ? 16.0 * pow(t, 5.0)
    : -0.5 * abs(pow(2.0 * t - 2.0, 5.0)) + 1.0;
}

void main() {
  vUv = uv;
  float norm = 0.5;
  vec3 newpos = position;
  float offset = (dot(distortionAxis, position) + norm / 2.) / norm;
  float localprogress = clamp(
    (fract(uPosition * 5.0 * 0.01) - 0.01 * uDistortion * offset) / (1. - 0.01 * uDistortion),
    0., 2.
  );
  localprogress = qinticInOut(localprogress) * PI;
  newpos = rotate(newpos, rotationAxis, localprogress);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newpos, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform sampler2D tMap;

varying vec2 vUv;

void main() {
  vec2 imageSize = uImageSize;
  vec2 planeSize = uPlaneSize;
  float imageAspect = imageSize.x / imageSize.y;
  float planeAspect = planeSize.x / planeSize.y;
  vec2 scale = vec2(1.0, 1.0);
  if (planeAspect > imageAspect) {
    scale.x = imageAspect / planeAspect;
  } else {
    scale.y = planeAspect / imageAspect;
  }
  vec2 uv = vUv * scale + (1.0 - scale) * 0.5;
  gl_FragColor = texture2D(tMap, uv);
}
`;

function AutoBind(self, { include, exclude } = {}) {
  const getAllProperties = object => {
    const properties = new Set();
    do {
      for (const key of Reflect.ownKeys(object)) properties.add([object, key]);
    } while ((object = Reflect.getPrototypeOf(object)) && object !== Object.prototype);
    return properties;
  };
  const filter = key => {
    const match = pattern => (typeof pattern === 'string' ? key === pattern : pattern.test(key));
    if (include) return include.some(match);
    if (exclude) return !exclude.some(match);
    return true;
  };
  for (const [object, key] of getAllProperties(self.constructor.prototype)) {
    if (key === 'constructor' || !filter(key)) continue;
    const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
    if (descriptor && typeof descriptor.value === 'function') self[key] = self[key].bind(self);
  }
  return self;
}

function lerp(p1, p2, t) { return p1 + (p2 - p1) * t; }
function map(num, min1, max1, min2, max2) {
  return ((num - min1) / (max1 - min1)) * (max2 - min2) + min2;
}

class Media {
  constructor({ gl, geometry, scene, screen, viewport, image, length, index, planeWidth, planeHeight, distortion }) {
    this.extra = 0;
    this.gl = gl; this.geometry = geometry; this.scene = scene;
    this.screen = screen; this.viewport = viewport; this.image = image;
    this.length = length; this.index = index;
    this.planeWidth = planeWidth; this.planeHeight = planeHeight;
    this.distortion = distortion;
    this.createShader();
    this.createMesh();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: false });
    this.program = new Program(this.gl, {
      depthTest: false, depthWrite: false,
      fragment: fragmentShader, vertex: vertexShader,
      uniforms: {
        tMap:           { value: texture },
        uPosition:      { value: 0 },
        uPlaneSize:     { value: [0, 0] },
        uImageSize:     { value: [0, 0] },
        uSpeed:         { value: 0 },
        rotationAxis:   { value: [0, 1, 0] },
        distortionAxis: { value: [1, 1, 0] },
        uDistortion:    { value: this.distortion },
        uViewportSize:  { value: [this.viewport.width, this.viewport.height] },
        uTime:          { value: 0 },
      },
      cullFace: false,
    });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSize.value = [img.naturalWidth, img.naturalHeight];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }

  setScale() {
    this.plane.scale.x = (this.viewport.width  * this.planeWidth)  / this.screen.width;
    this.plane.scale.y = (this.viewport.height * this.planeHeight) / this.screen.height;
    this.plane.position.x = 0;
    this.plane.program.uniforms.uPlaneSize.value = [this.plane.scale.x, this.plane.scale.y];
  }

  onResize({ screen, viewport } = {}) {
    if (screen)   this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      this.plane.program.uniforms.uViewportSize.value = [this.viewport.width, this.viewport.height];
    }
    this.setScale();
    /* Gap between posters kept small (fraction of the poster height) so the
       belt reads as a continuous stream rather than posters separated by big
       blank voids. */
    this.padding     = this.plane.scale.y * 0.22;
    this.height      = this.plane.scale.y + this.padding;
    this.heightTotal = this.height * this.length;
    this.y           = -this.heightTotal / 2 + (this.index + 0.5) * this.height;
  }

  update(scroll) {
    this.plane.position.y = this.y - scroll.current - this.extra;
    const position = map(this.plane.position.y, -this.viewport.height, this.viewport.height, 5, 15);
    this.program.uniforms.uPosition.value = position;
    this.program.uniforms.uTime.value    += 0.04;
    this.program.uniforms.uSpeed.value    = scroll.current;
    const topEdge    = this.plane.position.y + this.plane.scale.y / 2;
    const bottomEdge = this.plane.position.y - this.plane.scale.y / 2;
    if (topEdge    < -this.viewport.height / 2) this.extra -= this.heightTotal;
    else if (bottomEdge >  this.viewport.height / 2) this.extra += this.heightTotal;
  }
}

class Canvas {
  constructor({ container, canvas, items, planeWidth, planeHeight, distortion, scrollEase, cameraFov, cameraZ, externalScrollControl = false }) {
    this.container = container;
    this.canvas    = canvas;
    this.items     = items;
    this.planeWidth  = planeWidth;
    this.planeHeight = planeHeight;
    this.distortion  = distortion;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.cameraFov = cameraFov;
    this.cameraZ   = cameraZ;
    this.externalScrollControl = externalScrollControl;
    AutoBind(this);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias();
    this.update();
    if (!externalScrollControl) this.addEventListeners();
    /* Always listen to resize */
    window.addEventListener('resize', this.onResize);
  }

  createRenderer() {
    this.renderer = new Renderer({
      canvas: this.canvas, alpha: true, antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    this.gl = this.renderer.gl;
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = this.cameraFov;
    this.camera.position.z = this.cameraZ;
  }

  createScene() { this.scene = new Transform(); }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, { heightSegments: 1, widthSegments: 100 });
  }

  createMedias() {
    this.medias = this.items.map((image, index) =>
      new Media({
        gl: this.gl, geometry: this.planeGeometry, scene: this.scene,
        screen: this.screen, viewport: this.viewport,
        image, length: this.items.length, index,
        planeWidth: this.planeWidth, planeHeight: this.planeHeight, distortion: this.distortion,
      })
    );
  }

  onResize() {
    const rect = this.container.getBoundingClientRect();
    this.screen = { width: rect.width, height: rect.height };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.gl.canvas.width / this.gl.canvas.height });
    const fov    = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width  = height * this.camera.aspect;
    this.viewport = { height, width };
    if (this.medias) this.medias.forEach(m => m.onResize({ screen: this.screen, viewport: this.viewport }));
  }

  onTouchDown(e) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientY : e.clientY;
  }
  onTouchMove(e) {
    if (!this.isDown) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    this.scroll.target = this.scroll.position + (this.start - y) * 0.1;
  }
  onTouchUp() { this.isDown = false; }

  onWheel(e) { this.scroll.target += e.deltaY * 0.005; }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    if (this.medias) this.medias.forEach(m => m.update(this.scroll));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this._raf = requestAnimationFrame(this.update);
  }

  addEventListeners() {
    this.container.addEventListener('wheel',      this.onWheel,     { passive: true });
    this.container.addEventListener('mousedown',  this.onTouchDown);
    this.container.addEventListener('mousemove',  this.onTouchMove);
    this.container.addEventListener('mouseup',    this.onTouchUp);
    this.container.addEventListener('touchstart', this.onTouchDown, { passive: true });
    this.container.addEventListener('touchmove',  this.onTouchMove, { passive: true });
    this.container.addEventListener('touchend',   this.onTouchUp);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this.onResize);
    if (!this.externalScrollControl) {
      this.container.removeEventListener('wheel',      this.onWheel);
      this.container.removeEventListener('mousedown',  this.onTouchDown);
      this.container.removeEventListener('mousemove',  this.onTouchMove);
      this.container.removeEventListener('mouseup',    this.onTouchUp);
      this.container.removeEventListener('touchstart', this.onTouchDown);
      this.container.removeEventListener('touchmove',  this.onTouchMove);
      this.container.removeEventListener('touchend',   this.onTouchUp);
    }
  }
}

export default function FlyingPosters({
  items = [],
  planeWidth  = 320,
  planeHeight = 320,
  distortion  = 3,
  scrollEase  = 0.01,
  cameraFov   = 45,
  cameraZ     = 20,
  /* When true, disables internal wheel/touch listeners — caller drives scroll externally */
  externalScrollControl = false,
  /* Receives the live Canvas instance so the caller can set scroll.target directly */
  canvasRef: externalCanvasRef,
  className   = '',
  ...props
}) {
  const containerRef = useRef(null);
  const canvasElRef  = useRef(null);
  const instanceRef  = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = new Canvas({
      container: containerRef.current,
      canvas:    canvasElRef.current,
      items, planeWidth, planeHeight, distortion, scrollEase, cameraFov, cameraZ,
      externalScrollControl,
    });
    instanceRef.current = instance;
    if (externalCanvasRef) externalCanvasRef.current = instance;

    return () => {
      instance.destroy();
      instanceRef.current = null;
      if (externalCanvasRef) externalCanvasRef.current = null;
    };
  }, [items, planeWidth, planeHeight, distortion, scrollEase, cameraFov, cameraZ, externalScrollControl]); // eslint-disable-line

  return (
    <div ref={containerRef} className={`posters-container ${className}`} {...props}>
      <canvas ref={canvasElRef} className="posters-canvas" />
    </div>
  );
}
