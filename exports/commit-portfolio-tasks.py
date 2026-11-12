#!/usr/bin/env python3
"""Commit the imported homepage tasks on top of the existing portfolio history.

Prepared for this repository baseline; source hashes prevent accidental changes.
The five commits retain the original task order without modifying site files.
"""
from pathlib import Path
import hashlib
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {'editorial.html': '624e98d65c9dbf943a8ad42847c8e3befce616c112394377f54bbc9c470806da',
 'EDITORIAL-README.md': 'beb1764272c3720e0209e112bed215cdafe2a826dd6a960b6baa4898d0599ab9',
 'app.js': 'ff2bd99f51df342a9e58915a91f21a8d257a2289b875b261d48b37abf0d258bd',
 'media.js': '0110d3b9d0ae3290d891115a182c9b086c694afe710dca4176c0dd067f65994a',
 'styles.css': '599ee4080637eabff723552232ea4b8ba445d4df5ff3ac52f67b77a265723620',
 'assets/fonts/dm-sans-regular.ttf': 'b0ae3e89a7d3ef2b1838bb4b1ceb0b17cc3435af061eee809d76aa623ff116e9',
 'assets/fonts/dm-sans-medium.ttf': '376427b5322148d8de1e03f263bcca4935a2d60ba71d9f94f4947ab664c711ae',
 'assets/fonts/ibm-plex-mono.ttf': 'a7fdc993f9f0387caedba4e42521136fa97e4c0837ae6239bf0413ccf8af00c2',
 'assets/fonts/DM-Sans-OFL.txt': '9af36190332437f5ecd09974de43c1f7c77a310a996cdd8ceb25628b458840e1',
 'assets/fonts/IBM-Plex-Mono-OFL.txt': '7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da',
 'index.html': 'ae3f6db924d117153a38ecc8ec2fc70f5c23fba9c922b2ce17f9ff16bbd634db',
 'home.css': 'f6baa0e4bb311be1293e0f3de8b319581d5330b0cba135f1ce5f833d078e11f9',
 'home.js': '64916c9310adc62147a9f2e136589807bfccb3e01b35434440c0c82e89a48773',
 'ascii-art.js': 'd4c0ba5bd73cc2618afef95caa09ec0a0114c7788123e6961f2af8ce71529288',
 'README.md': '94093ae8eafd9a7b618d61109c05ea230bc6a20c9447a9a804120dad95d9edb3',
 'assets/fonts/anonymous-pro-regular.ttf': '46d8b9a5f4b38fc9d30f3cdd676d4c6f78a9bef949bb1a8304216cc731eb87f8',
 'assets/fonts/Anonymous-Pro-OFL.txt': '8594350034ab1cb85a1946ef8852e69290255816c311450a66fed6eeda9d6292',
 'assets/images/.gitkeep': '01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b'}
SITE = ''
BASELINE_HEAD = '629fa533f15c61a7e658927363887c7ed98626f7'
BASE = ['editorial.html', 'EDITORIAL-README.md', 'app.js', 'media.js', 'styles.css', 'assets/fonts/dm-sans-regular.ttf', 'assets/fonts/dm-sans-medium.ttf', 'assets/fonts/ibm-plex-mono.ttf', 'assets/fonts/DM-Sans-OFL.txt', 'assets/fonts/IBM-Plex-Mono-OFL.txt', 'assets/images/.gitkeep']

def git(*args, data=None, check=True):
    result = subprocess.run(['git', *args], cwd=ROOT, input=data, capture_output=True)
    if check and result.returncode:
        sys.exit(result.stderr.decode().strip() or result.stdout.decode().strip() or 'Git command failed.')
    return result

def content(path):
    return (ROOT / path).read_bytes()

def stage(path, data=None):
    blob = git('hash-object', '-w', '--stdin', data=content(path) if data is None else data).stdout.decode().strip()
    git('update-index', '--add', '--cacheinfo', '100644', blob, path)

def commit(message):
    # Preserve the hash-verified third-party license files, including their CRLFs.
    git('diff', '--cached', '--check', '--', '.', ':(exclude)assets/fonts/*-OFL.txt')
    print(git('commit', '-m', message).stdout.decode(), end='', flush=True)

if git('rev-parse', '--show-toplevel').stdout.decode().strip() != str(ROOT):
    sys.exit('Run this script from the prepared portfolio repository.')
if git('rev-parse', '--verify', 'HEAD').stdout.decode().strip() != BASELINE_HEAD:
    sys.exit('The repository baseline changed or these tasks were already committed. No changes made.')
if git('diff', '--cached', '--name-only').stdout.strip():
    sys.exit('The index already contains staged files. No changes made.')
for key in ['user.name', 'user.email']:
    if not git('config', '--get', key, check=False).stdout.strip():
        sys.exit('Configure your Git author identity first. No changes made.')
for path, expected in EXPECTED.items():
    if not (ROOT/path).is_file() or hashlib.sha256(content(path)).hexdigest() != expected:
        sys.exit(f'{path} changed after preparation. No changes made.')

changed = set(git('diff', '--name-only', '-z').stdout.decode().split('\0')) - {''}
if changed - set(EXPECTED):
    sys.exit('Unrelated tracked changes exist. No changes made.')

html = content(SITE+'index.html').decode()
css = content(SITE+'home.css').decode()
js = content(SITE+'home.js').decode()
static_html = re.sub(r'        <div class="instagram">.*?        </div>', '        <span class="instagram">IG. @eunvv8</span>', html, flags=re.S)
assert static_html != html
layout_html = re.sub(r'^  <script[^\n]+\n', '', static_html, flags=re.M)
layout_css = css[:css.index('.instagram button {')] + css[css.index('@media (max-width: 401px)'):]
layout_css = re.sub(r'^@media \(prefers-reduced-motion: reduce\).+\n?', '', layout_css, flags=re.M)
scene_js = "(() => {\n  'use strict';\n" + js[js.index('  // Pick once per page visit.'):]

for file in BASE:
    stage(SITE+file)
commit('Preserve the existing editorial portfolio')

stage(SITE+'index.html', layout_html.encode())
stage(SITE+'home.css', layout_css.encode())
for file in ['assets/fonts/anonymous-pro-regular.ttf','assets/fonts/Anonymous-Pro-OFL.txt']:
    stage(SITE+file)
commit('Implement the Figma portfolio home')

stage(SITE+'index.html', static_html.encode())
stage(SITE+'home.js', scene_js.encode())
stage(SITE+'ascii-art.js')
commit('Animate random ASCII homepage scenes')

for file in ['index.html','home.css','home.js']:
    stage(SITE+file)
commit('Show the Instagram deactivation notice')

stage(SITE+'README.md')
stage('exports/commit-portfolio-tasks.py')
commit('Document homepage behavior and commit workflow')

if git('diff', '--name-only').stdout.strip():
    sys.exit('Commits created, but there are additional unstaged changes. Review git status.')
print('Created all five commits. Unrelated files remain untracked; nothing was pushed.')
