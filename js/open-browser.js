// Mở link trong Messenger / Facebook / Instagram / Zalo... thì web chạy trong "trình duyệt nhúng" của app, hay lỗi hiển thị.
// File này chạy đầu tiên: tìm cách bật sang trình duyệt thật của máy.
//  - Android: tự chuyển sang Chrome (intent://). Máy không có Chrome thì ở lại và hiện hướng dẫn.
//  - iPhone: thử nhờ Safari mở (x-safari-https://, iOS 17+). Không được thì hiện hướng dẫn bấm "•••" → "Mở bằng trình duyệt".
// Thêm ?here vào link để bỏ qua (xem thẳng trong app).
(function () {
  const ua = navigator.userAgent || "";
  const inApp = /FBAN|FBAV|FB_IAB|FBIOS|Messenger|MessengerForiOS|Instagram|Zalo|Line\/|TikTok|musical_ly|BytedanceWebview/i.test(ua);
  const params = new URLSearchParams(location.search);
  if (!inApp || params.has("here")) return;

  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const url = location.href;

  if (isAndroid && !params.has("iab")) {
    // fallback quay lại đúng trang nhưng có ?iab để không chuyển vòng vòng mãi
    const back = new URL(url);
    back.searchParams.set("iab", "1");
    location.href =
      "intent://" + url.replace(/^https?:\/\//, "") +
      "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(back.href) + ";end";
  } else if (isIOS && !sessionStorageGet("triedSafari")) {
    sessionStorageSet("triedSafari", "1");
    location.href = "x-safari-" + url;
  }

  // nếu vẫn còn ở đây sau một nhịp (máy không cho tự mở) → hiện hướng dẫn
  setTimeout(showGuide, isAndroid ? 1500 : 900);

  function showGuide() {
    if (document.getElementById("iab-guide")) return;
    const box = document.createElement("div");
    box.id = "iab-guide";
    box.innerHTML =
      '<div class="iab-arrow">↗</div>' +
      '<div class="iab-card">' +
      '<div class="iab-heart">💌</div>' +
      '<div class="iab-title">Nu ơi, mở bằng trình duyệt nha</div>' +
      '<div class="iab-text">Bấm vào <b>•••</b> ở góc trên bên phải, rồi chọn<br><b>' +
      (isIOS ? "Mở trong Safari" : "Mở bằng trình duyệt") +
      "</b> để xem đẹp nhất nhé 💗</div>" +
      '<button class="iab-copy" type="button">Hoặc chép link để dán vào ' + (isIOS ? "Safari" : "Chrome") + "</button>" +
      '<button class="iab-stay" type="button">Thôi, xem luôn ở đây</button>' +
      "</div>";
    const mount = () => document.body.appendChild(box);
    document.body ? mount() : document.addEventListener("DOMContentLoaded", mount);

    const copyBtn = box.querySelector(".iab-copy");
    copyBtn.addEventListener("click", () => {
      const clean = new URL(url);
      clean.searchParams.delete("iab");
      const done = () => (copyBtn.textContent = "Đã chép link ✓ Dán vào trình duyệt nha");
      if (navigator.clipboard) navigator.clipboard.writeText(clean.href).then(done, () => prompt("Chép link này nha:", clean.href));
      else prompt("Chép link này nha:", clean.href);
    });
    box.querySelector(".iab-stay").addEventListener("click", () => box.remove());
  }

  // sessionStorage có thể bị chặn trong trình duyệt nhúng → bọc try/catch
  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
})();
