'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const homeSource = readFileSync(path.join(__dirname, '../home.js'), 'utf8');
const artSource = readFileSync(path.join(__dirname, '../ascii-art.js'), 'utf8');

function homepageOptions(search, random = 0) {
  let options;
  const element = {
    dataset: {},
    closest() { return this; },
    addEventListener() {},
  };
  vm.runInNewContext(homeSource, {
    document: {
      getElementById: () => element,
      querySelector: () => element,
      addEventListener() {},
    },
    location: { search },
    URLSearchParams,
    Math: Object.assign(Object.create(Math), { random: () => random }),
    window: { AsciiArtwork: class { constructor(_, value) { options = value; } } },
  });
  return options;
}

test('normal visits split evenly between flower and fireworks', () => {
  for (const [random, scene] of [[0, 'flower'], [.4999, 'flower'], [.5, 'fireworks'], [.9999, 'fireworks']]) {
    const options = homepageOptions('', random);
    assert.equal(options.scene, scene);
    assert.equal(options.stillTime, null);
  }
});

test('scene overrides only accept the two supported scenes', () => {
  assert.equal(homepageOptions('?scene=flower', .99).scene, 'flower');
  assert.equal(homepageOptions('?scene=fireworks', 0).scene, 'fireworks');
  for (const scene of ['bird', 'constructor', '__proto__', '<script>']) {
    assert.equal(homepageOptions(`?scene=${encodeURIComponent(scene)}`, .99).scene, 'fireworks');
  }
});

test('preview times stay finite and within one hour', () => {
  for (const [value, expected] of [['5.7', 5.7], ['-2', 0], ['3600', 3600], ['1e20', 3600], ['1e308', 3600]]) {
    assert.equal(homepageOptions(`?scene=fireworks&time=${value}`).stillTime, expected);
  }
  for (const value of ['Infinity', 'NaN', 'invalid', '1e309']) {
    assert.equal(homepageOptions(`?time=${value}`).stillTime, null);
  }
});

test('fireworks finish rendering even beyond safe integer precision', () => {
  let draws = 0;
  const paint = {
    fillRect(...values) {
      assert(values.every(Number.isFinite));
      draws++;
    },
    beginPath() {},
    arc(...values) { assert(values.every(Number.isFinite)); },
    fill() {},
  };
  const context = vm.createContext({ window: {}, paint });
  vm.runInContext(artSource, context);
  for (const time of [0, 3.4, 3600, 1e20]) {
    context.time = time;
    vm.runInContext('window.AsciiArtwork.prototype.fireworks(paint, time, 402, 571)', context, { timeout: 1000 });
  }
  assert(draws > 0);
});
