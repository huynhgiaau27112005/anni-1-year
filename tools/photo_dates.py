"""Đoán ngày chụp của 1 ảnh, theo thứ tự đáng tin: EXIF → ngày trong tên file → ngày sửa file.

Dùng chung cho prepare_photos.py. Chạy riêng để xem trước:
    python tools/photo_dates.py assets/photos/slide-pictures
"""
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from PIL import Image

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:
    pass

VN = timezone(timedelta(hours=7))
# ngày hợp lệ: từ lúc quen nhau tới nay (tránh nhầm các dãy số ngẫu nhiên trong tên file)
MIN, MAX = datetime(2024, 1, 1, tzinfo=VN), datetime(2027, 12, 31, tzinfo=VN)


def _ok(dt):
    return dt if dt and MIN <= dt <= MAX else None


def exif_date(path: Path):
    try:
        ex = Image.open(path).getexif()
        raw = ex.get_ifd(0x8769).get(36867) or ex.get(36867) or ex.get(306)  # DateTimeOriginal / DateTime
        if raw:
            return _ok(datetime.strptime(str(raw).strip()[:19], "%Y:%m:%d %H:%M:%S").replace(tzinfo=VN))
    except Exception:
        pass
    return None


def name_date(name: str):
    # 20260305_154701, IMG_20260731_213721, Screenshot_20260308_065536...
    m = re.search(r"(20\d{2})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})", name)
    if m:
        try:
            return _ok(datetime(*map(int, m.groups()), tzinfo=VN))
        except ValueError:
            pass
    # mốc thời gian dạng số (mili giây hoặc giây): Locket_1775393347939, image-1784367528899...
    for digits in re.findall(r"\d{10,13}", name):
        ts = int(digits) / (1000 if len(digits) == 13 else 1)
        try:
            dt = _ok(datetime.fromtimestamp(ts, VN))
        except (OverflowError, OSError, ValueError):
            dt = None
        if dt:
            return dt
    return None


def photo_date(path: Path):
    """Trả về (datetime, nguồn) với nguồn là 'exif' | 'tên file' | 'ngày sửa file'."""
    for fn, src in ((exif_date, "exif"), (lambda p: name_date(p.name), "tên file")):
        dt = fn(path)
        if dt:
            return dt, src
    return datetime.fromtimestamp(path.stat().st_mtime, VN), "ngày sửa file"


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    folder = Path(sys.argv[1])
    rows = sorted((photo_date(f) + (f.name,) for f in folder.iterdir() if f.is_file()), key=lambda r: r[0])
    for i, (dt, src, name) in enumerate(rows, 1):
        print(f"{i:02d}  {dt:%Y-%m-%d %H:%M}  [{src:^13}]  {name}")
