/*
 * TOÀN BỘ NỘI DUNG CỦA WEB NẰM Ở ĐÂY — sửa chữ, đổi tên ảnh thoải mái.
 * Ảnh: assets/photos/ (thiếu ảnh thì web tự hiện khung giữ chỗ). Nhạc: assets/music.mp3
 *
 * CÚ PHÁP CHỮ:
 *   **chữ**          → keyword: nảy lên, phát sáng, rồi bay lơ lửng mờ trên nền
 *   **chữ|💪**       → keyword + bắn emoji 💪 bay lên từ chữ
 *   ~~chữ~~          → chữ lượn sóng nhún nhảy (cho mấy chữ nhây: huhu, heheheh…)
 *
 * HIỆU ỨNG (fx) — gắn vào ảnh, cột mốc, dòng chữ:
 *   { rain: "🐱", n: 8 }                  → mưa emoji (tối đa 2 loại emoji, n tối đa 18)
 *   { sticker: "sob", bubble: "huhu" }        → sticker động bật lên ở chỗ trống (không che chữ/ảnh; hết chỗ trống thì bỏ qua)
 *   { fireworks: 4 }                          → pháo hoa tim
 *   { ..., at: 1500 }                         → chờ 1.5s rồi mới chạy
 *   Muốn dùng meme riêng: bỏ ảnh/gif vào assets/stickers/ rồi ghi sticker: "ten-file.gif"
 *
 * Sticker có sẵn: sob tears flushed love hearteyes catheart cat scream cool shy party broken angry
 *   smile hatch tongue pleading kiss gift heart popper cake fireworks camera house fox muscle hug cry_cat
 */
