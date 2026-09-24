# Chromium Study Notebook

A static, dependency-free study book built from the supplied `chromium-ref/` and `chromium-writings/` material. It follows the dependencies in those sources: checkout and builds; processes, Mojo, navigation, security, and loading; Blink and page state; compiler representations; CI and releases; then measurement and independent investigation.

## Run

From the repository root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. Keep the command running while you browse, and press `Ctrl+C` to stop it. Serve the site over HTTP so browser modules and the local evidence and source viewers load reliably. No package installation or build step is required.

## Project layout

```text
index.html        Site entry point (also the GitHub Pages entry point)
assets/css/       Styles
assets/js/        Application and chapter modules
assets/fonts/     Bundled fonts and license
assets/           Chromium logo
data/             Generated evidence index used by the site
source-tree/      Selected source snapshots for the in-site reader
research/         Research dossiers used to build the evidence index
scripts/          Data generation and content audit
tests/            Browser interaction check
```

The site needs no build step. For GitHub Pages, select the `main` branch and `/ (root)` as the publishing source; `index.html` and all of its assets are already in place.

## What is included

- Twenty-three self-contained chapters with 208 teaching sections in a deliberate reading order: rewritten explanations, implementation paths, questions, source exercises, notes, a worked end-to-end page load, and a final independent investigation. Detailed material appears directly in the chapters.
- A material-coverage map accounting for all 59 teaching sections and five bibliography sections of the five supplied writings.
- A linked glossary of core terms and a chapter search that indexes the complete lesson text, source paths, and glossary definitions.
- A searchable in-site evidence index with every one of the 3,705 fact-ledger entries and 74 unresolved questions from the three research dossiers.
- Selected locally present source files copied into `source-tree/` for line-numbered reading. Links also point to pinned upstream revisions. The Chromium logo is copied from `chromium-ref/src/docs/images/chromium_logo.png`.

Progress and notes are stored in browser `localStorage` only.

Section headings have permanent links. Search opens matching passages, mobile chapters include a table of contents, and source snapshots link back to the originating chapter. The book remembers your last chapter and reading position. Predictions, investigation notes, and checked experiment steps are saved locally; notes can be exported as Markdown.

Each chapter states what the reader should be able to explain. Related-chapter links explain why the concepts connect. Seven worked reasoning problems and the interactive navigation model provide practice with lifecycle, authority, scheduling, rendering, build inputs, and failure attribution.

Twenty-two contextual figures explain process ownership, asynchronous messages, parser reentrancy, task scheduling, rendering state, garbage collection, compiler dependencies, build inputs, and release history. They appear within the relevant teaching sections, with concrete examples, source references, and questions whose explanations can be revealed. Hypothetical traces and simplified models are labeled. Reading estimates include this material and update from the chapter text.

Figures live in `assets/js/figures.js` and attach to exact section titles through `withFigures()`. The audit rejects missing attachment points and unlisted source references, and checks that adding figures preserves the original sections. Native HTML and SVG render without a diagram service or external library.

The interface bundles Geist Sans and Geist Mono. Their license is in `assets/fonts/OFL.txt` ([official project](https://github.com/vercel/geist-font)).

## Provenance and limits

The main Chromium checkout is `f288fed6c601ae22461c9c9d8189004050abfaeb` (Chrome 156.0.8067.0). The depot_tools mirror is `0306e4682b4ac35287c726fa35a983157a625902`. The standalone V8 mirror is `315d9c945ac3b1612c3690fbe69e48acce263bed`, reporting 15.6.0. Chromium's `DEPS` pins V8 15.6.19; they are different trees.

The checkout is sparse. The source file lists label absent local files as **research cited**, and the lessons avoid treating inaccessible implementation or internal service behavior as verified. Startup and service-worker documents contain historical details; the chapters flag these where current code must be checked. The research dossiers are included in `research/` for provenance. The website has no links that route the reader to those writings; the chapter text, coverage map, and evidence index are included here.

## Regenerate the research index

From this repository, run `python3 scripts/build_evidence.py` to rebuild `data/evidence.json` from the included research dossiers. `python3 scripts/build_coverage.py` rebuilds `assets/js/coverage.js`, but requires the original `chromium-writings/` directory beside this repository and the `beautifulsoup4` Python package. The generated coverage file is already included, so neither script is needed to run the site.

Run `node scripts/audit_book.mjs` to check chapter order, complete section rendering, local source links, original-writing coverage, and preserved research-record counts.

For browser interaction tests, start a dedicated Chrome profile in another terminal:

```bash
google-chrome --headless --remote-debugging-port=9227 --user-data-dir=/tmp/chr-study-ux-test --allow-file-access-from-files about:blank
node tests/reading-ux.mjs
```

The test clears study data in that test profile. It checks source navigation, passage links, search and menu keyboard controls, saved predictions and notes, Markdown export, worked answers, the navigation model, and all chapters at a mobile viewport. Node 22 or newer is required for the test; the site itself needs no Node runtime.
