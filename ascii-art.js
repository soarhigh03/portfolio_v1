/* Procedural subjects rasterized into a live grid of ASCII glyphs.
   No photos, video, SVG silhouettes, or network requests are used at runtime. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
  const noise = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const gray = (n) => { const v = Math.round(clamp(n, 0, 255)); return `rgb(${v},${v},${v})`; };

  class AsciiArtwork {
    constructor(canvas, { scene, stillTime = null }) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.scene = scene;
      this.stillTime = stillTime;
      this.source = document.createElement('canvas');
      this.paint = this.source.getContext('2d', { willReadFrequently: true });
      this.sample = document.createElement('canvas');
      this.sampler = this.sample.getContext('2d', { willReadFrequently: true });
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.elapsed = 0;
      this.last = null;
      this.lastPaint = -Infinity;
      this.frame = null;
      this.tick = this.tick.bind(this);
      this.resize = this.resize.bind(this);
      this.sync = this.sync.bind(this);
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(canvas.parentElement);
      this.motion.addEventListener('change', this.sync);
      document.addEventListener('visibilitychange', this.sync);
      window.addEventListener('pagehide', () => this.stop());
      window.addEventListener('pageshow', this.sync);
      this.resize();
      document.fonts.ready.then(() => this.resize());
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.round(rect.width);
      this.height = Math.round(rect.height);
      if (!this.width || !this.height) { this.stop(); return; }
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.source.width = this.width;
      this.source.height = this.height;
      this.cellW = this.width / 112;
      this.cellH = this.cellW * 1.55;
      this.cols = 112;
      this.rows = Math.max(1, Math.ceil(this.height / this.cellH));
      this.sample.width = this.cols;
      this.sample.height = this.rows;
      this.createAtlas(dpr);
      this.render(this.displayTime());
      this.sync();
    }

    createAtlas(dpr) {
      this.characters = this.scene === 'fireworks' ? ' .:;+*xX#%@' : ' .,:;irs*+tfLCH0#@';
      const sw = this.tileW = Math.ceil(this.cellW * dpr);
      const sh = this.tileH = Math.ceil(this.cellH * dpr);
      this.atlas = document.createElement('canvas');
      this.atlas.width = sw * this.characters.length;
      this.atlas.height = sh;
      const a = this.atlas.getContext('2d');
      a.font = `${this.scene === 'fireworks' ? 700 : 400} ${this.cellH * dpr * .97}px "Anonymous Pro", monospace`;
      a.textAlign = 'center';
      a.textBaseline = 'middle';
      a.fillStyle = this.scene === 'fireworks' ? '#fff' : '#e4e4e4';
      for (let i = 1; i < this.characters.length; i++) {
        a.globalAlpha = mix(this.scene === 'fireworks' ? .7 : .38, 1, i / (this.characters.length - 1));
        a.fillText(this.characters[i], (i + .5) * sw, sh * .49);
      }
    }

    displayTime() {
      if (this.stillTime !== null) return this.stillTime;
      if (this.motion.matches) return { flower: 8, fireworks: 3.4 }[this.scene];
      return this.elapsed;
    }

    stop() {
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      this.frame = null;
      this.last = null;
    }

    sync() {
      this.stop();
      if (!this.width || !this.height) return;
      this.render(this.displayTime());
      if (!document.hidden && !this.motion.matches && this.stillTime === null) {
        this.frame = requestAnimationFrame(this.tick);
      }
    }

    tick(now) {
      if (this.last !== null) this.elapsed += Math.min((now - this.last) / 1000, .1);
      this.last = now;
      if (now - this.lastPaint >= 1000 / 24) {
        this.render(this.elapsed);
        this.lastPaint = now;
      }
      this.frame = requestAnimationFrame(this.tick);
    }

    render(time) {
      const { width: w, height: h, paint: p, ctx: c } = this;
      p.setTransform(1, 0, 0, 1, 0, 0);
      p.globalAlpha = 1;
      p.globalCompositeOperation = 'source-over';
      p.fillStyle = '#000';
      p.fillRect(0, 0, w, h);
      this[this.scene](p, time, w, h);
      this.sampler.drawImage(this.source, 0, 0, this.cols, this.rows);
      const pixels = this.sampler.getImageData(0, 0, this.cols, this.rows).data;
      c.globalAlpha = 1;
      c.fillStyle = this.scene === 'fireworks' ? '#1600f5' : '#000';
      c.fillRect(0, 0, w, h);
      // An atlas avoids thousands of text layout operations per frame.
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const sample = pixels[(y * this.cols + x) * 4];
          if (sample < (this.scene === 'fireworks' ? 4 : 10)) continue;
          const brightness = 255 * Math.pow(sample / 255, this.scene === 'fireworks' ? .38 : .78);
          const index = Math.min(this.characters.length - 1, Math.max(1, Math.floor(brightness / 256 * this.characters.length)));
          c.drawImage(this.atlas, index * this.tileW, 0, this.tileW, this.tileH,
            x * this.cellW, y * this.cellH, this.cellW, this.cellH);
        }
      }
    }

    ellipse(p, x, y, rx, ry, rotation, light = 230) {
      p.save();
      p.translate(x, y);
      p.rotate(rotation);
      const g = p.createRadialGradient(-rx * .3, -ry * .3, 0, 0, 0, Math.max(rx, ry));
      g.addColorStop(0, gray(light));
      g.addColorStop(.65, gray(light * .83));
      g.addColorStop(1, gray(light * .45));
      p.fillStyle = g;
      p.beginPath();
      p.ellipse(0, 0, rx, ry, 0, 0, TAU);
      p.fill();
      p.restore();
    }

    flowerStem(p, time, w, h, cx, cy, size) {
      // The base stays rooted while the curved stem follows the bloom above.
      const bend = Math.sin(time * .77) * size * .025;
      const points = [
        [w * .43, h + size * .08],
        [w * .43 - size * .08 + bend, h * .8],
        [cx - size * .12 + bend, cy + size * .75],
        [cx, cy + size * .035],
      ];
      const stemAt = (t) => points[0].map((_, axis) =>
        (1 - t) ** 3 * points[0][axis] + 3 * (1 - t) ** 2 * t * points[1][axis]
        + 3 * (1 - t) * t * t * points[2][axis] + t ** 3 * points[3][axis]);
      const leaves = [
        { at: .32, side: -1, length: 1.18, width: .4, phase: 3.1 },
        { at: .59, side: 1, length: 1.05, width: .34, phase: .5 },
      ];
      p.save();
      p.lineJoin = 'round';
      p.lineCap = 'round';
      for (const leaf of leaves) {
        const [x, y] = stemAt(leaf.at);
        const flutter = Math.sin(time * 1.13 + leaf.phase) * .055
          + Math.sin(time * .47 + leaf.phase) * .025;
        const unfurl = mix(.62, 1, smooth((time - leaf.phase * .18) / 5));
        const length = size * leaf.length;
        const width = size * leaf.width;
        p.save();
        p.translate(x, y);
        p.scale(leaf.side * unfurl, unfurl);
        p.rotate(-.6 + flutter);
        // A raised midrib, uneven edges and a curling tip give each leaf volume.
        const surface = (u, v) => {
          const edge = Math.pow(Math.sin(Math.PI * u), .76)
            * (1 + .035 * Math.sin(u * Math.PI * 17));
          const fold = width * .22 * (1 - Math.abs(v)) * Math.sin(Math.PI * u);
          const tip = length * (.12 + flutter) * u ** 3;
          return [length * u, width * v * edge * .72 - fold - tip
            + width * v * u * u * Math.sin(time * .8 + leaf.phase) * .16];
        };
        const rows = 24, cols = 10;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const u = i / rows, v = j / cols * 2 - 1;
            const shade = 53 + Math.sin(Math.PI * u) * 44 + (1 - Math.abs(v)) * 34
              + (v < 0 ? 23 : -9) + Math.sin(u * 45 + v * 6) * 7;
            const corners = [surface(u, v), surface((i + 1) / rows, v),
              surface((i + 1) / rows, (j + 1) / cols * 2 - 1), surface(u, (j + 1) / cols * 2 - 1)];
            p.fillStyle = gray(shade);
            p.strokeStyle = p.fillStyle;
            p.lineWidth = .35;
            p.beginPath();
            corners.forEach(([px, py], k) => k ? p.lineTo(px, py) : p.moveTo(px, py));
            p.closePath(); p.fill(); p.stroke();
          }
        }
        const trace = (points, light, thickness) => {
          p.strokeStyle = gray(light); p.lineWidth = thickness; p.beginPath();
          points.forEach(([px, py], i) => i ? p.lineTo(px, py) : p.moveTo(px, py));
          p.stroke();
        };
        // Curved lateral veins branch from the midrib toward the leaf margin.
        for (const side of [-1, 1]) {
          trace(Array.from({ length: 25 }, (_, i) => surface(i / 24, side)), 107, .8);
          for (let i = 1; i <= 7; i++) {
            const start = i * .105;
            trace(Array.from({ length: 9 }, (_, j) => {
              const t = j / 8;
              return surface(start + .16 * t, side * .88 * smooth(t));
            }), side < 0 ? 177 : 135, 1.05);
          }
        }
        trace(Array.from({ length: 25 }, (_, i) => surface(i / 24, 0)), 204, 1.5);
        p.restore();
      }
      // Tapered segments and an offset highlight replace a uniformly flat stalk.
      for (let i = 0; i < 44; i++) {
        const t = i / 44;
        const a = stemAt(t), b = stemAt((i + 1) / 44);
        const radius = size * mix(.024, .011, t);
        p.strokeStyle = gray(mix(79, 145, t)); p.lineWidth = radius * 2;
        p.beginPath(); p.moveTo(...a); p.lineTo(...b); p.stroke();
        p.strokeStyle = gray(mix(141, 201, t)); p.lineWidth = radius * .65;
        p.beginPath(); p.moveTo(a[0] - radius * .38, a[1]);
        p.lineTo(b[0] - radius * .38, b[1]); p.stroke();
      }
      for (const leaf of leaves) {
        const [x, y] = stemAt(leaf.at);
        this.ellipse(p, x, y, size * .027, size * .014, -.25, 155);
      }
      p.restore();
    }

    flower(p, time, w, h) {
      // A one-time bloom, followed by continuous gentle wind.
      const bloom = smooth(time / 6.5);
      const sway = Math.sin(time * .77) * .035 + Math.sin(time * .31) * .018;
      const size = Math.min(w * .405, h * .32);
      const cx = w * .5 + Math.sin(time * .77) * size * .045;
      const cy = h * .43;
      this.flowerStem(p, time, w, h, cx, cy, size);
      p.save();
      p.translate(cx, cy);
      p.rotate(sway);
      // Each petal is a curved, ruffled 3D surface. Depth-sort the facets.
      const faces = [];
      const tilt = .48;
      const project = ([x, y, z]) => [x * size, (-y * Math.cos(tilt) + z * Math.sin(tilt)) * size, z * Math.cos(tilt) + y * Math.sin(tilt)];
      const petals = 12;
      for (let k = 0; k < petals; k++) {
        const inner = k >= 7;
        const angle = (inner ? (k - 7) / 5 : k / 7) * TAU + (inner ? .4 : 0);
        const open = mix(.1, inner ? .79 : 1, bloom);
        const len = (inner ? .78 : 1.17) + noise(k + 10) * .16;
        const point = (u, v) => {
          const width = Math.pow(Math.sin(Math.PI * u), .65) * (inner ? .52 : .72) * v;
          const r = .045 + len * Math.sin(u * open * 1.5);
          const curl = .11 * Math.sin(v * Math.PI * 3 + k) * Math.pow(u, 5);
          const y = len * u * (1.05 - open * .73) + .22 * v * v * Math.sin(Math.PI * u) + curl;
          return [Math.cos(angle) * r - Math.sin(angle) * width,
            y, Math.sin(angle) * r + Math.cos(angle) * width];
        };
        const rows = 19, cols = 12;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const u = i / rows, v = j / cols * 2 - 1;
            const raw = [point(u, v), point((i + 1) / rows, v), point((i + 1) / rows, (j + 1) / cols * 2 - 1), point(u, (j + 1) / cols * 2 - 1)];
            const vertices = raw.map(project);
            const a = raw[1].map((n, q) => n - raw[0][q]);
            const b = raw[3].map((n, q) => n - raw[0][q]);
            const normal = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
            const magnitude = Math.hypot(...normal) || 1;
            const light = Math.abs((normal[0] * -.45 + normal[1] * .8 + normal[2] * -.4) / magnitude);
            const vein = 12 * Math.sin(v * 23 + u * 7 + k);
            const shade = 70 + light * 150 + u * 15 + vein;
            faces.push({ vertices, depth: vertices.reduce((s, n) => s + n[2], 0) / 4, shade });
          }
        }
      }
      faces.sort((a, b) => a.depth - b.depth);
      for (const face of faces) {
        p.fillStyle = gray(face.shade);
        p.strokeStyle = p.fillStyle; p.lineWidth = .4;
        p.beginPath(); face.vertices.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y));
        p.closePath(); p.fill(); p.stroke();
      }
      // A dark seed head and individually placed stamens.
      if (bloom > .4) {
        p.globalAlpha = smooth((bloom - .4) / .5);
        this.ellipse(p, 0, -size * .055, size * .16, size * .095, 0, 88);
        for (let i = 0; i < 55; i++) {
          const a = i * 2.39996;
          const r = size * (.11 + .105 * noise(i + 1));
          const x = Math.cos(a) * r, y = Math.sin(a) * r * .48 - size * .06;
          p.strokeStyle = '#8b8b8b'; p.lineWidth = .7;
          p.beginPath(); p.moveTo(x * .56, y * .6); p.lineTo(x, y - size * .04); p.stroke();
          p.fillStyle = gray(130 + noise(i) * 105);
          p.beginPath(); p.arc(x, y - size * .04, size * .012, 0, TAU); p.fill();
        }
      }
      p.restore();
    }

    fireworks(p, time, w, h) {
      p.globalCompositeOperation = 'lighter';
      const spacing = 1.5;
      const current = Math.floor(time / spacing);
      const s = Math.min(w, h * .8);
      for (let burst = Math.max(0, current - 3); burst <= current; burst++) {
        const age = time - burst * spacing;
        const cx = w * (.21 + noise(burst + 2) * .57);
        const cy = h * (.21 + noise(burst + 61) * .33);
        const launch = .86;
        if (age < launch) {
          const progress = age / launch;
          const rocketY = mix(h + 12, cy, 1 - (1 - progress) ** 2);
          const rocketX = cx + Math.sin(progress * 3) * 4;
          for (let j = 0; j < 12; j++) {
            p.fillStyle = gray(220 * (1 - j / 12));
            p.fillRect(rocketX + Math.sin(j) * 1.5, rocketY + j * 3, 2, 3);
          }
          continue;
        }
        const t = age - launch;
        if (t > 4.2) continue;
        const count = 210;
        const radius = s * (.37 + noise(burst + 9) * .16);
        for (let i = 0; i < count; i++) {
          const angle = i * 2.399963 + burst;
          const shell = Math.sqrt((i + .5) / count);
          const speed = radius * (.38 + shell * .72);
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const position = (at) => {
            const expansion = (1 - Math.exp(-at * 1.65)) / 1.1;
            return [cx + vx * expansion, cy + vy * expansion + at * at * 13];
          };
          const lifetime = 2.8 + noise(i + burst * 13) * 1.4;
          const fade = clamp(1 - t / lifetime);
          if (!fade) continue;
          const glimmer = .88 + .12 * Math.sin(t * 21 + i * 7);
          const segments = 10;
          for (let j = segments; j >= 0; j--) {
            const at = Math.max(0, t - j * .036);
            const [x, y] = position(at);
            p.fillStyle = gray(255 * Math.sqrt(fade) * glimmer * (1 - j / (segments + 2)));
            const dot = j === 0 ? 4.8 : 3.1;
            p.fillRect(x, y, dot, dot);
          }
        }
        // Brief bright core at the instant of the explosion.
        if (t < .16) {
          p.fillStyle = gray(255 * (1 - t / .16));
          p.beginPath(); p.arc(cx, cy, 3 + t * 70, 0, TAU); p.fill();
        }
      }
      p.globalCompositeOperation = 'source-over';
    }
  }

  window.AsciiArtwork = AsciiArtwork;
})();
