#!/usr/bin/env python3
"""Poster-print treatment for the homepage film slide.

Source is a real E5 vehicle-gallery photo (no generated cars).
Outputs a 1920x1080 PNG; generate-banner-images.mjs emits the 800/1280/1920
WebP+AVIF variants from that master.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
# Black C7 Grand Sport on Daytona Bronze Brushed Tint — palms, warm Florida
# light, 3/4 rear. Gallery set used by /gallery and the Immersive Gallery.
SOURCE = (
    ROOT
    / "public/assets/images/gallery/corvette"
    / "2018-c7-grand-sport-black-with-e5-daytona-bronze-brushed-tint-wheels"
    / "1.webp"
)
OUT = ROOT / "scripts/assets/film-poster-master.png"


def crop_16x9(im: Image.Image) -> Image.Image:
    w, h = im.size
    target = 16 / 9
    if w / h > target:
        nw = int(round(h * target))
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = int(round(w / target))
    # Keep palms + car; drop extra asphalt at the bottom.
    top = max(0, int((h - nh) * 0.12))
    if top + nh > h:
        top = h - nh
    return im.crop((0, top, w, top + nh))


def duotone_map(gray: np.ndarray) -> np.ndarray:
    """Map luminance to a 70s burnt-orange / gold print palette."""
    stops = np.array(
        [
            [0.00, 28, 8, 4],
            [0.18, 62, 18, 8],
            [0.38, 140, 48, 14],
            [0.58, 196, 96, 28],
            [0.78, 228, 168, 78],
            [1.00, 248, 228, 176],
        ],
        dtype=np.float32,
    )
    t = gray.astype(np.float32) / 255.0
    out = np.empty(gray.shape + (3,), dtype=np.float32)
    for c in range(3):
        out[..., c] = np.interp(t, stops[:, 0], stops[:, c + 1])
    return out


def grain(shape: tuple[int, int], amount: float = 14.0) -> np.ndarray:
    rng = np.random.default_rng(1977)
    n = rng.normal(0, amount, shape).astype(np.float32)
    return n


def vignette(h: int, w: int) -> np.ndarray:
    y = np.linspace(-1.15, 1.15, h, dtype=np.float32)[:, None]
    x = np.linspace(-1.05, 1.25, w, dtype=np.float32)[None, :]  # darker on the copy (right)
    r = np.sqrt(x * x + y * y)
    v = np.clip(1.0 - np.clip(r - 0.42, 0, None) * 0.48, 0.5, 1.0)
    return v


def halftone(gray: np.ndarray, cell: int = 5) -> np.ndarray:
    h, w = gray.shape
    yy, xx = np.mgrid[0:h, 0:w]
    cy = (yy % cell) - cell / 2 + 0.5
    cx = (xx % cell) - cell / 2 + 0.5
    dist = np.sqrt(cx * cx + cy * cy)
    radius = (1.0 - gray / 255.0) * (cell * 0.55)
    return (dist < radius).astype(np.float32)


def main() -> None:
    im = Image.open(SOURCE).convert("RGB")
    im = crop_16x9(im).resize((1920, 1080), Image.Resampling.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(1.18)
    im = ImageEnhance.Color(im).enhance(0.72)
    im = ImageEnhance.Sharpness(im).enhance(1.15)

    rgb = np.asarray(im).astype(np.float32)
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    tone = duotone_map(lum)

    # Keep the real car/wheels readable: mix original photo with the print grade.
    mixed = 0.5 * rgb + 0.5 * tone
    mixed = mixed * 0.94 + 16  # lift crushed blacks so the gallery car still reads

    # Soft halftone in the sky/trees only (bright areas), not on the car body.
    ht = halftone(lum, cell=4)[..., None]
    sky = np.clip((lum - 90) / 90, 0, 1)[..., None]
    mixed = mixed * (1 - sky * ht * 0.18) + tone * (sky * ht * 0.18)

    mixed += grain(lum.shape)[..., None]
    mixed *= vignette(*lum.shape)[..., None]
    mixed = np.clip(mixed, 0, 255).astype(np.uint8)

    out = Image.fromarray(mixed, "RGB")
    out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=4))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, "PNG")
    print("wrote", OUT, out.size)


if __name__ == "__main__":
    main()
