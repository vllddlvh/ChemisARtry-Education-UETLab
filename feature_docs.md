# ChemisARtry — Tài liệu chức năng

> Phiên bản đọc source code: 2026-05-23  
> Mục đích: Làm tài liệu tham chiếu để tối ưu và xây dựng lại frontend.

---

## 1. Tổng quan kiến trúc

| Lớp           | Công nghệ                                       |
| ------------- | ----------------------------------------------- |
| Framework     | React 19 + TanStack Router (file-based routing) |
| Build tool    | Vite 7                                          |
| Styling       | TailwindCSS v4 + custom CSS (`styles.css`)      |
| Backend/DB    | Supabase (PostgreSQL + Auth)                    |
| 3D rendering  | Three.js                                        |
| Hand tracking | MediaPipe Tasks-Vision (`HandLandmarker`)       |
| External data | PubChem PUG-REST API (không cần key)            |
| UI components | Radix UI (Shadcn/ui style)                      |
| State         | React hooks (không có global store)             |

---

## 2. Cấu trúc thư mục

```
src/
├── routes/           # Các trang (file-based routing)
│   ├── __root.tsx    # Shell HTML, Toaster, 404
│   ├── index.tsx     # Trang chủ (Landing)
│   ├── auth.tsx      # Đăng nhập / Đăng ký
│   ├── lab.tsx       # AR Lab chính (tính năng cốt lõi)
│   ├── molecules.tsx # Thư viện phân tử + PubChem
│   ├── periodic-table.tsx # Bảng tuần hoàn 3D/AR
│   ├── reactions.tsx # Danh sách phản ứng
│   ├── search.tsx    # Compound Explorer (PubChem)
│   └── progress.tsx  # Tiến độ người dùng + Achievements
├── components/       # UI components
│   ├── ARScene.tsx          # Camera + Three.js overlay
│   ├── AtomARScene.tsx      # AR nguyên tử fullscreen
│   ├── AtomViewer3D.tsx     # Mô hình Bohr 3D tương tác
│   ├── ControlPanel.tsx     # Panel điều khiển AR Lab
│   ├── ElementDetail.tsx    # Sheet chi tiết nguyên tố
│   ├── MoleculePreview.tsx  # Preview 3D phân tử
│   ├── PeriodicTableGrid.tsx # Grid bảng tuần hoàn
│   ├── PubChemSearch.tsx    # Tìm kiếm PubChem nhúng
│   ├── SiteHeader.tsx       # Navigation bar
│   ├── SiteFooter.tsx       # Footer
│   └── WebcamPassthrough.tsx # Webcam cho AR
├── hooks/
│   ├── use-auth.ts              # Trạng thái đăng nhập
│   ├── use-chemistry-data.ts    # Load molecules + reactions
│   ├── use-element-compounds.ts # Hợp chất của nguyên tố
│   ├── use-mobile.tsx           # Responsive breakpoint
│   ├── use-pubchem-enrichment.ts # Làm giàu dữ liệu PubChem
│   ├── use-pubchem-search.ts    # Tìm kiếm PubChem debounced
│   └── use-voice-commands.ts    # Web Speech API
└── lib/
    ├── chemistry.ts             # Types + CPK colors
    ├── chemistry-api.ts         # Fetch + normalize dữ liệu
    ├── hand-tracker.ts          # MediaPipe wrapper
    ├── hand-tracking-controller.ts # Controller cho AR nguyên tử
    ├── periodic-table-data.ts   # Data bảng tuần hoàn
    ├── pubchem-api.ts           # PubChem REST adapter
    ├── reaction-engine.ts       # Rule-based reaction matching
    └── utils.ts                 # cn() utility
```

---

## 3. Database schema (Supabase)

### Bảng `molecules`

