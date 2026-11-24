#!/usr/bin/env python3
"""Build homepage banner frames from real Immersive Gallery render assets."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
VIZ = ROOT / 'public/visualizer-app/images/C8_Stingray'
OUT = ROOT / 'public/assets/images/banner'
OUT.mkdir(parents=True, exist_ok=True)

# Same 3/4 view the live visualizer uses as its default hero frame.
FRAME = '5.webp'
COMBOS = [
    ('viz-01', 'Torch Red', 'Daytona', 'Gloss Black'),
    ('viz-02', 'Arctic White', 'Sebring', 'Titanium'),
    ('viz-03', 'Rapid Blue metallic', 'Speedway', 'Chrome'),
    ('viz-04', 'Black', 'Daytona', 'Bronze Brushed Tint'),
]
WIDTHS = (800, 1280, 1920)


def composite(paint: str, style: str, finish: str) -> Image.Image:
    body = Image.open(VIZ / 'Body' / paint / FRAME).convert('RGBA')
    wheel = Image.open(VIZ / 'Wheels' / style / finish / FRAME).convert('RGBA')
    mask = Image.open(VIZ / 'Wheels' / style / 'Masks' / FRAME).convert('L')
    wheel.putalpha(mask)
    return Image.alpha_composite(body, wheel).convert('RGB')


def emit(img: Image.Image, stem: str) -> None:
    for width in WIDTHS:
        height = round(width * 9 / 16)
        # Native 1920x1080 composites stay unscaled so the four looks stay pixel-locked.
        if img.size == (width, height):
            resized = img
        else:
            resized = img.resize((width, height), Image.Resampling.LANCZOS)
        webp = OUT / f'{stem}-{width}.webp'
        avif = OUT / f'{stem}-{width}.avif'
        resized.save(webp, 'WEBP', quality=78, method=5)
        resized.save(avif, 'AVIF', quality=48)
        print(stem, width, 'webp', webp.stat().st_size, 'avif', avif.stat().st_size)


def main() -> None:
    for stem, paint, style, finish in COMBOS:
        print('combo', paint, style, finish)
        emit(composite(paint, style, finish), stem)


if __name__ == '__main__':
    main()
