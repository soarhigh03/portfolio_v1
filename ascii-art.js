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
      this.characters = ' .,:;irs*+tfLCH0#@';
      const sw = this.tileW = Math.ceil(this.cellW * dpr);
      const sh = this.tileH = Math.ceil(this.cellH * dpr);
      this.atlas = document.createElement('canvas');
      this.atlas.width = sw * this.characters.length;
      this.atlas.height = sh;
      const a = this.atlas.getContext('2d');
      a.font = `${this.cellH * dpr * .97}px "Anonymous Pro", monospace`;
      a.textAlign = 'center';
      a.textBaseline = 'middle';
      a.fillStyle = this.scene === 'bird' ? '#f0f4ed' : '#e4e4e4';
      for (let i = 1; i < this.characters.length; i++) {
        a.globalAlpha = mix(.38, 1, i / (this.characters.length - 1));
        a.fillText(this.characters[i], (i + .5) * sw, sh * .49);
      }
    }

    displayTime() {
      if (this.stillTime !== null) return this.stillTime;
      if (this.motion.matches) return { bird: 1.5, flower: 8, fireworks: 3.4 }[this.scene];
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
      c.fillStyle = this.scene === 'bird' ? '#347fc1' : this.scene === 'fireworks' ? '#1600f5' : '#000';
      c.fillRect(0, 0, w, h);
      if (this.scene === 'bird') {
        const sky = c.createLinearGradient(0, 0, w, h);
        sky.addColorStop(0, 'rgba(255,255,255,.035)');
        sky.addColorStop(.55, 'rgba(255,255,255,0)');
        sky.addColorStop(1, 'rgba(0,25,70,.1)');
        c.fillStyle = sky;
        c.fillRect(0, 0, w, h);
      }
      // An atlas avoids thousands of text layout operations per frame.
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const sample = pixels[(y * this.cols + x) * 4];
          if (sample < (this.scene === 'fireworks' ? 4 : 10)) continue;
          const brightness = 255 * Math.pow(sample / 255, this.scene === 'fireworks' ? .44 : .78);
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

    bird(p, time, w, h) {
      const t = time % 15;
      const departure = smooth((t - 5.4) / 5.5);
      const arrive = smooth(t / 1.1);
      const stretch = smooth((t - 3.6) / 1.3);
      const flap = stretch * (.5 + .5 * Math.sin((t - 4) * 10));
      const size = Math.min(w * .38, h * .27);
      const ground = h * .69;
      // The perch stays behind as the bird takes flight.
      p.strokeStyle = '#7e7e7e';
      p.lineWidth = 2.4;
      p.beginPath();
      p.moveTo(-10, ground + size * .47);
      p.bezierCurveTo(w * .22, ground + size * .25, w * .53, ground + size * .39, w * .73, ground + size * .12);
      p.stroke();
      p.lineWidth = 1.4;
      p.beginPath();
      p.moveTo(w * .17, ground + size * .35);
      p.quadraticCurveTo(w * .26, ground + size * .07, w * .29, ground - size * .06);
      p.stroke();
      if (t > 11.3) return;
      p.save();
      p.globalAlpha = arrive;
      const bx = w * .48 + departure * w * .88;
      const by = ground - size * .45 - departure * h * .92 + Math.sin(t * 1.7) * size * .008;
      p.translate(bx, by);
      p.scale(size, size);
      p.rotate(mix(-.12, -.44, departure));
      // Tail: individually shaded flight feathers.
      for (let i = 0; i < 7; i++) {
        this.ellipse(p, -.34 - i * .018, .34 + i * .018, .12, .42, -.68 + i * .055, 147 + i * 12);
      }
      const wing = (back) => {
        const side = back ? -1 : 1;
        const reach = .2 + stretch * .75;
        p.save();
        p.translate(-.05, -.04);
        p.rotate(side * (.32 + flap * 1.1));
        for (let i = 0; i < 13; i++) {
          const u = i / 12;
          const x = -.2 - u * reach;
          const y = -.13 - Math.sin(u * Math.PI * .7) * (.24 + flap * 1.15);
          this.ellipse(p, x, y, .09 + (1 - u) * .085, .22 + u * .27,
            -.45 - u * .63 - flap * .6, back ? 95 + i * 6 : 160 + i * 6);
        }
        p.restore();
      };
      if (stretch > .02) wing(true);
      this.ellipse(p, -.03, .04, .39, .54, -.42, 246);
      // Folded wing has layered coverts, rather than a flat silhouette.
      this.ellipse(p, -.13, .09, .27, .4, -.58, 178);
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 4; col++) {
          this.ellipse(p, -.29 + col * .089 + row * .012, -.09 + row * .092,
            .056, .13, -.52, 151 + col * 13 + row * 7);
        }
      }
      if (stretch > .02) wing(false);
      this.ellipse(p, .19, -.31, .19, .32, .48, 242);
      const look = Math.sin(t * 1.4) * .025 * (1 - stretch);
      this.ellipse(p, .32, -.53 + look, .225, .215, -.1, 255);
      p.fillStyle = '#c6c6c6';
      p.beginPath();
      p.moveTo(.49, -.56 + look); p.lineTo(.72, -.5 + look); p.lineTo(.49, -.46 + look); p.closePath(); p.fill();
      p.fillStyle = '#111';
      p.beginPath(); p.arc(.405, -.572 + look, .033, 0, TAU); p.fill();
      p.fillStyle = '#eee';
      p.beginPath(); p.arc(.412, -.583 + look, .009, 0, TAU); p.fill();
      // Feet curl into the body after lift-off.
      p.strokeStyle = '#b8b8b8';
      p.lineWidth = .026;
      const footY = mix(.8, .47, stretch);
      for (const x of [-.07, .08]) {
        p.beginPath(); p.moveTo(x, .43); p.lineTo(x + .06, footY);
        p.lineTo(x + .2, footY + .035); p.moveTo(x + .06, footY);
        p.lineTo(x - .04, footY + .06); p.stroke();
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
      p.save();
      p.translate(cx, cy);
      p.rotate(sway);
      // Tapering, curved stem and two leaves.
      const stem = p.createLinearGradient(0, 0, size * .1, h * .65);
      stem.addColorStop(0, '#a8a8a8'); stem.addColorStop(1, '#242424');
      p.strokeStyle = stem; p.lineWidth = Math.max(3, size * .035);
      p.beginPath(); p.moveTo(0, size * .04);
      p.bezierCurveTo(-size * .03, size * .65, -size * .2, size * 1.25, -size * .25, h * .75); p.stroke();
      for (const [x, y, flip] of [[-.1, .97, 1], [-.17, 1.48, -1]]) {
        p.save(); p.translate(size * x, size * y); p.scale(flip, 1);
        p.fillStyle = '#474747'; p.beginPath(); p.moveTo(0, 0);
        p.bezierCurveTo(size * .42, -size * .02, size * .53, -size * .34, size * .55, -size * .49);
        p.bezierCurveTo(size * .13, -size * .39, size * .1, -size * .14, 0, 0); p.fill();
        p.strokeStyle = '#818181'; p.lineWidth = .9; p.beginPath(); p.moveTo(0, 0);
        p.quadraticCurveTo(size * .25, -size * .2, size * .55, -size * .49); p.stroke(); p.restore();
      }
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
      const spacing = 1.65;
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
        const count = 170;
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
          const lifetime = 2.45 + noise(i + burst * 13) * 1.4;
          const fade = clamp(1 - t / lifetime);
          if (!fade) continue;
          const glimmer = .75 + .25 * Math.sin(t * 21 + i * 7);
          const segments = 8;
          for (let j = segments; j >= 0; j--) {
            const at = Math.max(0, t - j * .036);
            const [x, y] = position(at);
            p.fillStyle = gray(255 * Math.sqrt(fade) * glimmer * (1 - j / (segments + 2)));
            const dot = j === 0 ? 3.6 : 2.4;
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
