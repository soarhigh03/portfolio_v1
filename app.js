'use strict';

const projects = [
  { id: 'patz', title: 'PATZ', summary: 'A more personal way to discover and book nail art.', roles: 'PRODUCT · DEVELOPMENT', outcome: 'SNUSV DEMO DAY · TOP AWARD', cover: 'PATZ / PRODUCT IMAGERY', idea: 'Nail discovery and booking should feel as personal as the designs themselves. PATZ brings the two together in a dedicated platform.', url: 'https://patz.kr', link: 'Visit PATZ' },
  { id: 'jarvis', title: 'Project JARVIS', summary: 'An AI/XR workspace that turns the space around you into a place to work.', roles: 'AI · XR · VOICE INTERACTION', outcome: '2026 AI/XR COMPETITION · 2ND PLACE', cover: 'JARVIS / WORKSPACE DEMO', idea: 'What if the space around you could become your workspace? Project JARVIS combines a Meta Quest interface with a voice agent that manages the environment.' },
  { id: 'ddalgguk', title: 'Ddalgguk', summary: 'A side project that found its way onto phones — and into everyday life.', roles: 'MOBILE DEVELOPMENT · SHIPPING', outcome: 'iOS + ANDROID · ~2,000 USERS', cover: 'DDALGGUK / APP SCREENS', idea: 'What started as a side project became an app available on both iOS and Android, reaching around 2,000 users organically. User count is from my SNUSV introduction.' },
  { id: 'd4d', title: 'D4D × EDTH', summary: 'A working prototype for a real-world Air Force challenge.', roles: 'HACKATHON · TEAM VIDI VICI', outcome: '2026 · T3 TRACK WINNER', cover: 'D4D × EDTH / PROTOTYPE DEMO', idea: 'Built with Team Vidi Vici at the Korean Defense Tech Hackathon in Seoul, the project received the T3 Air Force track award in October 2026.', url: 'https://www.etnews.com/20261019000192', link: 'Read the award announcement' }
];
const menu = document.getElementById('menu');
const detail = document.getElementById('detail');
const detailContent = document.getElementById('detail-content');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let returnFocus = null;
let returnY = 0;
let returnHash = '';

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const lineLink = (label, href) => `<a class="line-link" href="${escapeHTML(href)}"><span>${escapeHTML(label)}</span><span class="arrow" aria-hidden="true">↗</span></a>`;
const mediaSlot = (key, label, extra = '') => `<div class="media-slot ${extra}" data-media="${escapeHTML(key)}" role="img" aria-label="Placeholder for ${escapeHTML(label)}"><span class="media-kind">[ IMAGE / VIDEO ]</span><span class="media-plus" aria-hidden="true">+</span><span class="media-caption">${escapeHTML(label)}</span></div>`;
const detailHeader = () => '<header class="header"><span class="wordmark mono">EUNWOO CHOI</span><button class="close-button mono" data-close-detail aria-label="Close detail">CLOSE −</button></header>';

function mountMedia(root = document) {
  root.querySelectorAll('[data-media]').forEach(slot => {
    if (slot.querySelector('img,video')) return;
    const asset = window.PORTFOLIO_MEDIA?.[slot.dataset.media];
    if (!asset?.src) return;
    const isVideo = asset.type === 'video';
    const node = document.createElement(isVideo ? 'video' : 'img');
    node.style.objectFit = asset.fit === 'contain' ? 'contain' : 'cover';
    if (isVideo) {
      node.preload = 'metadata';
      node.playsInline = true;
      node.controls = slot.closest('#detail') !== null;
      node.setAttribute('aria-label', asset.alt || slot.getAttribute('aria-label'));
      if (asset.poster) node.poster = asset.poster;
    } else {
      node.alt = asset.alt || slot.getAttribute('aria-label').replace(/^Placeholder for /, '');
      node.loading = 'lazy';
      node.decoding = 'async';
    }
    node.addEventListener(isVideo ? 'loadedmetadata' : 'load', () => {
      slot.classList.add('has-media');
      slot.removeAttribute('role');
      slot.removeAttribute('aria-label');
    }, { once: true });
    node.addEventListener('error', () => {
      node.remove();
      slot.classList.remove('has-media');
    }, { once: true });
    node.src = asset.src;
    slot.append(node);
  });
}

function projectMarkup(project) {
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  return `${detailHeader()}<article class="detail-body">
    <p class="eyebrow detail-meta"><span>SELECTED WORK</span><span>0${index + 1} / 04</span></p>
    <h2 id="detail-title">${escapeHTML(project.title)}</h2>
    <p class="detail-summary">${escapeHTML(project.summary)}</p>
    ${mediaSlot(project.id + '-cover', project.cover)}
    <p class="eyebrow detail-roles">${escapeHTML(project.roles)}</p>
    <h3>The idea</h3><p>${escapeHTML(project.idea)}</p>
    <h3>The outcome</h3><p class="eyebrow">${escapeHTML(project.outcome)}</p>
    ${mediaSlot(project.id + '-process', 'PROCESS / DETAIL / SECOND IMAGE', 'process-media')}
    ${project.url ? `<a class="line-link" href="${escapeHTML(project.url)}" target="_blank" rel="noreferrer"><span>${escapeHTML(project.link)}</span><span class="arrow" aria-hidden="true">↗</span></a>` : ''}
    ${lineLink('Next project — ' + next.title, '#project/' + next.id)}
  </article>`;
}

