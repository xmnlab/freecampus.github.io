#!/usr/bin/env python3
"""Build every logo application from the same vector masters (stdlib only)."""

from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/assets/images"
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
GREEN = "#173f35"
IVORY = "#f5f3ed"


def paths(filename):
    root = ET.parse(ROOT / "branding" / filename).getroot()
    return "\n".join(
        ET.tostring(element, encoding="unicode")
        .replace(f' xmlns="{NS}"', "").strip()
        for element in root.iter(f"{{{NS}}}path")
    )


def svg(viewbox, body, title, color=GREEN):
    return (
        f'<svg xmlns="{NS}" viewBox="{viewbox}" color="{color}"'
        f' fill="currentColor" role="img">\n'
        f"  <title>{title}</title>\n{body}\n</svg>\n"
    )


def main():
    mark = paths("symbol.svg")
    wordmark = paths("wordmark.svg")
    logo = f'{mark}\n<g transform="translate(339 11)">{wordmark}</g>'

    # External <use> elements inherit each placement's CSS color. The same
    # mark is used in the header, footer and hero; it is never independently drawn.
    sprite = (
        f'<svg xmlns="{NS}">\n<defs>\n'
        f'<g id="symbol" fill="currentColor">{mark}</g>\n'
        f'<g id="logo" fill="currentColor">{logo}</g>\n'
        "</defs>\n</svg>\n"
    )
    assets = {
        "brand.svg": sprite,
        "logo.svg": svg("0 0 1297 183", logo, "freecampus"),
        "logo-reversed.svg": svg("0 0 1297 183", logo, "freecampus", IVORY),
        "logo-symbol.svg": svg("0 0 296 182", mark, "FreeCampus open folio"),
        "favicon.svg": svg(
            "0 0 64 64",
            f'<rect width="64" height="64" rx="16" fill="{GREEN}"/>'
            f'<g transform="translate(6.1 16.1) scale(.175)">{mark}</g>',
            "FreeCampus",
            IVORY,
        ),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    for name, content in assets.items():
        (OUT / name).write_text(content, encoding="utf-8")
    print(f"Generated {len(assets)} brand assets from shared masters.")


if __name__ == "__main__":
    main()