| Cột         | Kiểu          | Ghi chú                                         |
| ----------- | ------------- | ----------------------------------------------- |
| id          | UUID (PK)     | gen_random_uuid()                               |
| formula     | TEXT (UNIQUE) | VD: "H2O", "CH4"                                |
| name        | TEXT          | Tên tiếng Anh                                   |
| description | TEXT          | Mô tả ngắn                                      |
| category    | TEXT          | common / organic / ionic / element / acid / ... |
| atoms       | JSONB         | `[{el, x, y, z}]` tọa độ Ångström               |
| bonds       | JSONB         | `[{a, b, order}]` index 0-based, order 1/2/3    |
| created_at  | TIMESTAMPTZ   |                                                 |

> **Seed data:** ~60 phân tử gồm diatomic gases, oxides, acids, bases, salts, hydrocarbons, alcohols.

### Bảng `reactions`

| Cột         | Kiểu      | Ghi chú                      |
| ----------- | --------- | ---------------------------- |
| id          | UUID (PK) |                              |
| reactants   | TEXT[]    | VD: `['H2','O2']`            |
| products    | TEXT[]    | VD: `['H2O']`                |
| equation    | TEXT      | VD: `"2 H₂ + O₂ → 2 H₂O"`    |
| description | TEXT      |                              |
| energy_kj   | NUMERIC   | ΔH kJ/mol, null nếu không có |

> **Seed data:** ~25 phản ứng: đốt cháy, trung hoà acid-base, phân huỷ, tổng hợp, hydro hoá.

### Bảng `user_progress`

| Cột                 | Kiểu          | Ghi chú                       |
| ------------------- | ------------- | ----------------------------- |
| id                  | UUID (PK)     |                               |
| user_id             | UUID (UNIQUE) | FK → auth.users               |
| molecules_spawned   | INT           | Đếm số lần spawn              |
| reactions_triggered | INT           | Đếm số lần kích hoạt phản ứng |
| last_molecule       | TEXT          | Formula cuối cùng được spawn  |
| updated_at          | TIMESTAMPTZ   |                               |

**RLS Policy:** Molecules và reactions: đọc public. user_progress: chỉ user của chính mình.

---

## 4. Chi tiết từng trang (Routes)

### 4.1 `/` — Trang chủ (Landing Page)

**File:** `src/routes/index.tsx`

**Nội dung:**

- **Hero section:** Tiêu đề "Chemistry you can touch", mô tả ngắn, nút CTA → `/lab` và `/molecules`, ảnh hero
- **Features grid (6 card):**
  1. Hand-tracked AR (MediaPipe)
  2. Real reactions
  3. Ball-and-stick 3D
  4. Education mode (labels, bond counts)
  5. Voice commands
  6. 100M+ compounds (PubChem)
- **How it works (3 bước):** Allow camera → Pick molecule → Pinch & combine

**State:** Không có state động. Toàn bộ là static UI.

---

### 4.2 `/auth` — Đăng nhập / Đăng ký

**File:** `src/routes/auth.tsx`

**Chức năng:**

- Toggle giữa Sign In / Sign Up
- **Email + password** form: dùng `supabase.auth.signInWithPassword()` hoặc `supabase.auth.signUp()`
- **Google OAuth:** dùng `lovable.auth.signInWithOAuth("google")`
- Hiển thị toast thành công/thất bại
- Redirect về `/` sau khi login thành công
- Link "Continue without account" → `/`

**State:**

```typescript
mode: "signin" | "signup";
email: string;
password: string;
busy: boolean; // disabled khi đang gọi API
```

---

### 4.3 `/lab` — AR Lab (Tính năng cốt lõi)

**File:** `src/routes/lab.tsx`

**Chức năng:**

- Render `<ControlPanel>` (left sidebar) + `<ARScene>` (main view)
- **Spawn molecule:** Chọn từ library → nhấn Spawn / Space bar
- **Reset scene:** Nút Reset hoặc phím `R`
- **Education mode:** Toggle hiển thị atom labels + ΔH trong reactions, phím `E`
- **AR on/off:** Toggle camera + hand tracking, phím `A`
- **Voice commands:** Nút Mic (nếu browser hỗ trợ Web Speech API)
- **Progress tracking:** Ghi vào `user_progress` mỗi khi spawn/react

