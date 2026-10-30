"""Tối ưu ảnh cho web: xoay đúng chiều, thu nhỏ còn 1600px, lưu JPG (đọc được cả HEIC của iPhone).

Chạy lại mỗi khi thêm ảnh mới:
    python tools/prepare_photos.py

- Ảnh cột mốc (assets/photos/*.jpg...): ảnh gốc chuyển sang assets/originals/, ảnh tối ưu nằm lại chỗ cũ.
- Ảnh dồn dập (thư mục ghi trong js/content.js → montage.dir, hiện là assets/photos/slide-pictures/):
  ảnh gốc cất ở assets/originals/<thư mục>/, mỗi lần chạy dựng lại 01.jpg, 02.jpg... xếp theo NGÀY CHỤP
  (EXIF → ngày trong tên file → ngày sửa file). Ảnh không rõ ngày được rải đều xen giữa,
  ảnh có ngày mới nhất luôn là ảnh cuối (ảnh dừng hình rồi bay vào bì thư). Số lượng tự cập nhật vào js/content.js.
- Muốn tự đặt ngày cho ảnh nào: ghi vào tools/slide-dates.txt, mỗi dòng: tên-file-gốc = 2026-02-14
Cần: pip install pillow pillow-heif
"""
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:
    pillow_heif = None

sys.path.insert(0, str(Path(__file__).resolve().parent))
from photo_dates import VN, photo_date  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "assets" / "photos"
ORIG = ROOT / "assets" / "originals"
CONTENT = ROOT / "js" / "content.js"
DATES_FILE = ROOT / "tools" / "slide-dates.txt"
ORDER_FILE = ROOT / "tools" / "slide-order.txt"
EXTS = {".jpg", ".jpeg", ".jfif", ".png", ".heic", ".heif", ".webp"}
MAX_SIDE = 1600
MAX_SIDE_SLIDE = 1000  # ảnh dồn dập hiện nhỏ trên màn hình, không cần to
NUMBERED = re.compile(r"^\d{2,3}\.jpg$")


def optimize(src: Path, dst: Path, max_side: int = MAX_SIDE) -> None:
    im = ImageOps.exif_transpose(Image.open(src))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    im = im.convert("RGB")
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)


def process_dir(folder: Path) -> None:
    """Ảnh cột mốc: tối ưu các ảnh mới trong folder (không đệ quy), ảnh gốc cất vào assets/originals/."""
    rel = folder.relative_to(PHOTOS)
    orig_dir = ORIG / rel
    for f in sorted(folder.iterdir()):
        if not f.is_file() or f.suffix.lower() not in EXTS:
            continue
        backup = orig_dir / f.name
        # đã xử lý từ trước (ảnh gốc có thể mang đuôi khác: .PNG, .jpeg, .HEIC…)
        if orig_dir.is_dir() and any(o.stem == f.stem for o in orig_dir.iterdir() if o.is_file()):
            continue
        orig_dir.mkdir(parents=True, exist_ok=True)
        shutil.move(str(f), backup)
        out = folder / (f.stem + ".jpg")
        try:
            optimize(backup, out)
        except Exception as e:  # ảnh lỗi: trả ảnh gốc về chỗ cũ
            shutil.move(str(backup), f)
            print(f"  ✗ {rel / f.name}: {e}")
            continue
        kb_in, kb_out = backup.stat().st_size // 1024, out.stat().st_size // 1024
        print(f"  ✓ {rel / f.name} → {out.name}  ({kb_in} KB → {kb_out} KB)")


def read_overrides() -> dict:
    out = {}
    if DATES_FILE.exists():
        for line in DATES_FILE.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                name, d = (x.strip() for x in line.split("=", 1))
                try:
                    out[name] = datetime.fromisoformat(d).replace(tzinfo=VN)
                except ValueError:
                    print(f"  ! tools/slide-dates.txt: không hiểu ngày '{d}' của {name}")
    return out


def order_by_date(files: list[Path]) -> list[tuple[Path, datetime | None, str]]:
    overrides = read_overrides()
    dated, undated = [], []
    for f in files:
        if f.name in overrides:
            dated.append((f, overrides[f.name], "tự đặt"))
            continue
        dt, src = photo_date(f)
        (undated if src == "ngày sửa file" else dated).append((f, dt if src != "ngày sửa file" else None, src))
    dated.sort(key=lambda r: r[1])
    undated.sort(key=lambda r: r[0].name.lower())
    if not dated:
        return undated
    # ảnh mới nhất giữ ở cuối; ảnh không rõ ngày rải đều xen giữa các ảnh còn lại
    last, seq = dated[-1], dated[:-1]
    for j, u in enumerate(undated):
        pos = round((j + 1) * (len(dated) - 1) / (len(undated) + 1)) + j
        seq.insert(pos, u)
    return seq + [last]


def build_montage(folder: Path) -> int:
    orig_dir = ORIG / folder.relative_to(PHOTOS)
    orig_dir.mkdir(parents=True, exist_ok=True)
    # ảnh mới bỏ vào → cất ảnh gốc
    for f in sorted(folder.iterdir()):
        if f.is_file() and f.suffix.lower() in EXTS and not NUMBERED.match(f.name):
            shutil.move(str(f), orig_dir / f.name)
    originals = [f for f in sorted(orig_dir.iterdir()) if f.is_file() and f.suffix.lower() in EXTS]
    if not originals:
        return 0
    ordered = order_by_date(originals)
    for old in folder.glob("*.jpg"):
        if NUMBERED.match(old.name):
            old.unlink()
    width = 3 if len(ordered) > 99 else 2
    lines = []
    for i, (f, dt, src) in enumerate(ordered, 1):
        name = f"{i:0{width}d}.jpg"
        try:
            optimize(f, folder / name, MAX_SIDE_SLIDE)
        except Exception as e:
            print(f"  ✗ {f.name}: {e}")
            continue
        when = f"{dt:%Y-%m-%d %H:%M}" if dt else "không rõ ngày   "
        lines.append(f"{name}  {when}  [{src}]  ← {f.name}")
    ORDER_FILE.write_text("Thứ tự ảnh dồn dập (tạo bởi tools/prepare_photos.py)\n\n" + "\n".join(lines) + "\n", encoding="utf-8")
    for line in lines:
        print("  " + line)
    return len(ordered)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định không in được tiếng Việt
    if pillow_heif is None:
        print("(chưa có pillow-heif → ảnh .HEIC sẽ bị bỏ qua; cài: pip install pillow-heif)")
    print("Ảnh cột mốc:")
    process_dir(PHOTOS)

    text = CONTENT.read_text(encoding="utf-8")
    m = re.search(r'montage:\s*\{\s*dir:\s*"([^"]+)"', text)
    sub = m.group(1).strip("/") if m else "slide-pictures"
    folder = PHOTOS / sub
    folder.mkdir(exist_ok=True)
    print(f"Ảnh dồn dập ({folder.relative_to(ROOT)}):")
    n = build_montage(folder)
    if n:
        text = re.sub(r'(montage:\s*\{\s*dir:\s*"[^"]+",\s*count:\s*)\d+', rf"\g<1>{n}", text)
        CONTENT.write_text(text, encoding="utf-8")
        print(f"  → {n} ảnh, đã cập nhật js/content.js. Thứ tự xem lại ở tools/slide-order.txt")
    else:
        print("  (chưa có ảnh nào)")


if __name__ == "__main__":
    main()
