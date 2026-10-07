# FreeCampus

The public website for [FreeCampus](https://freecampus.org), a community creating free, rigorous learning materials across programming, mathematics, science, and more.

The site is built with MkDocs and a lightweight custom theme. All content lives in `docs/`, while the shared layout and visual system live in `theme/` and `docs/assets/`.

## Run locally

Create the project environment, then start the Makim preview task:

```bash
conda env create -f conda.yaml
conda activate freecampus
makim pages.preview
```

Open <http://127.0.0.1:8000>. For a production build, run:

```bash
makim pages.build
```

## Logo assets

The lowercase wordmark and open-folio symbol are outlined SVGs, with no external
font or image service required. The header uses the forest-green full logo; the
dark footer uses the same logo in ivory. The hero and favicon use the symbol
alone, where the full wordmark would be too small.

`branding/symbol.svg` and `branding/wordmark.svg` are the vector masters. The
symbol's middle opening is shorter than the upper opening, and both follow the
page's angle. Every placement uses the same geometry, with uniform scaling.
After editing a master, regenerate the web assets with Python's standard library:

```bash
python scripts/generate_brand_assets.py
mkdocs build --strict
```

The theme references `docs/assets/images/brand.svg` as a shared SVG sprite.
Standalone `logo.svg`, `logo-reversed.svg`, and `logo-symbol.svg` are also generated
for reuse. Keep their `viewBox` proportions intact; resize with width and automatic
height. The full logo is 220 CSS pixels wide on desktop and 190 on mobile; the hero
symbol scales to half the seal's width. Logo links retain an accessible text name.

CI checks all four pages at seven widths from 320 to 1440 pixels, including both
sides of the mobile navigation breakpoint. It checks SVG loading, proportions,
header spacing, overflow, colors, accessible link names, and mobile menu behavior.
The `responsive-brand-previews` artifact contains desktop, tablet, and phone
screenshots. To run the browser check locally, install `playwright@1.62.1`, run
`npx playwright install chromium`, serve `build/` on port 8000, and run
`node tests/brand-responsive.cjs`.