**State:**

```typescript
selected: Molecule | null; // phân tử đang chọn
toSpawn: Molecule | null; // tín hiệu spawn cho ARScene
resetSignal: number; // tăng để trigger reset
arOn: boolean;
education: boolean;
lastReaction: Reaction | null;
```

**Voice commands (regex matching):**
| Pattern | Action |
|---------|--------|
| `show/spawn/create/make <name>` | Tìm và spawn phân tử |
| `reset/clear/remove` | Reset scene |
| `start ar / camera on` | Bật AR |
| `stop ar / camera off` | Tắt AR |
| `education / labels` | Toggle education mode |

**Keyboard shortcuts:**
| Key | Action |
|-----|--------|
| Space | Spawn selected molecule |
| R | Reset scene |
| E | Toggle education mode |
| A | Toggle AR |

---

### 4.4 `/molecules` — Thư viện phân tử

**File:** `src/routes/molecules.tsx`

**Chức năng:**

- Hiển thị grid phân tử từ Supabase (`useChemistryData`)
- **Lọc theo category:** pill buttons (all, common, organic, ionic, element, + dynamic)
- **Tìm kiếm local:** lọc theo name/formula
- **PubChem auto-search:** khi query ≥ 2 ký tự, tự động search PubChem song song
- **Click phân tử local:** mở Dialog với `MoleculePreview` 3D + thống kê atoms/bonds
- **Click PubChem compound:** mở Dialog với 3D preview (nếu có), SMILES, MW, CID, description, link PubChem

**State:**

```typescript
q: string; // search query
cat: string; // active category
open: Molecule | null; // local molecule dialog
pubchemDetail: PubChemCompoundSummary | null;
pubchemDetailOpen: boolean;
```

---

### 4.5 `/periodic-table` — Bảng tuần hoàn 3D/AR

**File:** `src/routes/periodic-table.tsx`

**Chức năng:**

- Grid 18×7 bảng tuần hoàn (load từ GitHub JSON + localStorage cache)
- **Tìm kiếm:** theo name, symbol, atomic number
- **Lọc category:** alkali metal, noble gas, transition metal, v.v.
- **Click nguyên tố:** mở `<ElementDetail>` sheet bên phải
  - 3D Bohr model tương tác (drag to rotate, scroll to zoom)
  - 4 tabs: Overview, Config, Shells, PubChem
  - Nút "Open in AR" → fullscreen `<AtomARScene>`
- **AR mode nguyên tử:** webcam passthrough + 3D atom overlay, điều khiển bằng tay

**Data source:** `https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/...`  
Fallback: 31 nguyên tố phổ biến embedded.

---

### 4.6 `/reactions` — Danh sách phản ứng

**File:** `src/routes/reactions.tsx`

**Chức năng:**

- List tất cả phản ứng từ Supabase
- Mỗi card: equation, description, reactants, products, ΔH tag (warm=exo, cool=endo)
- **Click reaction:** Dialog chi tiết với PubChem enrichment (MW, CID, SMILES, description)
- Nút "Try in AR Lab →" dẫn đến `/lab`

---

### 4.7 `/search` — Compound Explorer (PubChem)

**File:** `src/routes/search.tsx`

**Chức năng:**

- Thanh tìm kiếm lớn (search by name, formula, SMILES)
- **Suggestions:** caffeine, aspirin, glucose, ethanol, dopamine, penicillin, cholesterol, ATP
- **Layout 2 cột:** danh sách kết quả (left) + detail panel sticky (right)
- Detail panel: 3D molecule preview, badges (formula, MW), properties grid (HBD, HBA, complexity, charge), SMILES, description, link PubChem
- Debounce 500ms trước khi search

---

### 4.8 `/progress` — Tiến độ người dùng

