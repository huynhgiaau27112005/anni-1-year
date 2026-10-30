"""Tạo ảnh xem trước khi gửi link (assets/og-cover.jpg, 1200x630): polaroid ảnh cuối + chữ "Nu & Húi".

Chạy: python tools/make_og.py
"""
import math, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
from pathlib import Path
root = str(Path(__file__).resolve().parent.parent)
W, H = 1200, 630
# nền: gradient kem → hồng
bg = Image.new("RGB", (W, H))
top, bot = (255, 246, 236), (249, 200, 212)
for y in range(H):
    t = y / (H - 1)
    ImageDraw.Draw(bg).line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bot)))
# đốm sáng mềm
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
g = ImageDraw.Draw(glow)
for cx, cy, r, col in [(980, 120, 260, (255, 170, 150, 90)), (180, 560, 300, (255, 140, 180, 80)), (760, 520, 220, (255, 220, 150, 70))]:
    g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
glow = glow.filter(ImageFilter.GaussianBlur(90))
bg = Image.alpha_composite(bg.convert("RGBA"), glow)

def heart(d, cx, cy, s, fill):
    pts = []
    for i in range(60):
        t = i / 60 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * s / 32, cy + y * s / 32))
    d.polygon(pts, fill=fill)

# tim rải nhẹ
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
random.seed(7)
for _ in range(26):
    x, y = random.randint(560, 1180), random.randint(10, 620)
    heart(d, x, y, random.randint(10, 26), (255, 111, 156, random.randint(50, 120)))
bg = Image.alpha_composite(bg, layer)

# polaroid ảnh 45, nghiêng nhẹ
photo = ImageOps.fit(Image.open(f"{root}/assets/photos/slide-pictures/45.jpg").convert("RGB"), (380, 380), Image.LANCZOS)
pol = Image.new("RGBA", (420, 480), (255, 253, 249, 255))
pol.paste(photo, (20, 20))
pd = ImageDraw.Draw(pol)
heart(pd, 210, 448, 30, (224, 87, 127, 255))
pol = pol.rotate(-5, resample=Image.BICUBIC, expand=True)
# bóng đổ trên khung rộng hơn ảnh 80px mỗi bên, để vệt mờ không bị cắt thành cạnh vuông
PAD = 80
shadow = Image.new("RGBA", (pol.size[0] + 2 * PAD, pol.size[1] + 2 * PAD), (90, 30, 50, 0))
shadow.paste((90, 30, 50, 255), (PAD, PAD), mask=pol.split()[3].point(lambda a: a * 0.3))
shadow = shadow.filter(ImageFilter.GaussianBlur(26))
px, py = 70, (H - pol.size[1]) // 2
bg.alpha_composite(shadow, (px + 6 - PAD, py + 16 - PAD))
bg.alpha_composite(pol, (px, py))

# chữ
F = "C:/Windows/Fonts/"
d = ImageDraw.Draw(bg)
script = ImageFont.truetype(F + "segoescb.ttf", 92)
script2 = ImageFont.truetype(F + "palabi.ttf", 44)  # Palatino nghiêng: đủ dấu tiếng Việt
ui = ImageFont.truetype(F + "segoeuib.ttf", 30)
cx = 830
def center(text, font, y, fill, **kw):
    w = d.textlength(text, font=font)
    d.text((cx - w / 2, y), text, font=font, fill=fill, **kw)
center("Nu & Húi", script, 150, (224, 87, 127), stroke_width=1, stroke_fill=(224, 87, 127))
center("một năm bên nhau", script2, 290, (138, 40, 70))
# vạch + ngày
d.line([(cx - 150, 375), (cx - 40, 375)], fill=(224, 87, 127, 160), width=2)
d.line([(cx + 40, 375), (cx + 150, 375)], fill=(224, 87, 127, 160), width=2)
heart(d, cx, 376, 26, (224, 87, 127, 255))
center("02 · 11 · 2025", ui, 405, (91, 52, 64))
bg.convert("RGB").save(f"{root}/assets/og-cover.jpg", "JPEG", quality=88, optimize=True, progressive=True)
print("ok")
