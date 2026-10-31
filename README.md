# Nu & Húi · 1 năm 💗

Web tĩnh (HTML/CSS/JS thuần, không cần build) — mở trên điện thoại.

## Thêm ảnh & nhạc
Ảnh cột mốc nằm ở `assets/photos/` (tên file ghi trong `js/content.js`, vd `9-11-1.jpg`, `27-11-2.jpg`).
Ảnh dồn dập bỏ vào `assets/photos/slide-pictures/`, tên gì cũng được.
Nhạc nền: `assets/music.mp3`.

Mỗi lần thêm ảnh, chạy:
```
python tools/prepare_photos.py
```
- Xoay ảnh đúng chiều, thu nhỏ, đổi sang JPG (đọc được cả HEIC của iPhone). Ảnh gốc cất ở `assets/originals/` (không push lên GitHub).
- Ảnh dồn dập được **xếp theo ngày chụp** (EXIF → ngày trong tên file), đánh số `01.jpg, 02.jpg…`,
  số lượng tự cập nhật vào `js/content.js`. Ảnh không rõ ngày được rải đều xen giữa,
  **ảnh mới nhất luôn ở cuối** (ảnh dừng hình rồi bay vào bì thư). Thứ tự xem ở `tools/slide-order.txt`.
- Muốn tự đặt ngày cho ảnh nào: ghi vào `tools/slide-dates.txt`, mỗi dòng `tên-file-gốc = 2025-12-24`, rồi chạy lại.

Cần: `pip install pillow pillow-heif`.

Sticker động: `assets/stickers/*.webp`. Muốn dùng meme riêng thì bỏ ảnh/gif vào đó rồi ghi `sticker: "ten-file.gif"` trong `js/content.js`
(cú pháp keyword `**chữ|emoji**`, chữ lượn `~~chữ~~` và hiệu ứng `fx` có ghi chú ngay đầu file).

## Xem thử
```
python -m http.server 5577
```
Mở http://localhost:5577. Nhảy thẳng tới 1 đoạn: `?from=intro | milestones | confession | montage | letter | yay | gift`.

## Deploy GitHub Pages
Push cả thư mục lên repo → Settings → Pages → Branch `main` / root. `index.html` ở gốc.

## Báo về điện thoại khi Nu ở màn quà (ntfy)
Web gửi thông báo đẩy tức thì (~1 giây) về điện thoại Húi qua [ntfy.sh](https://ntfy.sh) — miễn phí, không cần tài khoản:
- 🎁 Nu vừa tới màn nhận quà
- 💌 **Nu vừa bấm "Nhận mã"** (ưu tiên cao nhất, kêu to) — kèm mã `monquabimat` để gửi liền
- 🎉 Nu đã nhập đúng mã, mở quà

Cài đặt:
1. Cài app **ntfy** (App Store / Google Play) → bấm **+** → nhập topic ghi ở `ntfyTopic` cuối file `js/content.js` → bật thông báo.
2. Thử: mở web với `?from=gift` → thông báo có chữ **[Thử]**.

Ai biết tên topic cũng xem được tin, nên tên được đặt ngẫu nhiên khó đoán. Muốn đổi thì sửa `ntfyTopic` rồi theo dõi tên mới trong app.

## Ghi công
Sticker động lấy từ [Noto Emoji Animation](https://googlefonts.github.io/noto-emoji-animation/) của Google, giấy phép CC BY 4.0.
