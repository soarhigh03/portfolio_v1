(() => {
  'use strict';
  // Pick once per page visit. Resizing and returning to the tab retain the scene.
  // Optional parameters allow deterministic visual review, without visible controls.
  const params = new URLSearchParams(location.search);
  const scenes = ['bird', 'flower', 'fireworks'];
  const requested = params.get('scene');
  const scene = scenes.includes(requested) ? requested : scenes[Math.floor(Math.random() * scenes.length)];
  const time = params.has('time') ? Number(params.get('time')) : NaN;
  document.querySelector('.artwork').dataset.scene = scene;
  if (window.AsciiArtwork) {
    new window.AsciiArtwork(document.getElementById('ascii-art'), {
      scene,
      stillTime: Number.isFinite(time) ? Math.max(0, time) : null,
    });
  }
})();