**File:** `src/routes/progress.tsx`

**Chức năng:**

- **Chưa đăng nhập:** CTA sign in
- **Đã đăng nhập:**
  - 3 stat cards: Molecules spawned, Reactions triggered, Last molecule
  - **Achievements grid (6 mốc):**
    | ID | Label | Điều kiện |
    |----|-------|-----------|
    | first-spark | First Spark | spawned ≥ 1 |
    | alchemist | Apprentice Alchemist | spawned ≥ 10 |
    | chemist | Bench Chemist | spawned ≥ 50 |
    | first-reaction | Reaction! | reactions ≥ 1 |
    | reactor | Reactor Core | reactions ≥ 10 |
    | nobel | Nobel Nominee | reactions ≥ 25 |

---

## 5. Components chi tiết

### 5.1 `ARScene.tsx` — Camera + Three.js overlay

**Props:**

```typescript
molecules: Molecule[]
reactions: Reaction[]
toSpawn: Molecule | null
onSpawned: () => void
resetSignal: number
educationMode: boolean
onReaction: (r: Reaction) => void
arOn: boolean
```

**Cách hoạt động:**

1. Khởi tạo Three.js WebGLRenderer với alpha (overlay camera)
2. Khi `arOn=true`: request webcam stream → load MediaPipe HandLandmarker
3. **Animation loop:** Mỗi frame: detect hand → updateMolecules → render
4. **Hand → World coords:** `x = (0.5 - palm.x) * 10` (mirror), `y = -(palm.y - 0.5) * 6`
5. **Grab (pinch > 0.55, distance < 2.5):** molecule lerp theo palm
6. **Rotate wrist:** `group.rotation.z = -hand.roll`
7. **Two-hand scale:** cả 2 tay pinch → scale theo khoảng cách
8. **Reaction check:** proximity < 1.8 world units → `findMatchingReaction()`
9. **Reaction trigger:** xoá 2 reactants, spawn particle burst (`spawnBurst`), spawn products

**Molecule 3D (buildMoleculeGroup):**

- Atoms: SphereGeometry, MeshPhysicalMaterial với CPK colors
- Bonds: CylinderGeometry, parallel cylinders cho double/triple bond
- Labels (education mode): Canvas sprites với element symbol

---

### 5.2 `AtomViewer3D.tsx` — Bohr model 3D

**Props:**

```typescript
shells: number[]     // electron config. VD: [2, 8, 1]
protons: number
neutrons: number
symbol: string
color?: string       // màu electron (CPK hex)
height?: number|string
autoRotate?: boolean
interactive?: boolean
transparent?: boolean
showShellLabels?: boolean
```

**Imperative handle (ref):**

```typescript
rotate(dx, dy); // rotate group
zoom(factor); // zoom camera
reset(); // reset to defaults
canvas(); // get canvas element
```

**Cách hoạt động:**

- Nucleus: cluster proton (đỏ) + neutron (xám), distributed trong sphere
- Nucleus glow halo (additive blending)
- Symbol label sprite
- Shells: TorusGeometry ring + electron spheres orbit với tốc độ khác nhau
- Interactive: pointerdown/move drag rotate, wheel zoom

---

### 5.3 `AtomARScene.tsx` — AR nguyên tử fullscreen

**Props:** `element: PTElement`, `onClose: () => void`

**Cách hoạt động:**

- Fullscreen fixed overlay (z-50)
- `<WebcamPassthrough>` làm background (dim 0.3)
- `<AtomViewer3D>` transparent overlay (z-10)
- `<HandTrackingController>`: hidden video element, 1-hand pinch+drag → rotate, 2-hand → zoom
- Virtual cursor overlay hiển thị vị trí tay
- HUD: element info (top-left), controls (top-right), hints (bottom-center)

**Keyboard:** Esc = close, R = reset, L = toggle shell labels

---

### 5.4 `ControlPanel.tsx` — Panel điều khiển AR Lab

