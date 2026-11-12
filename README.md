# Eunwoo Choi — animated ASCII home

Buildless HTML, CSS, and JavaScript implementation of [Figma Section 2](https://www.figma.com/design/rzysSs2QAfJCHtN9kjzK69/pf_v2?node-id=18-206).

## Preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173. Reload to randomly choose another scene. Nothing is published by running the preview.

## Behavior

- One randomly selected ASCII scene per visit: a perched bird that flaps and flies away, a flower that blooms and sways, or repeating fireworks.
- All visible art is rendered from ASCII glyphs. Shapes, surfaces, and particles are procedural; no mockup images or videos are used.
- The homepage occupies one viewport without scrolling. Its artwork takes the remaining space above the contact card.
- The 402 × 874 reference uses a 571px art region and a 303px card. Below 402px wide, the card scales proportionally; on wider displays it remains 402px wide and centered.
- Figma typography is preserved: Arial Black 35px / 29px, Anonymous Pro 15px, with the original tracking and colors.
- Anonymous Pro is bundled under the OFL. Arial Black uses the installed system font, with Arial/sans-serif fallback on devices that do not have it. The proprietary system font is not redistributed.
- Email opens a mail composer. GitHub and LinkedIn open their corresponding URLs.
- Instagram toggles a small `deactivated at the moment` speech bubble. Tap outside, tap again, move keyboard focus away, or press Escape to dismiss.
- Animation pauses while the tab is hidden. Reduced-motion preferences show a representative still.
- Career navigation is intentionally undecided, as requested.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Current homepage and contact links |
| `home.css` | Figma layout and speech bubble |
| `home.js` | Contact behavior and scene selection |
| `ascii-art.js` | ASCII renderer and procedural animation |
| `assets/fonts/anonymous-pro-regular.ttf` | Contact and ASCII font |
| `editorial.html` | Previous long-form portfolio, preserved for future work |
| `EDITORIAL-README.md` | Previous portfolio documentation |

For visual review, `?scene=bird`, `?scene=flower`, and `?scene=fireworks` select a scene. Add `&time=5.7` for a deterministic still at that animation time. Normal visits have no visible controls or query parameters.

Source requirements and the distinction between current display copy and biography evidence are recorded in `context/HOME_DESIGN.md` at the project root.
