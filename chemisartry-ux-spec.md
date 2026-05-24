# ChemisARtry — Tài liệu thiết kế UX/UI (Rebuild Frontend)

> Phiên bản: 2026-05-23
> Đối tượng: Học sinh THPT (cấp 3) học Hoá học
> Mục tiêu: Thiết kế lại toàn bộ luồng giao diện từ landing → học tập → thực hành AR

---

## Mục lục

1. [Tổng quan triết lý thiết kế](#1-tổng-quan-triết-lý-thiết-kế)
2. [Sơ đồ luồng tổng thể](#2-sơ-đồ-luồng-tổng-thể)
3. [Landing Page](#3-landing-page)
4. [Đăng nhập / Đăng ký](#4-đăng-nhập--đăng-ký)
5. [Trang chính (Dashboard)](#5-trang-chính-dashboard)
6. [Lộ trình học tập (Learning Path)](#6-lộ-trình-học-tập-learning-path)
7. [Trang bài học chi tiết](#7-trang-bài-học-chi-tiết)
8. [AR Lab & Phòng thí nghiệm](#8-ar-lab--phòng-thí-nghiệm)
9. [Các tính năng phụ trợ (Utilities)](#9-các-tính-năng-phụ-trợ-utilities)
10. [Navigation & Layout hệ thống](#10-navigation--layout-hệ-thống)
11. [Mapping route cũ → mới](#11-mapping-route-cũ--mới)
12. [Component priority cho rebuild](#12-component-priority-cho-rebuild)

---

## 1. Tổng quan triết lý thiết kế

### Vấn đề của thiết kế cũ

- **Không có thứ bậc:** 7 route ngang hàng nhau, học sinh không biết bắt đầu từ đâu
- **AR Lab là default:** Tính năng phức tạp nhất lại là điểm vào chính — sai thứ tự học
- **Dữ liệu rời rạc:** Element, Molecule, Reaction ở 3 trang riêng biệt, không có cầu nối khái niệm
- **Không có vòng lặp học:** Xem 3D xong là thoát, không có bước kiểm tra hay động lực tiếp tục

### Triết lý mới: **Hiểu → Xem → Thực hành → Khám phá**

```
HIỂU (lộ trình bài học có cấu trúc)
  ↓
XEM (mô hình 3D, cấu trúc phân tử, phản ứng)
  ↓
THỰC HÀNH (mô phỏng kéo thả, sau đó AR)
  ↓
KHÁM PHÁ (PubChem, tìm kiếm tự do, bảng tuần hoàn)
```

AR Lab là **phần thưởng và công cụ thực hành**, không phải điểm vào.

---

## 2. Sơ đồ luồng tổng thể

```
[Landing Page]
      |
      ├── Chưa đăng nhập → [Trang Auth] → đăng nhập/đăng ký
      |                                          |
      └── Đã đăng nhập ────────────────────────→ [Dashboard / Trang chính]
                                                        |
                    ┌───────────────────────────────────┤
                    |                                   |
             [Lộ trình học]                    [Tiện ích / Tools]
                    |                                   |
         ┌──────────┴──────────┐            ┌───────────┼───────────┐
         |                     |            |           |           |
    [Road 1]             [Road 2]      [Bảng TH]  [Explorer]  [Tiến độ]
    Nguyên tố &          Phản ứng          |           |
    Liên kết HH          Hoá học           |           |
         |                     |           └───────────┘
    [Bài học 1..N]       [Bài học 1..N]   (mở từ sidebar / menu Tools)
         |
    [Bài học chi tiết]
         |
    ┌────┴────┐
    |         |
 [Lý thuyết] [Thực hành]
              |
    ┌─────────┴─────────┐
    |                   |
[Sim 3D]           [AR Lab]
(không camera)    (camera + tay)
```

---

## 3. Landing Page

**Route:** `/`
**File mới:** `src/routes/index.tsx`
**Trạng thái:** Static hoàn toàn, không auth check

### Mục tiêu

Trả lời 3 câu hỏi trong 5 giây:

1. Đây là gì?
2. Tôi được gì từ đây?
3. Tôi bắt đầu thế nào?

### Cấu trúc trang

#### Section 1 — Hero (above the fold)

```
┌─────────────────────────────────────────────────────┐
│  [Logo + tên app]                    [Đăng nhập]    │
│                                                     │
│   Học Hoá học bằng cách                             │
│   chạm vào phân tử thật                             │
│                                                     │
│   Mô hình 3D · Phản ứng AR · Lộ trình cấp 3        │
│                                                     │
│   [Bắt đầu học miễn phí]   [Xem demo 30 giây]      │
│                                                     │
│          [Ảnh/video: AR Lab đang hoạt động]         │
└─────────────────────────────────────────────────────┘
```

**Nội dung cụ thể:**

- Headline: `"Học Hoá học bằng cách chạm vào phân tử"`
- Subline: `"Lộ trình bài học theo chương trình THPT · Mô hình 3D tương tác · Thí nghiệm AR bằng tay không"`
- CTA chính: `"Bắt đầu học — miễn phí"` → `/auth?mode=signup`
- CTA phụ: `"Xem thử không cần đăng ký"` → `/lab/sim?guest=true`

#### Section 2 — Social proof / Vấn đề

```
┌─────────────────────────────────────────────────────┐
│   "Học công thức mà không hiểu hình dạng phân tử   │
│    như học bản đồ mà không được nhìn thấy đường"   │
│                                                     │
│  [icon] Sách giáo khoa   →  [icon] ChemisARtry      │
│  Công thức 2D phẳng          Mô hình 3D quay được  │
│  Học thuộc lòng              Hiểu qua trải nghiệm  │
│  Phản ứng trừu tượng         Thí nghiệm bằng tay   │
└─────────────────────────────────────────────────────┘
```

#### Section 3 — Lộ trình học (preview)

```
┌─────────────────────────────────────────────────────┐
│              Học theo lộ trình rõ ràng              │
│                                                     │
│  Road 1: Nguyên tố & Liên kết           ✓ 12 bài  │
│  ├── Bài 1: Cấu tạo nguyên tử                      │
│  ├── Bài 2: Bảng tuần hoàn                         │
│  └── Bài 3: Liên kết hoá học ...                   │
│                                                     │
│  Road 2: Phản ứng Hoá học               ✓ 10 bài  │
│  └── ...                                            │
│                                                     │
│         [Xem toàn bộ lộ trình →]                   │
└─────────────────────────────────────────────────────┘
```

#### Section 4 — Tính năng (3 highlight, không phải 6)

Chỉ giữ 3 tính năng quan trọng nhất với học sinh cấp 3:

| Icon | Tiêu đề                   | Mô tả                                             |
| ---- | ------------------------- | ------------------------------------------------- |
| 🧪   | Thí nghiệm AR bằng tay    | Dùng tay điều khiển phân tử trong không gian thật |
| 📚   | Bài học theo chương trình | Gắn với SGK Hoá 10, 11, 12                        |
| 🏆   | Thành tích & tiến độ      | Theo dõi quá trình học, mở khoá thí nghiệm mới    |

#### Section 5 — CTA cuối

```
┌─────────────────────────────────────────────────────┐
│         Sẵn sàng học Hoá theo cách mới?            │
│                                                     │
│           [Tạo tài khoản miễn phí]                 │
│                                                     │
│   Không cần cài đặt · Chạy trên trình duyệt        │
└─────────────────────────────────────────────────────┘
```

#### Footer

- Links: Lộ trình học · AR Lab · Bảng tuần hoàn · Giới thiệu
- Copyright Anthropic / ChemisARtry

---

## 4. Đăng nhập / Đăng ký

**Route:** `/auth`
**File:** `src/routes/auth.tsx` (giữ nguyên logic, thay UI)

### Thay đổi so với hiện tại

**Hiện tại:** Form đơn giản ở giữa màn hình, không có context.

**Mới:** Màn hình split 2 cột:

```
┌──────────────────┬──────────────────────────────────┐
│                  │                                  │
│  [Preview mini   │    Đăng nhập / Đăng ký           │
│   AR Lab đang    │                                  │
│   chạy — loop   │    [Google] Tiếp tục với Google   │
│   video/gif]     │    ─────────── hoặc ───────────  │
│                  │    Email _____________________   │
│  "Hàng nghìn    │    Mật khẩu ___________________  │
│   học sinh đã   │                                  │
│   học cùng      │    [Đăng nhập]                   │
│   ChemisARtry"  │                                  │
│                  │    Chưa có tài khoản? Đăng ký   │
│                  │    Tiếp tục không đăng nhập →   │
└──────────────────┴──────────────────────────────────┘
```

**Sau đăng nhập thành công:**

- Lần đầu tiên (signup) → `/onboarding` (xem mục 4.1)
- Đã có tài khoản (signin) → `/dashboard`

### 4.1 Onboarding (mới — 3 bước)

**Route:** `/onboarding`

Chỉ hiện 1 lần sau khi đăng ký. 3 màn hình swipe:

```
Bước 1/3: Chào mừng
  "Chào [tên]! Bạn đang học lớp mấy?"
  [Lớp 10] [Lớp 11] [Lớp 12] [Tự học]

Bước 2/3: Bạn muốn học gì trước?
  [Nguyên tử & Nguyên tố]
  [Liên kết Hoá học]
  [Phản ứng Hoá học]
  [Tự chọn — cho tôi xem hết]

Bước 3/3: Demo nhanh 30 giây
  [Animation giải thích cách dùng AR Lab]
  [Bắt đầu học →]
```

**State lưu:** class (10/11/12/other), startingRoad (1/2/free) → lưu vào `user_progress` hoặc localStorage.

---

## 5. Trang chính (Dashboard)

**Route:** `/dashboard` (đổi từ `/` sau login)
**File mới:** `src/routes/dashboard.tsx`

### Layout

```
┌─────────────────────────────────────────────────────┐
│ [Logo]   Học   Thực hành   Tools         [Avatar]  │  ← Top nav
├─────────────────────────────────────────────────────┤
│                                                     │
│  Chào buổi sáng, Minh! 👋                          │  ← Greeting
│                                                     │
├──────────────────────┬──────────────────────────────┤
│                      │                             │
│  TIẾP TỤC HỌC        │   THỐNG KÊ NHANH            │
│  ┌────────────────┐  │   Đã học: 5 bài             │
│  │ Road 1 · Bài 4 │  │   Phản ứng: 12              │
│  │ Liên kết CHT   │  │   Streak: 3 ngày 🔥         │
│  │ [Tiếp tục →]   │  │                             │
│  └────────────────┘  │   THÀNH TÍCH GẦN ĐÂY        │
│                      │   🏆 First Spark             │
│  CHƯA BẮT ĐẦU        │   🏆 Reaction!              │
│  Road 2: Phản ứng    │                             │
│  [Bắt đầu →]        │                             │
│                      │                             │
├──────────────────────┴──────────────────────────────┤
│                                                     │
│  TRUY CẬP NHANH                                    │
│  [🔬 AR Lab]  [📊 Bảng TH]  [🔍 Tìm kiếm]         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### State cần fetch

```typescript
// dashboard cần
user: User
userProgress: UserProgress          // từ Supabase user_progress
currentLesson: Lesson | null        // bài đang học dở
roadProgress: { road1: number, road2: number }  // % hoàn thành
recentAchievements: Achievement[]
```

### Logic "Tiếp tục học"

- Nếu có `currentLesson` → hiện card "Tiếp tục"
- Nếu chưa bắt đầu road nào → hiện card "Bắt đầu Road 1"
- Nếu đã xong Road 1 → gợi ý Road 2

---

## 6. Lộ trình học tập (Learning Path)

**Route:** `/learn`
**File mới:** `src/routes/learn.tsx`

Đây là thay đổi lớn nhất. Thay vì navigation dàn trải, toàn bộ nội dung học được tổ chức thành **2 Road có cấu trúc rõ ràng.**

### 6.1 Trang tổng quan lộ trình

```
┌─────────────────────────────────────────────────────┐
│              Lộ trình học của bạn                   │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  🧪 ROAD 1: Nguyên tố & Liên kết Hoá học    │  │
│  │  Nền tảng · 12 bài học · ~4 tuần            │  │
│  │                                              │  │
│  │  [●●●●●○○○○○○○]  5/12 hoàn thành            │  │
│  │                                              │  │
│  │  [Tiếp tục bài 6 →]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  ⚗️ ROAD 2: Phản ứng Hoá học                │  │
│  │  Nâng cao · 10 bài học · ~3 tuần            │  │
│  │                                              │  │
│  │  [○○○○○○○○○○]  Khoá — Hoàn thành Road 1    │  │
│  │              trước để mở khoá               │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Note về "khoá":** Road 2 nên khoá mềm (soft lock) — hiện nhưng greyed out, có thể bấm "Bỏ qua và học" nếu muốn. Không hard lock.

### 6.2 Trang Road chi tiết

**Route:** `/learn/road/1` hoặc `/learn/road/2`

```
┌─────────────────────────────────────────────────────┐
│  ← Lộ trình    Road 1: Nguyên tố & Liên kết HH     │
│                                                     │
│  CHƯƠNG 1: CẤU TẠO NGUYÊN TỬ                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ ✅ Bài 1  Nguyên tử là gì?           [Xem]  │  │
│  │ ✅ Bài 2  Proton, Neutron, Electron   [Xem]  │  │
│  │ ▶  Bài 3  Cấu hình electron         [Học]   │  ← hiện tại
│  │ 🔒 Bài 4  Mô hình Bohr              [Khoá]  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  CHƯƠNG 2: BẢNG TUẦN HOÀN                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔒 Bài 5  Nhóm và Chu kỳ            [Khoá]  │  │
│  │ 🔒 Bài 6  Tính chất tuần hoàn       [Khoá]  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  CHƯƠNG 3: LIÊN KẾT HOÁ HỌC                        │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔒 Bài 7  Liên kết ion              [Khoá]  │  │
│  │ 🔒 Bài 8  Liên kết cộng hoá trị    [Khoá]  │  │
│  │ 🔒 Bài 9  Liên kết kim loại         [Khoá]  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  CHƯƠNG 4: PHÂN TỬ & HÌNH DẠNG                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔒 Bài 10 Hình học phân tử          [Khoá]  │  │
│  │ 🔒 Bài 11 Lực giữa các phân tử     [Khoá]  │  │
│  │ 🔒 Bài 12 Thực hành AR tổng hợp    [Khoá]  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 6.3 Danh sách bài học đề xuất

#### Road 1: Nguyên tố & Liên kết Hoá học (12 bài)

| #   | Tên bài                        | Nội dung chính                        | Hoạt động thực hành                |
| --- | ------------------------------ | ------------------------------------- | ---------------------------------- |
| 1   | Nguyên tử là gì?               | Cấu tạo cơ bản, hạt nhân, vỏ electron | Xem mô hình 3D nguyên tử H, He     |
| 2   | Proton, Neutron, Electron      | Điện tích, khối lượng, vị trí         | So sánh 3 nguyên tử bằng AR        |
| 3   | Cấu hình electron              | Quy tắc điền electron theo lớp        | Build cấu hình của Na, Cl bằng tay |
| 4   | Mô hình Bohr                   | Các mức năng lượng, bức xạ            | Xem AR nguyên tử phát sáng         |
| 5   | Bảng tuần hoàn — Nhóm & Chu kỳ | Cách đọc bảng tuần hoàn               | Khám phá bảng TH 3D tương tác      |
| 6   | Tính chất tuần hoàn            | Bán kính, IE, độ âm điện              | So sánh nguyên tố cùng nhóm        |
| 7   | Liên kết ion                   | NaCl — cho và nhận electron           | Tạo phân tử NaCl trong AR          |
| 8   | Liên kết cộng hoá trị          | H₂O, CO₂ — dùng chung electron        | Build H₂O, NH₃ trong Sim 3D        |
| 9   | Liên kết kim loại              | Mạng tinh thể kim loại                | Xem mô hình 3D mạng tinh thể       |
| 10  | Hình học phân tử (VSEPR)       | Dạng thẳng, tam giác, tứ diện         | So sánh góc liên kết bằng AR       |
| 11  | Lực giữa các phân tử           | Van der Waals, H-bond                 | Thí nghiệm nước sôi AR             |
| 12  | Thực hành AR tổng hợp          | Tổng hợp toàn Road 1                  | Free lab — tự do khám phá          |

#### Road 2: Phản ứng Hoá học (10 bài)

| #   | Tên bài               | Nội dung chính             | Hoạt động thực hành                    |
| --- | --------------------- | -------------------------- | -------------------------------------- |
| 1   | Phản ứng là gì?       | Phá vỡ và tạo liên kết mới | Quan sát H₂ + O₂ → H₂O trong AR        |
| 2   | Cân bằng phương trình | Bảo toàn nguyên tử         | Kéo thả hệ số cân bằng                 |
| 3   | Phản ứng đốt cháy     | Hydrocarbon + O₂           | Đốt CH₄, C₂H₅OH trong AR               |
| 4   | Phản ứng tổng hợp     | A + B → AB                 | Thực hành 5 phản ứng tổng hợp          |
| 5   | Phản ứng phân huỷ     | AB → A + B                 | Phân huỷ H₂O₂, CaCO₃                   |
| 6   | Acid & Base           | pH, trung hoà              | Pha dung dịch, quan sát màu            |
| 7   | Nhiệt hoá học (ΔH)    | Thu nhiệt vs toả nhiệt     | So sánh ΔH các phản ứng AR             |
| 8   | Tốc độ phản ứng       | Nhiệt độ, nồng độ, xúc tác | Slider điều chỉnh tốc độ               |
| 9   | Cân bằng hoá học      | Le Chatelier               | Thay đổi điều kiện và quan sát         |
| 10  | Thực hành AR tổng hợp | Tổng hợp toàn Road 2       | Grand experiment: 5 phản ứng liên tiếp |

---

## 7. Trang bài học chi tiết

**Route:** `/learn/road/:roadId/lesson/:lessonId`
**File mới:** `src/routes/lesson.tsx`

### Layout bài học

```
┌─────────────────────────────────────────────────────┐
│  ← Road 1      Bài 3: Cấu hình Electron     3/12   │
│  ─────────────────────────────────────────          │
│                                                     │
│  [Tab: Lý thuyết]  [Tab: Khám phá 3D]  [Tab: Thực hành]
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  (Nội dung tab đang active)                         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [← Bài trước]              [Bài tiếp theo →]      │
└─────────────────────────────────────────────────────┘
```

### Tab 1: Lý thuyết

```
┌─────────────────────────────────────────────────────┐
│  Cấu hình electron                                  │
│                                                     │
│  Electron không xếp ngẫu nhiên. Chúng xếp theo     │
│  từng LỚP, mỗi lớp chứa tối đa một số electron     │
│  nhất định.                                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  [Hình minh hoạ: Sơ đồ lớp K, L, M]        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Quy tắc điền:                                      │
│  • Lớp K (n=1): tối đa 2 electron                  │
│  • Lớp L (n=2): tối đa 8 electron                  │
│  • Lớp M (n=3): tối đa 18 electron                 │
│                                                     │
│  Ví dụ: Natri (Na, Z=11)                           │
│  → 2, 8, 1 (ký hiệu: 1s²2s²2p⁶3s¹)               │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  [Quiz nhanh 3 câu — inline, không rời trang│   │
│  │   1. Na có bao nhiêu lớp electron? (3)      │   │
│  │   2. Lớp ngoài cùng của Na có mấy e? (1)   │   │
│  │   3. Cl (Z=17) có cấu hình? (2,8,7)        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Tab 2: Khám phá 3D

```
┌─────────────────────────────────────────────────────┐
│  [Dropdown chọn nguyên tố: Na / Cl / Fe / ...]     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │     [AtomViewer3D — Mô hình Bohr           │   │
│  │      đang quay, có nhãn lớp electron]      │   │
│  │                                             │   │
│  │     Kéo để xoay · Cuộn để zoom             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Thông số: Proton: 11 · Neutron: 12 · Electron: 11│
│  Cấu hình: 2, 8, 1                                 │
│                                                     │
│  [Mở trong AR fullscreen ↗]                        │
└─────────────────────────────────────────────────────┘
```

### Tab 3: Thực hành

```
┌─────────────────────────────────────────────────────┐
│  Chọn cách thực hành:                              │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  🖥️ Mô phỏng 3D  │  │  📷 AR Lab (camera)  │   │
│  │  Kéo thả chuột   │  │  Dùng tay điều khiển │   │
│  │  Không cần cam   │  │  Cần cho phép camera │   │
│  │  [Bắt đầu →]    │  │  [Bắt đầu →]         │   │
│  └──────────────────┘  └──────────────────────┘   │
│                                                     │
│  Nhiệm vụ bài này:                                  │
│  ✓ Build cấu hình electron của Na (2,8,1)          │
│  ✓ Build cấu hình electron của Cl (2,8,7)          │
│  ✓ Kết hợp Na + Cl → NaCl                         │
│                                                     │
│  [0/3 nhiệm vụ hoàn thành]                         │
└─────────────────────────────────────────────────────┘
```

---

## 8. AR Lab & Phòng thí nghiệm

### 8.1 Hai chế độ tách biệt

**Route sim:** `/lab/sim`
**Route AR:** `/lab/ar`
**File:** Tách `lab.tsx` thành `lab-sim.tsx` + `lab-ar.tsx`, share component `ARScene`

#### Chế độ Mô phỏng 3D (`/lab/sim`)

Không cần camera. Dành cho:

- Lớp học không có thiết bị tốt
- Lần đầu học chưa muốn cấp quyền camera
- Tablet/điện thoại

```
┌──────────────────────────────────────────────────────┐
│  [← Bài học]    Phòng thí nghiệm 3D   [Chế độ AR ↗]│
├───────────────────┬──────────────────────────────────┤
│  CHỌN PHÂN TỬ    │                                  │
│  ┌────────────┐  │                                  │
│  │ H₂O  [+]  │  │     [Three.js 3D scene]           │
│  │ NaCl  [+] │  │     Kéo chuột để xoay            │
│  │ CH₄   [+] │  │     Scroll để zoom               │
│  └────────────┘  │     Click phân tử để chọn        │
│                  │                                  │
│  ĐÃ SPAWN        │                                  │
│  H₂O  [x]       │                                  │
│  NaCl [x]       │                                  │
│                  │                                  │
│  [Reset]         │                                  │
│  [Education ⚙️]  │                                  │
├───────────────────┴──────────────────────────────────┤
│  Phản ứng: HCl + NaOH → NaCl + H₂O  ΔH = -57 kJ  │
└──────────────────────────────────────────────────────┘
```

#### Chế độ AR Lab (`/lab/ar`)

```
┌──────────────────────────────────────────────────────┐
│  [← Sim mode]   AR Lab   [Education: ON]   [Reset]  │
├───────────────────┬──────────────────────────────────┤
│  CHỌN PHÂN TỬ    │                                  │
│  [H₂O] [NaCl]   │   [Camera feed fullscreen]        │
│  [CH₄] [HCl]    │   + Three.js overlay              │
│                  │                                  │
│  [Spawn ▶]       │   Hướng dẫn (lần đầu):           │
│  [Space]         │   👋 Giơ tay lên để bắt đầu      │
│                  │   🤏 Chụm ngón để cầm phân tử     │
│  CÂU LỆNH GIỌNG │   ↔️ Hai tay để scale             │
│  NÓI:           │                                  │
│  🎙 [Đang nghe] │                                  │
│                  │                                  │
│  PHÍM TẮT:       │                                  │
│  Space: Spawn    │                                  │
│  R: Reset        │                                  │
│  E: Education    │                                  │
│  A: AR on/off    │                                  │
└───────────────────┴──────────────────────────────────┘
```

### 8.2 Màn hình phản ứng xảy ra

Khi 2 phân tử va chạm và phản ứng thành công:

```
┌─────────────────────────────────────────────────────┐
│              ✨ PHẢN ỨNG XẢY RA! ✨                │
│                                                     │
│         2 HCl  +  Ca(OH)₂  →  CaCl₂ + 2 H₂O      │
│                                                     │
│         ΔH = -130 kJ/mol       Toả nhiệt 🔥        │
│                                                     │
│   Phân tử sinh ra đã được spawn vào màn hình        │
│                                                     │
│              [Tiếp tục]                             │
└─────────────────────────────────────────────────────┘
```

---

## 9. Các tính năng phụ trợ (Utilities)

Các chức năng này không nằm trong navigation chính. Chúng truy cập qua **menu Tools** hoặc link từ bên trong bài học.

### 9.1 Vị trí truy cập

```
Top navigation:
  [Logo]  [Học]  [Thực hành]  [Tools ▼]  [Tiến độ]  [Avatar]
                                   |
                              ┌────┴────────────────┐
                              │ 📊 Bảng tuần hoàn  │
                              │ 🔍 Compound Explorer│
                              │ 📋 Thư viện phân tử │
                              │ ⚗️  Danh sách phản ứng│
                              └────────────────────┘
```

### 9.2 Bảng tuần hoàn

**Route:** `/tools/periodic-table`
**Truy cập từ:** Tools menu · Link trong bài học Bảng TH · Dashboard quick access

**Thay đổi so với hiện tại:**

- Giữ nguyên chức năng
- Thêm "Bài học liên quan" ở sidebar phải khi click nguyên tố
- Nút "Dùng trong Lab" → mở `/lab/sim` với nguyên tố đó đã được chọn

### 9.3 Compound Explorer (PubChem Search)

**Route:** `/tools/explorer`
**Truy cập từ:** Tools menu · Link trong tab Khám phá 3D của bài học

**Giữ nguyên:** Chức năng tìm kiếm, layout 2 cột, preview 3D
**Thêm:** Nút "Thêm vào Lab" → spawn phân tử vào session lab hiện tại

### 9.4 Thư viện phân tử

**Route:** `/tools/molecules`
**Truy cập từ:** Tools menu · Sidebar Lab

**Giữ nguyên:** Grid phân tử, filter category, search, dialog 3D preview
**Thêm:** Context "Xuất hiện trong bài học X, Y" để học sinh biết ngữ cảnh

### 9.5 Danh sách phản ứng

**Route:** `/tools/reactions`
**Truy cập từ:** Tools menu · Sau khi phản ứng xảy ra trong Lab (link "Xem chi tiết")

**Giữ nguyên:** List cards, dialog chi tiết, PubChem enrichment
**Thêm:** Tag "Thuộc bài học X" · Nút "Thử trong Lab"

### 9.6 Tiến độ & Thành tích

**Route:** `/progress`
**Truy cập từ:** Top nav · Dashboard

```
┌─────────────────────────────────────────────────────┐
│                    Tiến độ của bạn                  │
│                                                     │
│  TỔNG QUAN                                         │
│  Đã học: 5 bài / 22 bài      Streak: 3 ngày 🔥     │
│  Phân tử: 48 lần spawn       Phản ứng: 12          │
│                                                     │
│  ROAD 1: Nguyên tố & Liên kết   [●●●●●○○○○○○○] 42%│
│  ROAD 2: Phản ứng Hoá học       [────────────] 0%  │
│                                                     │
│  THÀNH TÍCH                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │🔥 First│ │⚗️ Alche│ │💥 React│ │🔒 ???  │       │
│  │ Spark  │ │  mist  │ │ ion!   │ │        │       │
│  │ Đạt   │ │ Đạt    │ │ Đạt    │ │Khoá    │       │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                     │
│  LỊCH SỬ HOẠT ĐỘNG (7 ngày gần nhất)              │
│  [Mini calendar heatmap]                           │
└─────────────────────────────────────────────────────┘
```

---

## 10. Navigation & Layout hệ thống

### Top Navigation (sau đăng nhập)

```
┌──────────────────────────────────────────────────────────┐
│ ⚗️ ChemisARtry  │  Học  │  Thực hành  │  Tools ▼  │  👤 │
└──────────────────────────────────────────────────────────┘
```

| Mục       | Route      | Mô tả                                   |
| --------- | ---------- | --------------------------------------- |
| Học       | `/learn`   | Lộ trình học + các road                 |
| Thực hành | `/lab/sim` | Sim 3D (default), link sang AR          |
| Tools     | dropdown   | Bảng TH, Explorer, Molecules, Reactions |
| Avatar    | dropdown   | Tiến độ, Cài đặt, Đăng xuất             |

### Top Navigation (chưa đăng nhập / landing)

```
┌──────────────────────────────────────────────────────────┐
│ ⚗️ ChemisARtry  │  Tính năng  │  Lộ trình  │  [Đăng nhập] [Thử miễn phí] │
└──────────────────────────────────────────────────────────┘
```

### Breadcrumb (bên trong bài học)

```
Dashboard › Học › Road 1 › Bài 3: Cấu hình electron
```

### Mobile

- Top nav rút gọn thành hamburger menu
- AR Lab trên mobile: ưu tiên Sim 3D mode, AR mode hiện cảnh báo về hiệu năng
- Bảng tuần hoàn: scroll ngang, font nhỏ hơn

---

## 11. Mapping route cũ → mới

| Route cũ          | Route mới                    | Ghi chú                           |
| ----------------- | ---------------------------- | --------------------------------- |
| `/` (landing)     | `/` (landing)                | Viết lại nội dung, giữ route      |
| `/auth`           | `/auth`                      | Viết lại UI, giữ logic            |
| —                 | `/onboarding`                | **Mới** — chỉ lần đầu             |
| —                 | `/dashboard`                 | **Mới** — trang chính sau login   |
| —                 | `/learn`                     | **Mới** — tổng quan lộ trình      |
| —                 | `/learn/road/:id`            | **Mới** — danh sách bài theo road |
| —                 | `/learn/road/:id/lesson/:id` | **Mới** — bài học chi tiết        |
| `/lab`            | `/lab/sim` + `/lab/ar`       | **Tách đôi**                      |
| `/periodic-table` | `/tools/periodic-table`      | Chuyển sang Tools                 |
| `/molecules`      | `/tools/molecules`           | Chuyển sang Tools                 |
| `/reactions`      | `/tools/reactions`           | Chuyển sang Tools                 |
| `/search`         | `/tools/explorer`            | Chuyển sang Tools                 |
| `/progress`       | `/progress`                  | Giữ route, thêm road progress     |

---

## 12. Component priority cho rebuild

Sắp xếp theo thứ tự nên làm:

### Phase 1 — Shell & Auth (tuần 1)

1. `SiteHeader.tsx` — nav mới 3 mục + Tools dropdown
2. `src/routes/index.tsx` — Landing page mới
3. `src/routes/auth.tsx` — UI mới, giữ logic Supabase
4. `src/routes/onboarding.tsx` — **Mới**, 3 bước
5. `src/routes/dashboard.tsx` — **Mới**

### Phase 2 — Learning Path (tuần 2)

6. `src/routes/learn.tsx` — tổng quan lộ trình
7. `src/routes/learn/road.tsx` — danh sách bài theo road
8. `src/routes/learn/lesson.tsx` — bài học 3 tab
9. Data: tạo `src/lib/lessons-data.ts` — hardcode 22 bài học

### Phase 3 — Lab (tuần 3)

10. `src/routes/lab-sim.tsx` — Simulation mode
11. `src/routes/lab-ar.tsx` — AR mode
12. `ARScene.tsx` — giữ nguyên core, thêm mission tracking
13. Tách `buildMoleculeGroup` ra `src/lib/three-helpers.ts` (dùng chung sim + AR)

### Phase 4 — Tools & Progress (tuần 4)

14. Routes tools: `/tools/periodic-table`, `/tools/molecules`, `/tools/reactions`, `/tools/explorer`
15. `src/routes/progress.tsx` — thêm road progress + calendar heatmap
16. Achievements: thêm Road completion achievements

---

## Phụ lục: Dữ liệu mới cần tạo

### `src/lib/lessons-data.ts`

```typescript
export interface Lesson {
  id: string;
  roadId: 1 | 2;
  order: number;
  title: string;
  chapter: string;
  theory: LessonTheory; // markdown content
  explore3D: LessonExplore; // which elements/molecules to show
  practice: LessonPractice; // missions, which lab mode
  quiz: QuizQuestion[]; // 3–5 câu hỏi inline
}

export interface LessonPractice {
  missions: Mission[];
  recommendedMode: "sim" | "ar" | "both";
  defaultMolecules: string[]; // formula list pre-loaded vào lab
}

export interface Mission {
  id: string;
  description: string; // "Build cấu hình electron của Na"
  completionCheck: string; // logic kiểm tra (formula-based)
}
```

### Supabase: Bảng mới `user_lesson_progress`

| Cột           | Kiểu        | Ghi chú                               |
| ------------- | ----------- | ------------------------------------- |
| id            | UUID        | PK                                    |
| user_id       | UUID        | FK → auth.users                       |
| lesson_id     | TEXT        | VD: "road1-lesson3"                   |
| status        | TEXT        | not_started / in_progress / completed |
| missions_done | TEXT[]      | Mảng mission id đã hoàn thành         |
| quiz_score    | INT         | 0–5                                   |
| completed_at  | TIMESTAMPTZ |                                       |

---

_Tài liệu này là spec thiết kế — không bao gồm code implementation chi tiết cho từng component. Xem `FUNCTIONAL_DOCS.md` để biết API calls, hook signatures, và data flow hiện tại._
