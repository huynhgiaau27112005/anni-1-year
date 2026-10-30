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

## Email báo khi Nu tới màn quà
Nu vừa vào màn "món quà bí mật" → web gửi email tới Húi qua [Web3Forms](https://web3forms.com) (kèm mã `monquabimat`)
→ Húi tự nhắn mã cho Nu bằng Zalo/Messenger. Nút "Nhận mã" chỉ hiện "Húi đang gửi mã cho Nu nè".
Chạy thẳng trên GitHub Pages, không cần server.

1. Vào [web3forms.com](https://web3forms.com) → nhập email muốn nhận thông báo → Access Key gửi về email đó.
2. Dán key vào `web3formsKey` cuối file `js/content.js`, push lên GitHub là xong.
   (Key này là key công khai, để trong code được: nó chỉ gửi được tới email của bạn.)
3. Thử: mở web với `?from=gift` → email tới có tiêu đề **[Thử]** 🎁 Nu đã tới màn nhận quà!

Lần nào vào màn quà cũng gửi email (kể cả tải lại trang). Xem thử bằng `?from=gift` thì tiêu đề có chữ **[Thử]**.
Gợi ý: bật thông báo Gmail trên điện thoại để nhận ngay; lần đầu nhớ xem cả thư mục Spam.

## Ghi công
Sticker động lấy từ [Noto Emoji Animation](https://googlefonts.github.io/noto-emoji-animation/) của Google, giấy phép CC BY 4.0.
