"""Generate PWA icons and iOS startup splash screens for DUXTOMER."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT_ICONS = '/home/claude/wc26-app/public/icons'
OUT_SPLASH = '/home/claude/wc26-app/public/splash'
TEAM_IMG = '/home/claude/wc26-app/public/duxtomer-team.png'

# Brand colors
BG_DEEP = (2, 15, 42)      # #020F2A
GOLD = (201, 165, 87)       # #C9A557
GOLD_BRIGHT = (229, 197, 110)
WHITE = (255, 255, 255)
MUTED = (138, 155, 191)

FONT_CONDENSED_BOLD_OBLIQUE = '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-BoldOblique.ttf'
FONT_CONDENSED_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf'
FONT_POPPINS_BOLD = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'

# ====================================================================
# APP ICON — stacked "2/6" in italic gold on navy with subtle gradient
# ====================================================================

def make_icon(size: int) -> Image.Image:
    img = Image.new('RGB', (size, size), BG_DEEP)
    draw = ImageDraw.Draw(img)

    # Padded inner area
    pad = int(size * 0.08)
    inner = size - 2 * pad

    # Subtle radial vignette using a separate layer (lighter at top-left)
    glow = Image.new('RGBA', (size, size), (0,0,0,0))
    gdraw = ImageDraw.Draw(glow)
    for r in range(int(size*0.4), 0, -10):
        alpha = int(40 * (1 - r / (size*0.4)))
        gdraw.ellipse([size*0.1 - r, size*0.1 - r, size*0.1 + r, size*0.1 + r],
                      fill=(229, 197, 110, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(size//12))
    img.paste(glow, (0,0), glow)

    # Stacked "2 / 6" — match the WC26 logo treatment
    # Font size approximated as proportion of inner
    fs = int(inner * 0.62)
    try:
        font = ImageFont.truetype(FONT_CONDENSED_BOLD_OBLIQUE, fs)
    except IOError:
        font = ImageFont.load_default()

    # Draw "2" upper, "6" lower, slight overlap
    for char, y_frac, color in [('2', 0.05, GOLD_BRIGHT), ('6', 0.42, GOLD)]:
        bbox = draw.textbbox((0,0), char, font=font)
        cw = bbox[2] - bbox[0]
        ch = bbox[3] - bbox[1]
        # Slight italic slant already in font; horizontal centering compensates for sidebearing
        x = (size - cw) // 2 - bbox[0]
        y = int(size * y_frac) - bbox[1]
        draw.text((x, y), char, fill=color, font=font)

    # Top stripe (3 host nations)
    stripe_h = max(2, size // 64)
    for i, color in enumerate([(31, 58, 138), (220, 38, 38), (4, 120, 87)]):  # USA blue, Canada red, Mexico green
        x0 = i * size // 3
        x1 = (i + 1) * size // 3
        draw.rectangle([x0, 0, x1, stripe_h], fill=color)

    return img


for size in [48, 72, 96, 128, 144, 152, 192, 384, 512]:
    icon = make_icon(size)
    icon.save(f'{OUT_ICONS}/icon-{size}.png', 'PNG', optimize=True)
    print(f'icon-{size}.png: {os.path.getsize(f"{OUT_ICONS}/icon-{size}.png")/1024:.1f}KB')

# Apple touch icon (no transparency, 180x180)
make_icon(180).save(f'{OUT_ICONS}/apple-touch-icon.png', 'PNG', optimize=True)
print(f'apple-touch-icon.png: {os.path.getsize(f"{OUT_ICONS}/apple-touch-icon.png")/1024:.1f}KB')

# Maskable icon — extra safe-zone padding (apply 20% padding on all sides)
def make_maskable(size: int) -> Image.Image:
    canvas = Image.new('RGB', (size, size), BG_DEEP)
    inner_size = int(size * 0.6)  # 60% center
    inner_icon = make_icon(inner_size)
    offset = (size - inner_size) // 2
    canvas.paste(inner_icon, (offset, offset))
    return canvas

make_maskable(512).save(f'{OUT_ICONS}/maskable-512.png', 'PNG', optimize=True)
print(f'maskable-512.png saved')

# Favicon
make_icon(32).save(f'{OUT_ICONS}/favicon-32.png', 'PNG', optimize=True)
make_icon(16).save(f'{OUT_ICONS}/favicon-16.png', 'PNG', optimize=True)
print('favicons saved')

# ====================================================================
# iOS STARTUP IMAGES — composed with team photo + DUXTOMER branding
# ====================================================================

team_src = Image.open(TEAM_IMG).convert('RGB')
print(f'\nTeam source: {team_src.size}')

# Apple's required sizes (most common modern iPhones). Format: name, width, height
# These cover ~95% of in-use iPhones as of 2026.
IOS_SPLASH_SIZES = [
    # iPhone 14/15/16 Pro Max (1290x2796)
    ('iphone-pro-max', 1290, 2796),
    # iPhone 14/15/16 Pro (1179x2556)
    ('iphone-pro', 1179, 2556),
    # iPhone 14/15 Plus (1284x2778)
    ('iphone-plus', 1284, 2778),
    # iPhone 14/15 (1170x2532)
    ('iphone', 1170, 2532),
    # iPhone 12/13 mini (1080x2340)
    ('iphone-mini', 1080, 2340),
    # iPhone SE / 8 (750x1334) - older devices
    ('iphone-se', 750, 1334),
    # iPad Pro 12.9 (2048x2732)
    ('ipad-pro', 2048, 2732),
    # iPad Air / standard (1640x2360)
    ('ipad', 1640, 2360),
]

def compose_splash(w: int, h: int) -> Image.Image:
    """Compose a portrait-oriented splash with team photo, DUXTOMER name, and WC26 callout."""
    canvas = Image.new('RGB', (w, h), BG_DEEP)
    draw = ImageDraw.Draw(canvas)

    # Subtle background vignette/glow
    glow = Image.new('RGBA', (w, h), (0,0,0,0))
    gdraw = ImageDraw.Draw(glow)
    cx, cy = w // 2, int(h * 0.4)
    max_r = max(w, h)
    for r in range(max_r, 0, -50):
        alpha = max(0, int(20 * (1 - r / max_r)))
        gdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(201, 165, 87, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(w // 10))
    canvas.paste(glow, (0, 0), glow)

    # Position team photo in center 60% vertically
    # The team photo is 1500x983, aspect ~1.5
    team_max_w = int(w * 0.92)
    src_w, src_h = team_src.size
    scale = team_max_w / src_w
    team_w = team_max_w
    team_h = int(src_h * scale)
    team_resized = team_src.resize((team_w, team_h), Image.LANCZOS)

    team_y = int(h * 0.32)
    team_x = (w - team_w) // 2
    canvas.paste(team_resized, (team_x, team_y))

    # WORLD CUP 26 callout (eyebrow, gold)
    eyebrow_fs = max(20, int(w * 0.034))
    try:
        eyebrow_font = ImageFont.truetype(FONT_POPPINS_BOLD, eyebrow_fs)
    except IOError:
        eyebrow_font = ImageFont.load_default()
    eyebrow_text = "— WORLD CUP 26 —"
    eb = draw.textbbox((0, 0), eyebrow_text, font=eyebrow_font)
    eb_w = eb[2] - eb[0]
    eb_y = int(h * 0.16)
    draw.text(((w - eb_w) // 2 - eb[0], eb_y), eyebrow_text, fill=GOLD, font=eyebrow_font)

    # DUXTOMER — sized to fit comfortably with horizontal padding
    target_text_width = int(w * 0.78)
    name_text = "DUXTOMER"
    # Iteratively find the right font size
    name_fs = int(w * 0.18)
    while name_fs > 30:
        try:
            name_font = ImageFont.truetype(FONT_CONDENSED_BOLD_OBLIQUE, name_fs)
        except IOError:
            name_font = ImageFont.load_default()
        nb = draw.textbbox((0, 0), name_text, font=name_font)
        nw = nb[2] - nb[0]
        if nw <= target_text_width:
            break
        name_fs -= 2
    nb = draw.textbbox((0, 0), name_text, font=name_font)
    name_w = nb[2] - nb[0]
    name_x = (w - name_w) // 2 - nb[0]
    name_y = int(h * 0.195)
    draw.text((name_x, name_y), name_text, fill=WHITE, font=name_font)

    # Tagline below team photo
    tagline_fs = max(18, int(w * 0.026))
    try:
        tag_font = ImageFont.truetype(FONT_POPPINS_BOLD, tagline_fs)
    except IOError:
        tag_font = ImageFont.load_default()
    tag_y = team_y + team_h + int(h * 0.04)
    tag1 = "TWO IRISH  ·  TWO ENGLISH"
    tb = draw.textbbox((0, 0), tag1, font=tag_font)
    tw = tb[2] - tb[0]
    draw.text(((w - tw) // 2 - tb[0], tag_y), tag1, fill=MUTED, font=tag_font)

    tag2 = "ONE TROPHY"
    tb2 = draw.textbbox((0, 0), tag2, font=tag_font)
    tw2 = tb2[2] - tb2[0]
    draw.text(((w - tw2) // 2 - tb2[0], tag_y + int(h * 0.035)), tag2, fill=GOLD, font=tag_font)

    # Top host-nation stripe
    stripe_h = max(4, h // 200)
    for i, color in enumerate([(31, 58, 138), (220, 38, 38), (4, 120, 87)]):
        x0 = i * w // 3
        x1 = (i + 1) * w // 3
        draw.rectangle([x0, 0, x1, stripe_h], fill=color)

    return canvas

print('\nGenerating iOS startup images...')
for name, w, h in IOS_SPLASH_SIZES:
    splash = compose_splash(w, h)
    out_path = f'{OUT_SPLASH}/{name}-{w}x{h}.png'
    splash.save(out_path, 'PNG', optimize=True)
    print(f'  {name}-{w}x{h}.png: {os.path.getsize(out_path)/1024:.1f}KB')

# Generate a single canonical splash for the in-app splash screen (1080x1920 - standard 9:16)
splash_inapp = compose_splash(1080, 1920)
splash_inapp.save('/home/claude/wc26-app/public/splash-poster.jpg', 'JPEG', quality=90, optimize=True)
print(f'\nIn-app splash poster: {os.path.getsize("/home/claude/wc26-app/public/splash-poster.jpg")/1024:.1f}KB')

print('\nDone.')
