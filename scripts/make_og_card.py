#!/usr/bin/env python3
"""Generate the social-sharing (Open Graph / Twitter) card for the LEDT site.

Bakes website/assets/og-card.png at 1200x630 from:
  - assets/earth_backdrop.png            (cover-fit background, darkened)
  - assets/digital_earth_logo_white-01.png (globe mark, tinted with brand gradient)
  - Inter (local variable font) for type

This is a build-time asset script, not a website/runtime dependency. Run with the
system python that has Pillow:

    python3 scripts/make_og_card.py

Re-run whenever the backdrop, logo, or event details change.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "website" / "assets"
OUT = ASSETS / "og-card.png"
FONT_PATH = Path.home() / "Library" / "Fonts" / "Inter-VariableFont_slnt,wght.ttf"

W, H = 1200, 630

# Brand palette (matches styles.css)
TEAL = (62, 225, 200)
BLUE = (124, 199, 255)
VIOLET = (199, 148, 255)
INK = (233, 240, 245)
INK_DIM = (150, 168, 180)


def inter(size, weight="Regular"):
    f = ImageFont.truetype(str(FONT_PATH), size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        names = {"Regular": 400, "Medium": 500, "SemiBold": 600,
                 "Bold": 700, "ExtraBold": 800, "Black": 900}
        try:
            f.set_variation_by_axes([0, names.get(weight, 400)])
        except Exception:
            pass
    return f


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def ramp(t):
    """Three-stop brand gradient: teal -> blue -> violet."""
    t = max(0.0, min(1.0, t))
    if t < 0.5:
        return lerp(TEAL, BLUE, t / 0.5)
    return lerp(BLUE, VIOLET, (t - 0.5) / 0.5)


def cover_fit(img, w, h):
    s = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x = (img.width - w) // 2
    y = (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def tinted_logo(path, target_h):
    """White logo PNG -> filled with the diagonal brand gradient via its alpha."""
    logo = Image.open(path).convert("RGBA")
    scale = target_h / logo.height
    logo = logo.resize((round(logo.width * scale), target_h), Image.LANCZOS)
    w, h = logo.size
    grad = Image.new("RGBA", (w, h))
    px = grad.load()
    for y in range(h):
        for x in range(w):
            t = (x * 0.72 + (h - y) * 0.28) / (w * 0.72 + h * 0.28)
            px[x, y] = ramp(t) + (255,)
    grad.putalpha(logo.getchannel("A"))
    return grad


def main():
    # --- background: cover-fit + darken for contrast --------------------------
    bg = cover_fit(Image.open(ASSETS / "earth_backdrop.png").convert("RGBA"), W, H)

    # Left-weighted dark gradient so the type stays legible.
    overlay = Image.new("RGBA", (W, H))
    op = overlay.load()
    for x in range(W):
        fx = x / W
        if fx < 0.60:
            a = 0.82 - (0.82 - 0.18) * (fx / 0.60)   # 0.82 -> 0.18
        else:
            a = 0.18 + (0.42 - 0.18) * ((fx - 0.60) / 0.40)  # 0.18 -> 0.42
        col = (3, 9, 16, round(255 * a))
        for y in range(H):
            op[x, y] = col
    bg = Image.alpha_composite(bg, overlay)

    # Top + bottom vignette band for polish.
    vign = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vp = vign.load()
    for y in range(H):
        a = 0.0
        if y < 90:
            a = (1 - y / 90) * 0.45
        elif y > H - 110:
            a = ((y - (H - 110)) / 110) * 0.55
        if a:
            for x in range(W):
                vp[x, y] = (2, 7, 13, round(255 * a))
    bg = Image.alpha_composite(bg, vign)

    canvas = bg

    # --- glow + emblem on the right -------------------------------------------
    emblem = tinted_logo(ASSETS / "digital_earth_logo_white-01.png", target_h=430)
    ex = 700 + (W - 700 - emblem.width) // 2 + 18
    ey = (H - emblem.height) // 2 - 6

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = ex + emblem.width // 2, ey + emblem.height // 2
    gd.ellipse([cx - 260, cy - 260, cx + 260, cy + 260], fill=(62, 225, 200, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    canvas = Image.alpha_composite(canvas, glow)
    canvas.alpha_composite(emblem, (ex, ey))

    d = ImageDraw.Draw(canvas)

    # --- left-hand type stack -------------------------------------------------
    LX = 84

    def spaced(draw, xy, text, font, fill, tracking=0):
        x, y = xy
        for ch in text:
            draw.text((x, y), ch, font=font, fill=fill)
            x += draw.textlength(ch, font=font) + tracking
        return x

    # Eyebrow
    eb = inter(25, "SemiBold")
    spaced(d, (LX, 92), "SMITHSONIAN", eb, TEAL, tracking=5)

    # Title
    t1 = inter(92, "ExtraBold")
    d.text((LX - 2, 138), "Living Earth", font=t1, fill=INK)
    # Per-letter gradient on the second line for brand pop.
    x = LX - 2
    y2 = 232
    word = "Digital Twin"
    total = sum(d.textlength(c, font=t1) for c in word)
    acc = 0.0
    for ch in word:
        wch = d.textlength(ch, font=t1)
        d.text((x, y2), ch, font=t1, fill=ramp(acc / total))
        x += wch
        acc += wch

    # Gradient divider rule
    ry = 358
    rule = Image.new("RGBA", (360, 4))
    rp = rule.load()
    for i in range(360):
        rp[i, 0] = ramp(i / 360) + (255,)
    for j in range(1, 4):
        for i in range(360):
            rp[i, j] = rule.getpixel((i, 0))
    canvas.alpha_composite(rule, (LX, ry))

    # Event block
    d2 = ImageDraw.Draw(canvas)
    ev = inter(27, "Bold")
    spaced(d2, (LX, 392), "INNOVATION WORKSHOP", ev, INK, tracking=3)

    dates = inter(40, "ExtraBold")
    d2.text((LX, 430), "Sept 14–16, 2026", font=dates, fill=BLUE)

    venue = inter(25, "Medium")
    d2.text((LX, 488),
            "Smithsonian Astrophysical Observatory  ·  Cambridge, MA",
            font=venue, fill=INK_DIM)

    canvas.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