**2 tabs:**

1. **Library tab:**
   - Grid phân tử (click to select)
   - Nút Spawn selected molecule
   - About card: name, formula, description + PubChem enrichment (MW, CID, SMILES)
   - Known reactions list (highlight lastReaction với pulse animation)
2. **PubChem tab:**
   - `<PubChemSearch>` compact mode với `onSpawn` callback để spawn PubChem molecule vào AR

**Controls:**

- Start AR / AR On toggle button
- Reset button
- Education mode switch

---

### 5.5 `MoleculePreview.tsx` — 3D preview nhúng

- Lightweight Three.js scene (không có hand tracking)
- Auto-rotate, drag to rotate
- Auto-fit camera theo bounding box

### 5.6 `ElementDetail.tsx` — Sheet chi tiết nguyên tố

- 4 tabs: Overview (thông số vật lý), Config (electron config), Shells (số electron mỗi lớp), PubChem
- PubChem tab: auto-search theo element.name → hiển thị MW, CID, SMILES, InChI + related compounds
- Nút "Open in AR" / "Interact in AR"

### 5.7 `SiteHeader.tsx` — Navigation

Nav links: Home, AR Lab, Periodic, Molecules, Reactions, Explorer, Progress  
Auth: hiển thị email + logout nếu đã đăng nhập, nút Sign in nếu chưa.

---

## 6. Hooks chi tiết

### `useChemistryData()`

**Returns:** `{ molecules, reactions, loading, error }`

**Logic:**

1. Song song fetch Supabase + external API (nếu `VITE_CHEM_API_BASE_URL` được set)
2. Merge và deduplicate theo id
3. Sort molecules theo formula, reactions theo equation

### `useAuth()`

**Returns:** `{ user: User | null, loading: boolean }`  
Subscribe `onAuthStateChange` + initial `getSession`.

### `usePubChemSearch(debounceMs)`

**Returns:** `{ query, results, total, loading, error, setQuery }`  
Search khi query ≥ 2 ký tự, debounce trước khi gọi API.

### `usePubChemMolecule()`

**Returns:** `{ molecule, loading, error, load(cid), clear() }`  
Fetch 3D conformer từ PubChem (fallback 2D nếu không có 3D).

### `usePubChemDescription()`

**Returns:** `{ description, loading, load(cid) }`  
Fetch từ PUG-View API.

### `usePubChemEnrichment()`

**Returns:** `{ pubchem, description, loading, enrich(formula, name), clear() }`  
Kết hợp search + description cho một compound.

### `useVoiceCommands(onCommand)`

**Returns:** `{ supported, listening, toggle }`  
Wrap Web Speech API, `continuous=true`, `lang="en-US"`.

---

## 7. Thư viện lib/

### `chemistry.ts`

- Types: `Atom`, `Bond`, `Molecule`, `Reaction`
- `ELEMENTS`: CPK colors + van der Waals radii cho ~25 nguyên tố
- `elementInfo(el)`: lookup với fallback

### `chemistry-api.ts`

- `fetchExternalChemistryData()`: gọi custom API nếu `VITE_CHEM_API_BASE_URL` được set
- `normalizeFormula()`: chuẩn hoá subscript unicode, remove state notation
- `normalizeMolecule()` / `normalizeReaction()`: normalize data từ nhiều nguồn
- `mergeChemistryData()`: merge + deduplicate Supabase + external API

### `pubchem-api.ts`

- `searchPubChem(query, limit=8)`: name search → formula fallback
- `fetchMolecule3D(cid)`: 3D conformer → 2D fallback, scale/center atoms
- `fetchCompoundDescription(cid)`: PUG-View text description

### `hand-tracker.ts`

- `initHandLandmarker()`: singleton, load từ CDN, `numHands=2`, `delegate=GPU`
- `processResult()`: tính `pinch` (thumb-tip to index-tip / hand size), `roll` (atan2 wrist→middleMcp), `palm` (landmark 9)

