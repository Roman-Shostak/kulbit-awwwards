#!/usr/bin/env python3
"""
Font pipeline: TTF/OTF from the client → subset WOFF2 files for the Astro Fonts API.

    pnpm fonts [source-dir] [out-dir]
        source-dir  default src/assets/fonts/source   (the client's .ttf / .otf files)
        out-dir     default src/assets/fonts          (one .woff2 per weight × subset)

For every source font it writes `<family>-<weight>[-italic]-<subset>.woff2` for the subsets
latin, latin-ext, cyrillic, cyrillic-ext (Google Fonts ranges — identical to `subsets` in
astro.config.mjs). Subsets the font does not cover are skipped. At the end it prints the
`variants(...)` lines to paste into astro.config.mjs.

Requires fonttools + brotli (`python3 -m pip install --user fonttools brotli`;
the SessionStart hook installs them when missing).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ImportError:  # pragma: no cover
    sys.exit("[fonts] fonttools is missing: python3 -m pip install --user fonttools brotli")

try:
    import brotli  # noqa: F401  (needed by fontTools for the woff2 flavor)
except ImportError:  # pragma: no cover
    sys.exit("[fonts] brotli is missing: python3 -m pip install --user brotli")

SUBSETS = {
    "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,"
    "U+0329,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,"
    "U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,"
    "U+2C60-2C7F,U+A720-A7FF",
    "cyrillic": "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
    "cyrillic-ext": "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
}

WEIGHT_NAMES = {
    100: "thin",
    200: "extralight",
    300: "light",
    400: "regular",
    500: "medium",
    600: "semibold",
    700: "bold",
    800: "extrabold",
    900: "black",
}

# Glyphs a subset always contains (.notdef, space, nbsp …); a subset with no more than this
# many glyphs covers nothing of the range and is skipped.
EMPTY_SUBSET_GLYPHS = 4


def kebab(text: str) -> str:
    text = re.sub(r"[^A-Za-z0-9]+", "-", text).strip("-").lower()
    return re.sub(r"-{2,}", "-", text)


def font_info(path: Path) -> tuple[str, int, bool]:
    """(family, weight, italic) from the name and OS/2 tables."""
    font = TTFont(path, lazy=True)
    name = font["name"]
    family = (
        name.getDebugName(16)  # typographic family (without the style)
        or name.getDebugName(1)
        or path.stem
    )
    weight = int(font["OS/2"].usWeightClass) if "OS/2" in font else 400
    weight = min(WEIGHT_NAMES, key=lambda w: abs(w - weight))
    italic = bool(font["OS/2"].fsSelection & 1) if "OS/2" in font else False
    subfamily = (name.getDebugName(17) or name.getDebugName(2) or "").lower()
    italic = italic or "italic" in subfamily or "oblique" in subfamily
    font.close()
    return family, weight, italic


def build(source: Path, out: Path) -> list[tuple[str, int, str]]:
    family, weight, italic = font_info(source)
    base = f"{kebab(family)}-{WEIGHT_NAMES[weight]}{'-italic' if italic else ''}"
    written = 0
    for subset_name, unicodes in SUBSETS.items():
        target = out / f"{base}-{subset_name}.woff2"
        subset.main(
            [
                str(source),
                f"--output-file={target}",
                f"--unicodes={unicodes}",
                "--flavor=woff2",
                "--layout-features=*",
                "--no-hinting",
                "--desubroutinize",
                "--name-IDs=*",
            ]
        )
        glyphs = len(TTFont(target, lazy=True).getGlyphOrder())
        if glyphs <= EMPTY_SUBSET_GLYPHS:
            target.unlink()
            print(f"[fonts] {source.name}: no {subset_name} glyphs, skipped")
            continue
        written += 1
        print(f"[fonts] {source.name} → {target} ({target.stat().st_size // 1024} KB, {glyphs} glyphs)")
    if written == 0:
        sys.exit(f"[fonts] {source.name}: no subset produced any glyphs")
    return [(base, weight, "italic" if italic else "normal")]


def main() -> None:
    source_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "src/assets/fonts/source")
    out_dir = Path(sys.argv[2] if len(sys.argv) > 2 else "src/assets/fonts")
    sources = sorted(p for p in source_dir.glob("*") if p.suffix.lower() in {".ttf", ".otf"})
    if not sources:
        sys.exit(f"[fonts] no .ttf/.otf files in {source_dir}")
    out_dir.mkdir(parents=True, exist_ok=True)

    variants: list[tuple[str, int, str]] = []
    for path in sources:
        variants.extend(build(path, out_dir))

    print("\n[fonts] paste into astro.config.mjs → fonts[].options.variants:")
    for base, weight, style in variants:
        print(f"  ...variants('{base}', {{ weight: {weight}, style: '{style}' }}),")


if __name__ == "__main__":
    main()
