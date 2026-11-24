#!/usr/bin/env python3
"""Homepage film-poster car cutout.

Source is a real E5 vehicle-gallery photo (no generated cars, wheels unaltered):
  public/assets/images/gallery/corvette/2018-c7-grand-sport-black-with-e5-daytona-bronze-brushed-tint-wheels/1.webp

Background was removed once (rembg) into scripts/assets/film-car-cutout.png.
This script only trims empty alpha and is safe to re-run without rembg.
Banner WebP/AVIF variants are emitted by generate-banner-images.mjs.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "scripts/assets/film-car-cutout.png"
OUT = SRC


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    alpha = np.array(im)[..., 3]
    ys, xs = np.where(alpha > 18)
    pad = 12
    box = (
        max(0, int(xs.min()) - pad),
        max(0, int(ys.min()) - pad),
        min(im.width, int(xs.max()) + pad),
        min(im.height, int(ys.max()) + pad),
    )
    crop = im.crop(box)
    crop.save(OUT)
    print("wrote", OUT, crop.size)


if __name__ == "__main__":
    main()
