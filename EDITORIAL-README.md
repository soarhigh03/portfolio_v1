# Eunwoo Choi — mobile portfolio

A mobile-only, English portfolio in plain HTML, CSS and JavaScript. No build step or dependencies. On larger displays the same mobile layout stays centered, up to 480px wide. The reference design is 402px wide.

## Preview

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/editorial.html. The existing `CNAME` and hosting setup are retained. No deployment or Git push is performed by this change.

## Design

- [Editable Figma page](https://www.figma.com/design/rzysSs2QAfJCHtN9kjzK69/pf_v2?node-id=6-890)
- [Mobile prototype start](https://www.figma.com/proto/rzysSs2QAfJCHtN9kjzK69/pf_v2?node-id=6-1319&starting-point-node-id=6%3A1319)
- Original draft remains at node `1:2`.
- Revised direction: pure white, black, neutral gray placeholders, centered lowercase name, fine rules, alternating upright/inverted ribbon lettering inspired by the second visual reference.
- DM Sans and IBM Plex Mono are hosted locally. Their OFL licenses are in `assets/fonts/`.

## Content and images

- Archived page content: `editorial.html` (`index.html` is the current ASCII homepage).
- Project detail content: `projects` at the top of `app.js`.
- Styling and layout: `styles.css`.
- Image and video mapping: `media.js`.

Copy images into `assets/images/`, then edit the relevant entry in `media.js`. Empty `src` deliberately shows the designed placeholder. Example:

```js
'cse-01': {
  src: 'assets/images/cse-01.webp',
  alt: 'A poster designed for the SNU computer science community',
  fit: 'contain'
}
```

| Keys | Placement | Suggested source |
| --- | --- | --- |
| `patz-cover`, `jarvis-cover`, `ddalgguk-cover`, `d4d-cover` | Home and corresponding project details | Product image, screenshot, demo still; about 1200 × 950px |
| `patz-process`, `jarvis-process`, `ddalgguk-process`, `d4d-process` | Project detail second image | Process diagram or screen montage |
| `debate` | Beyond Work | Debate or community photo; about 1200 × 815px |
| `cse-01` through `cse-03` | Visual playground; first image also on home | CSE publicity graphics; square source preferred |
| `shuttlecock-01` through `shuttlecock-03` | Visual playground; first image also on home | Badminton club graphics; square source preferred |
| `review`, `todo` | More explorations | Re:View poster and task-graph screenshot |

Use `fit: 'contain'` to retain an entire graphic or `fit: 'cover'` for a full-bleed photo. For a video, add `type: 'video'` and optionally `poster: 'assets/images/still.webp'`. Videos do not autoplay; controls appear in project details. Missing/broken media falls back to the placeholder.

## Interactions

- Tap the role under the name to cycle through different perspectives.
- The narrow typographic ribbon follows scroll, with alternating upside-down words.
- Project cards open full-height detail views, with next-project navigation.
- Browser Back and Escape close details; scroll position and keyboard focus return to the originating card.
- Leadership follows Experience, with four featured roles and four more in a keyboard-accessible disclosure. Research and mentoring stay in Experience.
- Menu links jump to home sections. Awards connect to the corresponding project or debate section.
- Visual playground and More explorations open dedicated views.
- Reduced-motion preferences disable transitions and scroll movement.

## Source notes

Career content is based on the supplied SNUSV introduction and conversation. The approximately 2,000 users figure is explicitly historical. Project-specific individual responsibilities, missing experience dates, and detailed D4D technical claims have not been invented. Add these when the underlying details are supplied.

- D4D: [event](https://luma.com/d4d_edth?locale=ko), [award report](https://www.etnews.com/20261019000192).
- JARVIS: second place and award from the supplied introduction. The English competition title is descriptive.
- PATZ: “Top Award” is a descriptive translation of the supplied 최우수상.

The Voku reference returned a blank rendered view in the available browser; the implemented visual direction primarily follows the supplied images, especially the second reference, and the user's monochrome correction.