### `reaction-engine.ts`

- `findMatchingReaction(formulas, reactions)`: tìm reaction có reactants subset của formulas hiện có
- `PROXIMITY_THRESHOLD = 1.8` (world units)

### `periodic-table-data.ts`

- `loadPeriodicTable()`: localStorage cache → network fetch → fallback 31 elements
- `CATEGORY_STYLE`: map category → Tailwind classes
- `categoryStyle(category)`: get style object

---

## 8. Environment Variables

| Biến                            | Bắt buộc | Mô tả                               |
| ------------------------------- | -------- | ----------------------------------- |
| `VITE_SUPABASE_URL`             | ✅       | URL Supabase project                |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅       | Anon key                            |
| `VITE_CHEM_API_BASE_URL`        | ❌       | URL custom chemistry API (optional) |
| `VITE_CHEM_API_MOLECULES_PATH`  | ❌       | Default: `/molecules`               |
| `VITE_CHEM_API_REACTIONS_PATH`  | ❌       | Default: `/reactions`               |
| `VITE_CHEM_API_AUTH_HEADER`     | ❌       | Default: `Authorization`            |
| `VITE_CHEM_API_AUTH_TOKEN`      | ❌       | Bearer token                        |

---

## 9. Data flow tổng quát

```
Supabase DB ──────────────────────────────────┐
PubChem API ──── useChemistryData ────────────┤
Custom API  ──────────────────────────────────┘
                       │
                  molecules[], reactions[]
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ControlPanel      ARScene       MoleculesPage
  - molecule grid   - 3D render   - grid + search
  - PubChem search  - hand track  - PubChem results
  - reaction list   - reactions   - detail dialog
        │
  user selects
        │
        ▼
  LabPage state
  (toSpawn, selected, arOn, education, lastReaction)
        │
        ▼
  recordProgress → supabase user_progress
```

---

## 10. Vấn đề & Lưu ý khi rebuild frontend

### Về thiết kế hiện tại

- **Không có global state** (Redux/Zustand): mọi state đều trong component, prop drilling qua nhiều level (LabPage → ControlPanel → ARScene)
- **Styling:** TailwindCSS v4 + custom CSS variables trong `styles.css` (gradients, shadows, fonts)
- **Fonts:** Inter, Space Grotesk (display), JetBrains Mono (code)
- **Color system:** CSS custom properties: `--primary`, `--background`, `--card`, `--border`, `--muted`, `--accent`

### Các custom CSS classes (styles.css)

```
bg-gradient-hero      -- gradient nền chính
bg-gradient-primary   -- gradient nút/accent
bg-panel              -- panel background
shadow-soft           -- subtle shadow
shadow-panel          -- elevated panel shadow
shadow-glow           -- glow effect cho primary
animate-float-slow    -- floating animation
animate-pulse-glow    -- pulse glow
```

### Điểm cần chú ý khi tối ưu

1. **ARScene.tsx:** Toàn bộ Three.js trong 1 file lớn (~460 dòng), nên tách
2. **AtomViewer3D.tsx:** Tái sử dụng tốt, đã có imperative handle
3. **MoleculePreview.tsx:** Duplicate code với ARScene (buildMoleculeGroup), nên extract shared util
4. **ControlPanel:** Có 2 tabs nhưng không lazy load PubChemSearch
5. **Không có React.memo / useMemo** trên một số list render lớn
6. **Voice commands:** Chỉ hỗ trợ tiếng Anh (`lang="en-US"`)
7. **Mobile:** Nav responsive nhưng ARScene chưa tối ưu cho mobile
8. **Offline:** Periodic table có localStorage cache, molecules/reactions phụ thuộc hoàn toàn vào Supabase

### PubChem API limits

- Không cần API key
- Rate limit: ~5 requests/giây
- CORS: hỗ trợ browser fetch trực tiếp
- Timeout: 12 giây mỗi request