window.CONTENT = {
  // màn mở đầu: Nu chạm vào là nhạc nền nổi lên rồi mới tới màn mật khẩu
  startText: "Nu ơi, chạm vào đây nha",
  password: "02/11/2025",
  passwordTitle: "Mật khẩu là ngày kỉ niệm 2 đứa mình",
  passwordWrong: [
    "Hong phải ròi nè 😭",
    "Sai nữa ròi, nghĩ kĩ coi Nu",
    "Gợi ý: tháng 11 năm ngoái á :>",
  ],

  // các cụm chữ mờ trôi lơ lửng phía sau nền (chọn ngẫu nhiên)
  floatingWords: [
    "anh và em",
    "Húi và Nu",
    "anniversary",
    "một năm",
    "một đời",
  ],

  photoDir: "assets/photos/",
  stickerDir: "assets/stickers/",
  music: "assets/music.mp3",

  intro: {
    date: "02/11/2025",
    greeting: "Đúng ròiii, đêm nay anh đã rụt rè **ngỏ lời** với em nè :>",
    greetingFx: [
      { sticker: "party", bubble: "1 năm ròi nè!!", at: 400 },
      { rain: "💖", n: 8, at: 400 },
    ],
    photos: [
      {
        src: "2-11-1.jpg",
        caption: ["Anh đã dẫn em đi **waterbus|⛴️**"],
        fx: [{ rain: "⛴️", n: 8 }],
      },
      {
        src: "2-11-2.jpg",
        caption: [
          "Lần đầu anh biết **đón em**, **gạt chân chống|🛵** cho em, **dẫn bộ em qua đường** và ngồi tâm sự với em **thật lâu|💬** như vậy",
        ],
        fx: [{ sticker: "love", at: 2500 }],
      },
    ],
    question:
      "Vậy mà ~~thoắt cái~~ **1 năm** qua ròiii\nĐể anh dẫn em cùng dạo lại những **cột mốc đáng nhớ|🗺️** của tụi mình nhaaa",
    yes: "Đi liền",
    no: "Ai thèmmmmm",
    noDodge: [
      "hong cho bấm đâu",
      "hehe trượt ròi",
      "bấm Đi liền đi màaa",
      "né nè",
    ],
  },

  milestones: [
    {
      date: "9/11",
      title: 'Em có buổi **"hẹn hò"|💘** đầu tiên từ sau ngày tỏ bày',
      photos: [
        {
          src: "9-11-1.jpg",
          caption: [
            "Anh bên ngoài rất **cứng cáp|😎**, nhưng bên trong **hồi hộp rất nhiều|💓**",
            "Nhưng rồi, vừa bước vào thang máy, em **chủ động bám tay anh|🤝**. Lúc đó anh không còn lo lắng gì nữa",
          ],
          fx: [
            { sticker: "flushed", bubble: "hồi hộp quá trời", at: 600 },
            { rain: "💓", n: 8, at: 600 },
          ],
        },
        {
          src: "9-11-2.jpg",
          caption: [
            "Cũng là lần đầu anh chụp **ptb|📸** với emmm :>> hành trình học pose ptb là từ đây",
          ],
          fx: [{ sticker: "camera", at: 1200 }],
        },
      ],
    },
    {
      date: "27/11",
      title: "Em tổ chức **sinh nhật|🎂** cho anhhh",
      fx: [
        { rain: "🎂", n: 8 },
        { sticker: "party", bubble: "happy birthday!" },
      ],
      photos: [
        {
          src: "27-11-1.jpg",
          caption: [
            "Anh **siuuu xúc động|🥹** luôn vì lần đầu anh nhận **quà đầu tư** như vậy",
          ],
          fx: [{ sticker: "tears", bubble: "cảm động xỉu", at: 1200 }],
        },
        {
          src: "27-11-2.jpg",
          caption: [
            "Cải trang **nick & judy|🦊** nè, coi xong film ~~lụy quá huhu~~",
          ],
          fx: [
            { rain: "🦊", n: 8 },
            { sticker: "sob", bubble: "huhu lụy", at: 1500 },
          ],
        },
        {
          src: "27-11-3.jpg",
          caption: [
            "Tấm ảnh vẽ này đến hiện tại vẫn là **món quà anh thích nhấttt|🎨**",
          ],
          fx: [
            { sticker: "hearteyes", at: 1200 },
            { rain: "🎨", n: 8, at: 1200 },
          ],
        },
      ],
    },
    {
      date: "31/12",
      title: "Đón **giao thừa|🎆** cùng Nu nàa",
      fx: [
        { fireworks: 3 },
        { rain: "✨", n: 8 },
        { sticker: "fireworks", bubble: "Happy New Year!", at: 800 },
      ],
      photos: [
        {
          src: "31-12-1.jpg",
          caption: ["Cũng là lần đầu mình đi **Blissssss|✨**"],
        },
      ],
    },
    {
      date: "10/2",
      title: "Về **Tếttt|🧧**, cũng là **sinh nhật mẹ anh|🎂** lunnn",
      fx: [{ rain: "🧧", n: 8 }],
      photos: [
        {
          src: "10-2-1.jpg",
          caption: [
            "Lần đầu mẹ được gặp Nu và cũng là lần đầu Nu **sờ Úuuu|🐱**",
          ],
          fx: [
            { rain: "🐱", n: 8, at: 1500 },
            { sticker: "cat", bubble: "meo~", at: 1600 },
          ],
        },
      ],
      fact: 'Fact: hồi đó kể mẹ "con có bạn gái ròi" mẹ ~~giật mình~~ lắm heheheh',
      factFx: [{ sticker: "scream", bubble: "hảaaa???" }],
    },
    {
      date: "16/2",
      title: "**Sờ Ú|🐱** típ ~~heheheh~~",
      fx: [
        { rain: "🐱", n: 8 },
        { sticker: "catheart", bubble: "Ú nè!!", at: 500 },
      ],
      photos: [{ src: "16-2-1.jpg", caption: [] }],
    },
    {
      date: "20/2",
      title: "Lần đầu Húi đi chơi với **nhà Nu|🏡**",
      photos: [
        {
          src: "20-2-1.jpg",
          caption: [
            "Húi lúc đó ~~rụt rè~~ lắm, nhưng trong tgian ngắn ngủi z anh thấy **cực kì thương nhà Nu|💞** lunnnn. Vì cả nhà **tình cảm** lắm",
          ],
          fx: [
            { sticker: "shy", bubble: "rụt rè xíu", at: 500 },
            { rain: "💞", n: 8, at: 3000 },
            { sticker: "hug", at: 3200 },
          ],
        },
      ],
    },
    {
      date: "26/2",
      title: "Húi lần đầu chụp **ptb|📸** ở QNgaiiii",
      photos: [
        {
          src: "26-2-1.jpg",
          caption: ["Đang mặc **áo Nu tặng|👕** hùi Valentines:>"],
          fx: [
            { rain: "📸", n: 8 },
            { sticker: "cool", bubble: "pose chuẩn chưa", at: 900 },
          ],
        },
      ],
    },
    {
      date: "28/2",
      title: "Húi **dắt Nu vìa Sài Gònnn|✈️**",
      // bản đồ chuyến bay: ảnh 1 hiện ở điểm đi, máy bay bay tới điểm đến thì hiện ảnh 2
      route: { from: "Quảng Ngãi", to: "Sài Gòn", vehicle: "✈️" },
      photos: [
        {
          src: "28-2-1.jpg",
          caption: ["Đang làm **trò con mèo|😹** trên máy bay nèee"],
        },
        { src: "28-2-2.jpg", caption: ["Đưa em **về thoiii|🏠**"] },
      ],
      arriveFx: [
        { sticker: "party", bubble: "tới nơi ròi!" },
        { rain: "💖", n: 8 },
      ],
    },
  ],

  confessionTitle: "Có thể em hong biết...",
  confession: [
    {
      text: "Giai đoạn từ tháng 11 - hết tháng 2 là giai đoạn Húi **chuyển biến tâm lí nhiều nhất**... có cả **vui|😊** và **buồn|😢** nữa",
      fx: [
        { sticker: "smile", at: 2600 },
        { sticker: "sob", bubble: "huhu", at: 3600 },
      ],
    },
    {
      text: "Vì lúc này anh cùng em mới **chập chững|🐣** học cách yêu thương nhau, cũng có **ra mắt nhau với gia đình** và hiểu nhiều về **hậu phương|🏡**",
      fx: [{ sticker: "hatch", at: 900 }],
    },
    {
      text: "Nhiều **hiểu lầm|💥** nổ ra và sau cùng em vẫn **chọn ở lại cùng anh|🫶**. Từ đó anh **thương em nhiều lắm á!!|❤️**",
      fx: [
        { sticker: "broken", bubble: "...", at: 500 },
        { sticker: "pleading", at: 2200 },
        { rain: "❤️", n: 8, at: 3600 },
        { sticker: "love", bubble: "thương em nhiều lắm", at: 3800 },
      ],
    },
  ],

  andThen: "Và rồi...",
  // Ảnh dồn dập: assets/photos/slide-pictures/01.jpg ... (xếp theo ngày chụp, ảnh cuối là ảnh dừng hình)
  // Đừng sửa tay: chạy `python tools/prepare_photos.py` để tự đánh số và cập nhật count
  montage: { dir: "slide-pictures/", count: 45, ext: "jpg" },
  montageText: "Hôm nay anh cùng em đánh dấu **một năm**",

  letter: {
    greeting: "Gửi em 💖",
    // mỗi phần tử là 1 dòng y như content/main-script.md, "" là dòng trống giữa 2 đoạn
    lines: [
      "Cảm ơn em đã cho anh biết thế nào là **được yêu**.",
      "",
      "Một năm qua có thể là một năm ý nghĩa nhất với anh cả hiện tại và sau này nữa. Vì năm vừa rồi chính bản thân anh trải qua một sự thay đổi lớn.",
      "",
      "Anh có em, anh ngạo nghễ với cả thế giới, anh không còn rụt rè nữa.",
      "Anh không một mình nữa, anh luôn có em bên cạnh.",
      "Anh đã có một động lực để luôn đứng vững dù gục ngã rất đau.",
      "Biết yêu thương, biết nhẫn nại, biết cách mở lòng hơn",
      "Và đặc biệt, biết những khuyết điểm của mình để cùng em **trưởng thành** hơn",
      "",
      "**Một năm rồi.**",
      "",
      "Thời gian đã thể hiện anh và em đã lớn lên cùng nhau tốt như thế nào.",
      "Anh rất vui vì được cùng em viết lên câu chuyện của chúng mình.",
      "",
      "Rồi sẽ một năm nữa.",
      "Hai năm nữa.",
      "Và **cả đời về sau**.",
      "",
      "Em sẽ **đồng hành cùng anh** nhé! 💗",
    ],
    sign: "Húi",
    yes: "Oke anh luôn",
    no: "Hong thèm",
  },

  yay: "Yayyyyyyyy",

  gift: {
    text: "Cuối cùng, để chúc Nu iu có một **bủi tối ngọt ngào**, Húi có mụt **món quà bí mật|🎁** cho Nuuu",
    textFx: [{ sticker: "gift", bubble: "đoán xem là gì", at: 300 }],
    placeholder: "Nhập mã quà vào đây",
    button: "Nhận mã",
    sentToast: "Húi đang gửi mã cho Nu nè, check tin nhắn nha 💌",
    code: "monquabimat",
    reveal: "Em nhìn vào **túi bên hông cặp** của em i :>",
    revealFx: [
      { rain: "🎁", n: 8 },
      { sticker: "kiss", at: 600 },
      { fireworks: 2, at: 300 },
    ],
    footer: "02.11.2025 — 02.11.2026 · Nu & Húi",
  },
};

/*
 * Email báo Húi: Nu vừa vào màn nhận quà → web gửi email cho Húi qua Web3Forms (kèm mã quà)
 * → Húi tự nhắn mã cho Nu. Chạy thẳng trên GitHub Pages, không cần server hay .env.
 *
 * web3formsKey: lấy ở https://web3forms.com (nhập email của Húi → key gửi về email đó).
 *   Key này là key công khai, để trong code được: nó chỉ gửi email tới đúng email của Húi.
 *   Để "" thì không gửi email.
 */
window.CONFIG = {
  web3formsKey: "d1938f0b-b93e-468e-ba5d-127eb0d334a0",
};