function playgroundMarkup() {
  const groups = [
    { key: 'cse', title: 'SNU CSE', description: 'Publicity director · Social graphics, posters & community design' },
    { key: 'shuttlecock', title: 'SHUTTLECOCK', description: 'Design lead · Badminton club identity & social graphics' }
  ];
  return `${detailHeader()}<div class="detail-body"><h2 id="detail-title">Visual<br>playground.</h2><p>Small things, made with care.</p>${groups.map(group => `<section class="archive-section" aria-label="${group.title}"><h3>${group.title}</h3><p class="eyebrow">${group.description}</p>${[1,2,3].map(i => `<figure>${mediaSlot(group.key + '-0' + i, group.title + ' / SOCIAL GRAPHIC 0' + i)}<figcaption class="archive-caption">${group.title} · 0${i}</figcaption></figure>`).join('')}</section>`).join('')}</div>`;
}

function explorationsMarkup() {
  return `${detailHeader()}<div class="detail-body"><h2 id="detail-title">Small experiments.<br>Real curiosity.</h2><article class="exploration"><h3>Re:View</h3>${mediaSlot('review', 'RE:VIEW / COURSE PROJECT POSTER')}<p>An AI application built for Software Development Principles and Practice. The project was shelved after evaluating the cost of the required GPU infrastructure.</p></article><article class="exploration"><h3>A to-do graph</h3>${mediaSlot('todo', 'DEPENDENCY GRAPH / INTERFACE')}<p>A personal task tool that makes dependencies visible as a network of nodes.</p></article></div>`;
}

function isDetailHash(hash) {
  return hash.startsWith('#project/') || hash === '#playground' || hash === '#explorations';
}

function lockPage() {
  document.body.classList.toggle('is-locked', menu.open || detail.open);
}

function closeMenu() {
  menu.close();
  lockPage();
}

function showRoute() {
  const hash = location.hash;
  if (!isDetailHash(hash)) {
    if (detail.open) {
      detail.querySelectorAll('video').forEach(video => video.pause());
      detail.close();
      window.scrollTo({ top: returnY, behavior: 'instant' });
      returnFocus?.focus({ preventScroll: true });
    }
    lockPage();
    document.title = 'Eunwoo Choi — Selected work';
    return;
  }
  let markup;
  let title;
  if (hash.startsWith('#project/')) {
    const project = projects.find(item => hash === '#project/' + item.id);
    if (!project) {
      history.replaceState(null, '', '#work');
      showRoute();
      document.getElementById('work').scrollIntoView();
      return;
    }
    markup = projectMarkup(project);
    title = project.title;
  } else if (hash === '#playground') {
    markup = playgroundMarkup();
    title = 'Visual playground';
  } else {
    markup = explorationsMarkup();
    title = 'More explorations';
  }
  if (menu.open) closeMenu();
  detail.querySelectorAll('video').forEach(video => video.pause());
  detailContent.innerHTML = markup;
  mountMedia(detailContent);
  if (!detail.open) detail.showModal();
  detail.scrollTop = 0;
  lockPage();
  detail.querySelector('[data-close-detail]').focus({ preventScroll: true });
  document.title = `${title} — Eunwoo Choi`;
}

function closeDetail() {
  if (history.state?.portfolioOverlay) {
    history.back();
  } else {
    history.replaceState(null, '', returnHash || '#work');
    showRoute();
  }
}

document.querySelector('.menu-toggle').addEventListener('click', () => {
  menu.showModal();
  lockPage();
});
document.querySelector('[data-close-menu]').addEventListener('click', closeMenu);
menu.addEventListener('close', lockPage);
menu.addEventListener('click', event => {
  if (event.target.closest('nav a')) closeMenu();
});
detail.addEventListener('cancel', event => {
  event.preventDefault();
  closeDetail();
});
detail.addEventListener('close', lockPage);
detail.addEventListener('click', event => {
  if (event.target.closest('[data-close-detail]')) closeDetail();
});

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const hash = anchor.getAttribute('href');
  if (!isDetailHash(hash)) return;
  event.preventDefault();
  if (!detail.open) {
    returnFocus = anchor;
    returnY = window.scrollY;
    returnHash = location.hash;
    history.pushState({ portfolioOverlay: true, returnHash, returnY }, '', hash);
  } else {
    history.replaceState(history.state, '', hash);
  }
  showRoute();
});
window.addEventListener('hashchange', showRoute);

const roles = ['builder.', 'designer.', 'debater.', 'researcher.', 'entrepreneur.'];
const roleWord = document.getElementById('role-word');
let roleIndex = 0;
document.querySelector('.role-switch').addEventListener('click', () => {
  roleIndex = (roleIndex + 1) % roles.length;
  roleWord.textContent = roles[roleIndex];
  if (!reducedMotion.matches) roleWord.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'ease-out' });
});

const ribbon = document.querySelector('.ribbon-track');
let scrollQueued = false;
window.addEventListener('scroll', () => {
  if (scrollQueued || reducedMotion.matches) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    ribbon.style.transform = `translate3d(${-((window.scrollY * .14) % 300)}px,0,0)`;
    scrollQueued = false;
  });
}, { passive: true });

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .06, rootMargin: '0px 0px 40px 0px' });
  document.querySelectorAll('.project, .award, .experience-list article').forEach(element => {
    element.classList.add('reveal-pending');
    observer.observe(element);
  });
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    document.querySelectorAll('.reveal-pending').forEach(element => element.classList.add('is-visible'));
  });
}

if (isDetailHash(location.hash) && history.state?.portfolioOverlay) {
  returnY = history.state.returnY || 0;
  returnHash = history.state.returnHash || '';
}
mountMedia();
showRoute();
