(() => {
  'use strict';
  const button = document.getElementById('instagram-button');
  const note = document.getElementById('instagram-note');
  const instagram = button.closest('.instagram');
  const closeNote = () => {
    note.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  };
  button.addEventListener('click', () => {
    const open = note.hidden;
    note.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('pointerdown', (event) => {
    if (!instagram.contains(event.target)) closeNote();
  });
  document.addEventListener('focusin', (event) => {
    if (!instagram.contains(event.target)) closeNote();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNote();
  });

  // Pick once per page visit. Resizing and returning to the tab retain the scene.
  // Optional parameters allow deterministic visual review, without visible controls.
  const params = new URLSearchParams(location.search);
  const scenes = ['flower', 'fireworks'];
  const requested = params.get('scene');
  const scene = scenes.includes(requested) ? requested : scenes[Math.floor(Math.random() * scenes.length)];
  const time = params.has('time') ? Number(params.get('time')) : NaN;
  // Keep URL-controlled preview values within a useful, numerically safe range.
  const previewTime = Number.isFinite(time) ? Math.min(3600, Math.max(0, time)) : null;
  document.querySelector('.artwork').dataset.scene = scene;
  if (window.AsciiArtwork) {
    new window.AsciiArtwork(document.getElementById('ascii-art'), {
      scene,
      stillTime: previewTime,
    });
  }
})();
