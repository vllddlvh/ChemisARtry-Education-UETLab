// src/lib/lessons-data.ts
// 22 bài học hardcode theo spec UX (Road 1: 12 bài, Road 2: 10 bài)
// UI/content được bổ sung sau — đây là skeleton data

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number; // index vào options
}

export interface Mission {
  id: string;
  description: string;
  /** formula hoặc keyword để kiểm tra hoàn thành */
  completionKey: string;
}

export interface LessonExplore {
  /** Danh sách element symbol hoặc molecule formula cần hiển thị */
  elements: string[];
  molecules: string[];
}

export interface LessonPractice {
  missions: Mission[];
  recommendedMode: "sim" | "ar" | "both";
  /** Công thức phân tử pre-load vào lab */
  defaultMolecules: string[];
}

export interface Lesson {
  id: string; // VD: "road1-lesson3"
  roadId: 1 | 2;
  order: number; // 1-based
  chapter: string;
  title: string;
  /** Nội dung lý thuyết dạng markdown (điền sau) */
  theory: string;
  explore3D: LessonExplore;
  practice: LessonPractice;
  quiz: QuizQuestion[];
}

// ── ROAD 1: Nguyên tố & Liên kết Hoá học ──────────────────────────────────

export const ROAD1_LESSONS: Lesson[] = [
  {
    id: "road1-lesson1",
    roadId: 1,
    order: 1,
    chapter: "Chương 1: Cấu tạo nguyên tử",
    title: "Nguyên tử là gì?",
    theory: `<p>Nguyên tử là hạt vô cùng nhỏ bé và trung hoà về điện, tạo nên mọi vật chất xung quanh chúng ta.</p>
<p>Mặc dù có kích thước siêu nhỏ, nguyên tử vẫn được cấu tạo bởi những hạt nhỏ hơn:</p>
<ul>
<li><strong>Hạt nhân (nucleus):</strong> Nằm ở tâm nguyên tử, mang điện tích dương. Nó chứa hai loại hạt là <strong>Proton</strong> và <strong>Neutron</strong>.</li>
<li><strong>Vỏ electron:</strong> Là không gian xung quanh hạt nhân, nơi các <strong>Electron</strong> mang điện tích âm di chuyển liên tục với tốc độ rất lớn.</li>
</ul>
<p>Vì nguyên tử trung hoà về điện, số hạt proton (mang điện tích +) luôn bằng số hạt electron (mang điện tích -).</p>`,
    explore3D: { elements: ["H", "He"], molecules: [] },
    practice: {
      missions: [
        { id: "m1", description: "Xem mô hình 3D nguyên tử H", completionKey: "view:H" },
        { id: "m2", description: "Xem mô hình 3D nguyên tử He", completionKey: "view:He" },
      ],
      recommendedMode: "sim",
      defaultMolecules: ["H2"],
    },
    quiz: [
      {
        id: "q1",
        question: "Nguyên tử gồm những hạt nào?",
        options: [
          "Proton và electron",
          "Proton, neutron và electron",
          "Neutron và electron",
          "Chỉ có proton",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "road1-lesson2",
    roadId: 1,
    order: 2,
    chapter: "Chương 1: Cấu tạo nguyên tử",
    title: "Proton, Neutron, Electron",
    theory: `<p>Chúng ta đã biết nguyên tử gồm hạt nhân và vỏ. Cùng tìm hiểu kỹ hơn về 3 loại hạt tạo nên chúng:</p>
<h4>1. Proton (p)</h4>
<ul>
<li>Nằm trong hạt nhân, mang điện tích dương (+1).</li>
<li>Số lượng proton quyết định "danh tính" của nguyên tố (được gọi là số hiệu nguyên tử Z).</li>
<li>Khối lượng xấp xỉ 1 amu.</li>
</ul>
<h4>2. Neutron (n)</h4>
<ul>
<li>Nằm trong hạt nhân cùng với proton.</li>
<li><strong>Không</strong> mang điện tích.</li>
<li>Có vai trò "gắn kết" các proton lại với nhau, giữ cho hạt nhân bền vững.</li>
<li>Khối lượng xấp xỉ 1 amu.</li>
</ul>
<h4>3. Electron (e)</h4>
<ul>
<li>Chuyển động xung quanh hạt nhân tạo thành vỏ nguyên tử.</li>
<li>Mang điện tích âm (-1). Số electron = Số proton (để nguyên tử trung hoà về điện).</li>
<li>Khối lượng rất nhỏ, không đáng kể.</li>
</ul>`,
    explore3D: { elements: ["H", "He", "Li"], molecules: [] },
    practice: {
      missions: [
        { id: "m1", description: "So sánh 3 nguyên tử bằng mô hình 3D", completionKey: "view:Li" },
      ],
      recommendedMode: "sim",
      defaultMolecules: [],
    },
    quiz: [
      {
        id: "q1",
        question: "Hạt nào mang điện tích âm?",
        options: ["Proton", "Neutron", "Electron", "Hạt nhân"],
        answer: 2,
      },
    ],
  },
  {
    id: "road1-lesson3",
    roadId: 1,
    order: 3,
    chapter: "Chương 1: Cấu tạo nguyên tử",
    title: "Cấu hình electron",
    theory: `<p>Electron không chuyển động ngẫu nhiên xung quanh hạt nhân mà được sắp xếp theo từng <strong>lớp</strong> (n) và <strong>phân lớp</strong> (s, p, d, f) từ trong ra ngoài dựa vào mức năng lượng.</p>
<p>Các lớp được đánh số từ n=1, 2, 3... (hay K, L, M...). Mỗi lớp có số electron tối đa:</p>
<ul>
<li>Lớp 1 (K): Tối đa 2e</li>
<li>Lớp 2 (L): Tối đa 8e</li>
<li>Lớp 3 (M): Tối đa 18e</li>
</ul>
<p><strong>Nguyên lý vững bền:</strong> Các electron sẽ ưu tiên điền vào lớp có năng lượng thấp nhất (gần hạt nhân nhất) trước, sau khi đầy mới sang lớp tiếp theo.</p>
<p><strong>Ví dụ:</strong> Nguyên tử Natri (Na) có 11 electron.<br/>
Chúng ta sẽ điền lần lượt: 2 electron vào lớp 1, 8 electron vào lớp 2. Lúc này còn 1 electron, nó sẽ nằm ở lớp 3.<br/>
Vậy cấu hình electron của Na là: <strong>2, 8, 1</strong>.<br/>
<em>(Viết theo phân lớp: 1s² 2s² 2p⁶ 3s¹)</em></p>`,
    explore3D: { elements: ["Na", "Cl"], molecules: [] },
    practice: {
      missions: [
        { id: "m1", description: "Xem cấu hình electron của Na (2,8,1)", completionKey: "view:Na" },
        { id: "m2", description: "Xem cấu hình electron của Cl (2,8,7)", completionKey: "view:Cl" },
        { id: "m3", description: "Kết hợp Na + Cl → NaCl", completionKey: "react:Na+Cl" },
      ],
      recommendedMode: "both",
      defaultMolecules: ["Na", "Cl2"],
    },
    quiz: [
      {
        id: "q1",
        question: "Na có bao nhiêu lớp electron?",
        options: ["1", "2", "3", "4"],
        answer: 2,
      },
      {
        id: "q2",
        question: "Lớp ngoài cùng của Na có mấy electron?",
        options: ["1", "2", "7", "8"],
        answer: 0,
      },
      {
        id: "q3",
        question: "Cấu hình electron của Cl (Z=17)?",
        options: ["2,8,7", "2,8,8", "2,7", "2,8,2,5"],
        answer: 0,
      },
    ],
  },
  {
    id: "road1-lesson4",
    roadId: 1,
    order: 4,
    chapter: "Chương 1: Cấu tạo nguyên tử",
    title: "Mô hình Bohr",
    theory: `<p>Năm 1913, nhà vật lý Niels Bohr đã đưa ra một mô hình để giải thích cấu tạo nguyên tử, đặc biệt là sự phát xạ ánh sáng:</p>
<ol>
<li><strong>Quỹ đạo dừng:</strong> Electron chuyển động quanh hạt nhân trên những quỹ đạo hình tròn cố định. Mỗi quỹ đạo tương ứng với một mức năng lượng xác định.</li>
<li><strong>Sự nhảy bậc:</strong> Khi ở trạng thái bình thường, electron quay ở quỹ đạo thấp nhất (gần hạt nhân nhất).</li>
<li><strong>Phát xạ/Hấp thụ:</strong> Nếu nguyên tử được cung cấp năng lượng (ví dụ: đốt nóng), electron sẽ "nhảy" lên quỹ đạo cao hơn. Tuy nhiên, nó sẽ nhanh chóng "rơi" trở lại quỹ đạo cũ, đồng thời giải phóng năng lượng dưới dạng <strong>ánh sáng</strong>.</li>
</ol>
<p>Mỗi nguyên tố sẽ phát ra những màu sắc ánh sáng đặc trưng khác nhau (quang phổ vạch), và mô hình Bohr giải thích rất tốt điều này.</p>`,
    explore3D: { elements: ["H", "Na", "Fe"], molecules: [] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Mở AR và quan sát nguyên tử phát sáng",
          completionKey: "ar:open",
        },
      ],
      recommendedMode: "ar",
      defaultMolecules: [],
    },
    quiz: [
      {
        id: "q1",
        question: "Mô hình Bohr mô tả gì?",
        options: [
          "Electron chuyển động hỗn loạn",
          "Electron chuyển động trên quỹ đạo tròn",
          "Neutron quay quanh proton",
          "Hạt nhân phát sáng",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "road1-lesson5",
    roadId: 1,
    order: 5,
    chapter: "Chương 2: Bảng tuần hoàn",
    title: "Bảng tuần hoàn — Nhóm & Chu kỳ",
    theory: `<p>Bảng tuần hoàn các nguyên tố hoá học do Dmitri Mendeleev tạo ra là một trong những thành tựu vĩ đại nhất của khoa học. Các nguyên tố được sắp xếp theo chiều tăng dần của số hiệu nguyên tử (Z).</p>
<h4>1. Chu kỳ (Hàng ngang)</h4>
<ul>
<li>Bảng tuần hoàn hiện có 7 chu kỳ.</li>
<li>Các nguyên tố cùng chu kỳ có <strong>cùng số lớp electron</strong>.</li>
<li>Đi từ trái sang phải, tính kim loại giảm dần, tính phi kim tăng dần.</li>
</ul>
<h4>2. Nhóm (Cột dọc)</h4>
<ul>
<li>Gồm 18 cột, chia thành các nhóm A và B.</li>
<li>Các nguyên tố cùng nhóm A có <strong>cùng số electron lớp ngoài cùng</strong>, do đó chúng có tính chất hoá học tương tự nhau.</li>
<li>Ví dụ: Nhóm IA (Kim loại kiềm) rất dễ nhường 1 electron; Nhóm VIIA (Halogen) rất dễ nhận thêm 1 electron.</li>
</ul>`,
    explore3D: { elements: ["H", "Li", "Na", "K"], molecules: [] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Khám phá bảng tuần hoàn 3D tương tác",
          completionKey: "tools:periodic-table",
        },
      ],
      recommendedMode: "sim",
      defaultMolecules: [],
    },
    quiz: [
      {
        id: "q1",
        question: "Nhóm IA gồm các nguyên tố nào?",
        options: ["Kim loại kiềm", "Halogen", "Khí hiếm", "Kim loại kiềm thổ"],
        answer: 0,
      },
    ],
  },
  {
    id: "road1-lesson6",
    roadId: 1,
    order: 6,
    chapter: "Chương 2: Bảng tuần hoàn",
    title: "Tính chất tuần hoàn",
    theory: `<p>Dựa vào vị trí trong bảng tuần hoàn, ta có thể dự đoán được tính chất của nguyên tử thông qua các quy luật biến đổi:</p>
<h4>1. Bán kính nguyên tử</h4>
<ul>
<li><strong>Trong cùng 1 chu kỳ:</strong> (Từ trái sang phải) Bán kính <strong>giảm dần</strong> (vì hạt nhân tăng điện tích, hút vỏ electron mạnh hơn).</li>
<li><strong>Trong cùng 1 nhóm:</strong> (Từ trên xuống dưới) Bán kính <strong>tăng dần</strong> (vì số lớp electron tăng lên).</li>
</ul>
<h4>2. Độ âm điện</h4>
<ul>
<li>Là khả năng hút electron của nguyên tử trong liên kết hoá học.</li>
<li><strong>Trong cùng 1 chu kỳ:</strong> Tăng dần (Fluorine là phi kim mạnh nhất, độ âm điện lớn nhất).</li>
<li><strong>Trong cùng 1 nhóm:</strong> Giảm dần.</li>
</ul>
<p>Nắm được quy luật này, bạn có thể dễ dàng so sánh tính chất giữa các nguyên tố mà không cần phải học thuộc lòng!</p>`,
    explore3D: { elements: ["Li", "Na", "K", "F", "Cl", "Br"], molecules: [] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "So sánh bán kính nguyên tử cùng nhóm",
          completionKey: "compare:Li,Na,K",
        },
      ],
      recommendedMode: "sim",
      defaultMolecules: [],
    },
    quiz: [
      {
        id: "q1",
        question: "Đi từ trên xuống trong cùng một nhóm, bán kính nguyên tử thay đổi thế nào?",
        options: ["Giảm dần", "Tăng dần", "Không đổi", "Không có quy luật"],
        answer: 1,
      },
    ],
  },
  {
    id: "road1-lesson7",
    roadId: 1,
    order: 7,
    chapter: "Chương 3: Liên kết hoá học",
    title: "Liên kết ion",
    theory: `<p>Các nguyên tử luôn có xu hướng đạt được cấu hình electron bền vững giống khí hiếm (thường là 8 electron lớp ngoài cùng - quy tắc Octet). Để làm được điều này, chúng có thể nhường hoặc nhận electron.</p>
<p><strong>Liên kết ion</strong> là liên kết được hình thành bởi lực hút tĩnh điện giữa các ion mang điện tích trái dấu.</p>
<p><strong>Quá trình tạo thành NaCl (Muối ăn):</strong></p>
<ol>
<li><strong>Natri (Na):</strong> Có 1 electron lớp ngoài cùng. Nó rất muốn nhường 1 electron này để đạt cấu hình bền. Khi nhường, Na trở thành ion dương Na⁺.</li>
<li><strong>Clo (Cl):</strong> Có 7 electron lớp ngoài cùng. Nó rất cần thêm 1 electron. Khi nhận 1 electron từ Na, Cl trở thành ion âm Cl⁻.</li>
<li>Hai ion Na⁺ và Cl⁻ mang điện tích trái dấu nên <strong>hút nhau</strong> thật chặt, tạo thành phân tử NaCl.</li>
</ol>`,
    explore3D: { elements: ["Na", "Cl"], molecules: ["NaCl"] },
    practice: {
      missions: [
        { id: "m1", description: "Spawn Na và Cl2 vào Lab", completionKey: "spawn:Na" },
        { id: "m2", description: "Tạo phân tử NaCl bằng phản ứng", completionKey: "react:NaCl" },
      ],
      recommendedMode: "both",
      defaultMolecules: ["Na", "Cl2"],
    },
    quiz: [
      {
        id: "q1",
        question: "Liên kết ion được tạo thành do?",
        options: ["Dùng chung electron", "Cho và nhận electron", "Lực hút từ", "Phân cực phân tử"],
        answer: 1,
      },
    ],
  },
  {
    id: "road1-lesson8",
    roadId: 1,
    order: 8,
    chapter: "Chương 3: Liên kết hoá học",
    title: "Liên kết cộng hoá trị",
    theory: `<p>Không phải lúc nào các nguyên tử cũng "thoải mái" cho và nhận electron như trong liên kết ion. Đôi khi, chúng quyết định <strong>dùng chung</strong> electron để cả hai đều đạt được cấu hình bền vững. Đó chính là <strong>Liên kết cộng hoá trị</strong>.</p>
<p>Liên kết này thường xảy ra giữa các nguyên tử phi kim với nhau.</p>
<h4>Ví dụ 1: Phân tử Nước (H₂O)</h4>
<ul>
<li>Oxy (O) có 6 electron ngoài cùng, cần thêm 2 electron.</li>
<li>Hydro (H) có 1 electron, cần thêm 1 electron.</li>
<li>Một nguyên tử O sẽ "góp chung" electron với hai nguyên tử H. Vậy là cả O và H đều "mãn nguyện".</li>
</ul>
<h4>Ví dụ 2: Phân tử Khí Carbonic (CO₂)</h4>
<ul>
<li>Carbon (C) cần 4 electron, Oxy (O) cần 2 electron.</li>
<li>C sẽ tạo ra hai <strong>liên kết đôi</strong> với hai nguyên tử O (mỗi liên kết đôi dùng chung 2 cặp electron).</li>
</ul>`,
    explore3D: { elements: [], molecules: ["H2O", "CO2", "NH3"] },
    practice: {
      missions: [
        { id: "m1", description: "Xem cấu trúc H₂O trong mô hình 3D", completionKey: "view:H2O" },
        { id: "m2", description: "Xem cấu trúc NH₃ trong mô hình 3D", completionKey: "view:NH3" },
      ],
      recommendedMode: "sim",
      defaultMolecules: ["H2O", "NH3", "CO2"],
    },
    quiz: [
      {
        id: "q1",
        question: "H₂O có bao nhiêu liên kết cộng hoá trị?",
        options: ["1", "2", "3", "4"],
        answer: 1,
      },
    ],
  },
  {
    id: "road1-lesson9",
    roadId: 1,
    order: 9,
    chapter: "Chương 3: Liên kết hoá học",
    title: "Liên kết kim loại",
    theory: `<p>Các kim loại như Sắt (Fe), Đồng (Cu), Vàng (Au) có những tính chất vật lý đặc biệt như: dẫn điện, dẫn nhiệt tốt, có ánh kim và dễ dát mỏng. Bí mật nằm ở cấu tạo của chúng!</p>
<h4>Mạng tinh thể kim loại</h4>
<ul>
<li>Trong khối kim loại, các nguyên tử kim loại dễ dàng nhường electron lớp ngoài cùng để trở thành các ion dương.</li>
<li>Các ion dương này xếp khít nhau theo một trật tự nhất định (gọi là mạng tinh thể).</li>
<li>Các electron bị nhường đi sẽ trở thành <strong>electron tự do</strong>. Chúng di chuyển tự do khắp mạng tinh thể như một "đám mây electron".</li>
</ul>
<p><strong>Liên kết kim loại</strong> chính là lực hút tĩnh điện giữa đám mây electron tự do này và các ion dương kim loại.</p>
<p>Chính nhờ các electron tự do di chuyển này mà kim loại có khả năng dẫn điện cực kỳ tốt!</p>`,
    explore3D: { elements: ["Fe", "Cu", "Na"], molecules: [] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Xem mô hình mạng tinh thể kim loại Fe",
          completionKey: "view:Fe",
        },
      ],
      recommendedMode: "sim",
      defaultMolecules: [],
    },
    quiz: [
      {
        id: "q1",
        question: "Liên kết kim loại là do?",
        options: ["Electron tự do", "Ion âm", "Proton chung", "Neutron"],
        answer: 0,
      },
    ],
  },
  {
    id: "road1-lesson10",
    roadId: 1,
    order: 10,
    chapter: "Chương 4: Phân tử & Hình dạng",
    title: "Hình học phân tử (VSEPR)",
    theory: `<p>Tại sao phân tử Nước (H₂O) lại có hình chữ V (góc khúc), trong khi Khí Carbonic (CO₂) lại thẳng tắp?<br/>
Đó là do <strong>thuyết đẩy cặp electron lớp vỏ hoá trị (VSEPR)</strong>.</p>
<h4>Ý tưởng cốt lõi:</h4>
<p>Các cặp electron (kể cả tham gia liên kết hay chưa tham gia liên kết) xung quanh nguyên tử trung tâm đều mang điện tích âm, nên chúng sẽ <strong>đẩy nhau</strong>.<br/>
Để phân tử bền vững nhất, các cặp electron này phải sắp xếp trong không gian sao cho lực đẩy giữa chúng là <strong>nhỏ nhất</strong> (cách xa nhau nhất có thể).</p>
<h4>Một số hình dạng phổ biến:</h4>
<ol>
<li><strong>Đường thẳng (Linear):</strong> CO₂. Góc liên kết 180°.</li>
<li><strong>Tam giác phẳng (Trigonal planar):</strong> BF₃. Góc 120°.</li>
<li><strong>Tứ diện đều (Tetrahedral):</strong> CH₄. Góc 109.5°.</li>
<li><strong>Gấp khúc / Chữ V (Bent):</strong> H₂O. Do O có 2 cặp electron chưa liên kết đẩy mạnh, làm góc H-O-H bị hẹp lại còn ≈ 104.5°.</li>
</ol>`,
    explore3D: { elements: [], molecules: ["H2O", "NH3", "CH4", "CO2"] },
    practice: {
      missions: [
        { id: "m1", description: "So sánh góc liên kết H₂O và CO₂", completionKey: "view:H2O" },
        { id: "m2", description: "Xem cấu hình tứ diện của CH₄", completionKey: "view:CH4" },
      ],
      recommendedMode: "both",
      defaultMolecules: ["H2O", "NH3", "CH4", "CO2"],
    },
    quiz: [
      {
        id: "q1",
        question: "CH₄ có hình dạng gì?",
        options: ["Thẳng", "Tam giác phẳng", "Tứ diện", "Chữ V"],
        answer: 2,
      },
    ],
  },
  {
    id: "road1-lesson11",
    roadId: 1,
    order: 11,
    chapter: "Chương 4: Phân tử & Hình dạng",
    title: "Lực giữa các phân tử",
    theory: `<p>Chúng ta đã học về liên kết GIỮA các nguyên tử (ion, cộng hoá trị, kim loại) - đây là những liên kết rất mạnh (lực nội phân tử).<br/>
Nhưng còn lực GIỮA các phân tử với nhau thì sao? Dù yếu hơn, chúng lại quyết định trạng thái (rắn, lỏng, khí) và nhiệt độ sôi của chất!</p>
<h4>1. Tương tác Van der Waals</h4>
<ul>
<li>Là lực hút yếu giữa các phân tử do sự phân bố electron không đồng đều nhất thời.</li>
<li>Phân tử càng lớn (nhiều electron), lực Van der Waals càng mạnh ⇒ Nhiệt độ sôi càng cao.</li>
</ul>
<h4>2. Liên kết Hydrogen (H-bond)</h4>
<ul>
<li>Là một loại lực hút đặc biệt mạnh hơn Van der Waals (nhưng vẫn yếu hơn liên kết cộng hoá trị).</li>
<li>Xảy ra khi nguyên tử H liên kết trực tiếp với các nguyên tử có độ âm điện rất lớn (F, O, N).</li>
<li>Nhờ có liên kết Hydrogen giữa các phân tử nước (H₂O), nước mới ở thể lỏng ở nhiệt độ phòng và có nhiệt độ sôi cao bất thường (100°C).</li>
</ul>`,
    explore3D: { elements: [], molecules: ["H2O", "H2"] },
    practice: {
      missions: [
        { id: "m1", description: "Quan sát liên kết hydro trong H₂O", completionKey: "view:H2O" },
      ],
      recommendedMode: "sim",
      defaultMolecules: ["H2O"],
    },
    quiz: [
      {
        id: "q1",
        question: "Liên kết hydro xảy ra khi nào?",
        options: [
          "H liên kết với N, O hoặc F",
          "H liên kết với C",
          "H liên kết với kim loại",
          "Mọi trường hợp",
        ],
        answer: 0,
      },
    ],
  },
  {
    id: "road1-lesson12",
    roadId: 1,
    order: 12,
    chapter: "Chương 4: Phân tử & Hình dạng",
    title: "Thực hành AR tổng hợp",
    theory: `<p>Chúc mừng bạn đã hoàn thành phần lý thuyết của Road 1: Nguyên tố và Liên kết hoá học! 🎉</p>
<p>Bây giờ là lúc vận dụng những gì đã học vào <strong>Thực hành AR tổng hợp</strong>.</p>
<h4>Nhiệm vụ của bạn:</h4>
<ol>
<li>Mở Phòng thí nghiệm AR (camera) hoặc Sim 3D.</li>
<li>Tự do spawn các nguyên tử H, O, C, Na, Cl...</li>
<li>Xem cách chúng tương tác và tạo ra các phân tử như H₂O, CO₂, CH₄, NaCl.</li>
<li>Quan sát hình dạng 3D thực tế của các phân tử mà bạn vừa học trong Bài 10.</li>
</ol>
<p>Hãy thử kết hợp các chất với nhau xem điều gì sẽ xảy ra nhé! Chúc bạn có những khám phá thú vị!</p>`,
    explore3D: {
      elements: ["H", "O", "N", "C", "Na", "Cl"],
      molecules: ["H2O", "NaCl", "CH4", "NH3", "CO2"],
    },
    practice: {
      missions: [
        { id: "m1", description: "Spawn ít nhất 3 phân tử khác nhau", completionKey: "spawn:3" },
        { id: "m2", description: "Kích hoạt ít nhất 1 phản ứng", completionKey: "react:1" },
      ],
      recommendedMode: "ar",
      defaultMolecules: ["H2", "O2", "CH4", "NaCl"],
    },
    quiz: [],
  },
];

// ── ROAD 2: Phản ứng Hoá học ───────────────────────────────────────────────

export const ROAD2_LESSONS: Lesson[] = [
  {
    id: "road2-lesson1",
    roadId: 2,
    order: 1,
    chapter: "Chương 1: Phản ứng hoá học",
    title: "Phản ứng là gì?",
    theory: `<p><strong>Phản ứng hoá học</strong> là quá trình biến đổi từ chất này thành chất khác. Trong phản ứng, các nguyên tử không bị mất đi mà chỉ <strong>sắp xếp lại</strong>: liên kết cũ bị phá vỡ và liên kết mới được hình thành.</p>
<h4>Dấu hiệu nhận biết có phản ứng xảy ra</h4>
<ul>
<li>Thay đổi màu sắc (vd: sắt để lâu chuyển nâu đỏ).</li>
<li>Tạo chất khí (sủi bọt) hoặc kết tủa (chất rắn không tan).</li>
<li>Toả nhiệt / thu nhiệt, phát sáng.</li>
</ul>
<h4>Chất tham gia & sản phẩm</h4>
<p>Phương trình có dạng: <strong>Chất phản ứng → Sản phẩm</strong>.<br/>
Ví dụ kinh điển: 2H₂ + O₂ → 2H₂O. Hai phân tử hydro và một phân tử oxi tái tổ hợp thành nước.</p>
<p>💡 <em>Kiến thức liên quan:</em> Định luật bảo toàn khối lượng (Lavoisier) — tổng khối lượng các chất phản ứng luôn bằng tổng khối lượng sản phẩm, vì số nguyên tử mỗi loại được giữ nguyên.</p>`,
    explore3D: { elements: [], molecules: ["H2", "O2", "H2O"] },
    practice: {
      missions: [
        { id: "m1", description: "Quan sát H₂ + O₂ → H₂O trong AR", completionKey: "react:H2+O2" },
      ],
      recommendedMode: "both",
      defaultMolecules: ["H2", "O2"],
    },
    quiz: [
      {
        id: "q1",
        question: "Trong phản ứng hoá học, điều gì xảy ra?",
        options: [
          "Nguyên tử bị phá huỷ",
          "Liên kết cũ phá vỡ, liên kết mới hình thành",
          "Nguyên tố biến đổi",
          "Không có gì thay đổi",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "road2-lesson2",
    roadId: 2,
    order: 2,
    chapter: "Chương 1: Phản ứng hoá học",
    title: "Cân bằng phương trình",
    theory: `<p>Vì nguyên tử được bảo toàn, số nguyên tử mỗi nguyên tố ở <strong>hai vế</strong> của phương trình phải bằng nhau. <strong>Cân bằng phương trình</strong> là việc thêm các hệ số (số đứng trước công thức) để đạt được điều đó.</p>
<h4>Các bước cân bằng</h4>
<ol>
<li>Viết sơ đồ phản ứng (chất phản ứng → sản phẩm).</li>
<li>Đếm số nguyên tử mỗi nguyên tố ở hai vế.</li>
<li>Thêm hệ số (không đổi chỉ số dưới chân công thức!) để cân bằng từng nguyên tố.</li>
<li>Kiểm tra lại và rút gọn hệ số về tỉ lệ tối giản.</li>
</ol>
<h4>Ví dụ: H₂ + O₂ → H₂O</h4>
<p>Vế phải có 1 O, vế trái có 2 O ⇒ đặt hệ số 2 trước H₂O: H₂ + O₂ → 2H₂O.<br/>
Giờ vế phải có 4 H, vế trái 2 H ⇒ đặt 2 trước H₂: <strong>2H₂ + O₂ → 2H₂O</strong>. Cân bằng xong!</p>
<p>💡 <em>Lưu ý:</em> Tuyệt đối không thay đổi công thức hoá học (vd không được viết H₂O thành H₂O₂) để cân bằng — chỉ được đổi hệ số.</p>`,
    explore3D: { elements: [], molecules: ["H2", "O2", "H2O"] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Cân bằng phương trình H₂ + O₂ → H₂O",
          completionKey: "balance:H2O",
        },
      ],
      recommendedMode: "sim",
      defaultMolecules: ["H2", "O2"],
    },
    quiz: [
      {
        id: "q1",
        question: "Tại sao cần cân bằng phương trình?",
        options: ["Cho đẹp", "Bảo toàn nguyên tử", "Bảo toàn phân tử", "Tính toán cho dễ"],
        answer: 1,
      },
    ],
  },
  {
    id: "road2-lesson3",
    roadId: 2,
    order: 3,
    chapter: "Chương 2: Phân loại phản ứng",
    title: "Phản ứng đốt cháy",
    theory: `<p><strong>Phản ứng cháy</strong> là phản ứng của một chất với oxi, thường <strong>toả nhiều nhiệt và phát sáng</strong>. Đây là phản ứng toả nhiệt điển hình (ΔH < 0).</p>
<h4>Đốt cháy hydrocarbon</h4>
<p>Khi đốt cháy hoàn toàn hợp chất chứa C và H (hydrocarbon, rượu...), sản phẩm luôn là <strong>CO₂ và H₂O</strong>:</p>
<ul>
<li>CH₄ + 2O₂ → CO₂ + 2H₂O (khí gas đun nấu)</li>
<li>C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O (đốt cồn)</li>
</ul>
<h4>Cháy hoàn toàn vs không hoàn toàn</h4>
<ul>
<li><strong>Hoàn toàn</strong> (đủ oxi): tạo CO₂ + H₂O.</li>
<li><strong>Không hoàn toàn</strong> (thiếu oxi): tạo thêm CO (khí độc) hoặc muội than C — đây là lý do không nên đốt than trong phòng kín.</li>
</ul>
<p>💡 <em>Kiến thức liên quan:</em> Phản ứng cháy là nền tảng của động cơ đốt trong và nhà máy nhiệt điện, nhưng cũng sinh ra CO₂ — khí gây hiệu ứng nhà kính.</p>`,
    explore3D: { elements: [], molecules: ["CH4", "O2", "CO2", "H2O", "C2H5OH"] },
    practice: {
      missions: [
        { id: "m1", description: "Đốt CH₄ trong Lab (CH₄ + O₂)", completionKey: "react:CH4+O2" },
        { id: "m2", description: "Đốt C₂H₅OH trong Lab", completionKey: "react:C2H5OH+O2" },
      ],
      recommendedMode: "both",
      defaultMolecules: ["CH4", "O2"],
    },
    quiz: [
      {
        id: "q1",
        question: "Sản phẩm chung của phản ứng đốt cháy hoàn toàn hydrocarbon là?",
        options: ["CO và H₂", "CO₂ và H₂O", "CO₂ và H₂", "C và H₂O"],
        answer: 1,
      },
    ],
  },
  {
    id: "road2-lesson4",
    roadId: 2,
    order: 4,
    chapter: "Chương 2: Phân loại phản ứng",
    title: "Phản ứng tổng hợp",
    theory: `<p><strong>Phản ứng tổng hợp (hoá hợp)</strong> là phản ứng trong đó <strong>hai hay nhiều chất kết hợp tạo thành một chất duy nhất</strong>: A + B → AB.</p>
<h4>Ví dụ quan trọng</h4>
<ul>
<li><strong>Tổng hợp amoniac (Haber-Bosch):</strong> N₂ + 3H₂ → 2NH₃. Phản ứng công nghiệp quan trọng bậc nhất, dùng sản xuất phân đạm nuôi sống hàng tỉ người.</li>
<li><strong>Sản xuất axit sunfuric:</strong> 2SO₂ + O₂ → 2SO₃, sau đó SO₃ + H₂O → H₂SO₄.</li>
<li>2Na + Cl₂ → 2NaCl; CaO + CO₂ → CaCO₃.</li>
</ul>
<h4>Điều kiện phản ứng</h4>
<p>Nhiều phản ứng tổng hợp cần <strong>nhiệt độ, áp suất cao và chất xúc tác</strong>. Ví dụ Haber-Bosch cần ~450°C, 200 atm và xúc tác sắt.</p>
<p>💡 <em>Kiến thức liên quan:</em> Fritz Haber nhận giải Nobel Hoá học 1918 cho quy trình tổng hợp amoniac từ nitơ trong không khí.</p>`,
    explore3D: { elements: [], molecules: ["N2", "H2", "NH3", "SO2", "O2", "SO3"] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Thực hiện N₂ + H₂ → NH₃ (Haber-Bosch)",
          completionKey: "react:N2+H2",
        },
        { id: "m2", description: "Thực hiện SO₂ + O₂ → SO₃", completionKey: "react:SO2+O2" },
      ],
      recommendedMode: "both",
      defaultMolecules: ["N2", "H2", "SO2", "O2"],
    },
    quiz: [
      {
        id: "q1",
        question: "Phản ứng tổng hợp tạo ra?",
        options: [
          "Từ 1 chất thành nhiều",
          "Từ nhiều chất thành 1 chất",
          "Trao đổi ion",
          "Oxi hoá khử",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "road2-lesson5",
    roadId: 2,
    order: 5,
    chapter: "Chương 2: Phân loại phản ứng",
    title: "Phản ứng phân huỷ",
    theory: `<p><strong>Phản ứng phân huỷ</strong> ngược lại với tổng hợp: <strong>một chất bị tách thành hai hay nhiều chất</strong>: AB → A + B. Phần lớn phản ứng phân huỷ <strong>thu nhiệt</strong> (cần cung cấp năng lượng).</p>
<h4>Ví dụ</h4>
<ul>
<li><strong>Phân huỷ oxi già:</strong> 2H₂O₂ → 2H₂O + O₂ (sủi bọt khi rửa vết thương, có xúc tác là enzyme catalase).</li>
<li><strong>Nung vôi:</strong> CaCO₃ →(nhiệt) CaO + CO₂. Sản xuất vôi sống từ đá vôi.</li>
<li><strong>Điện phân nước:</strong> 2H₂O →(điện) 2H₂ + O₂.</li>
</ul>
<h4>Nguồn năng lượng kích hoạt</h4>
<p>Phân huỷ thường cần: <strong>nhiệt</strong> (nhiệt phân), <strong>điện</strong> (điện phân) hoặc <strong>ánh sáng</strong> (quang phân).</p>
<p>💡 <em>Kiến thức liên quan:</em> Túi khí ô tô hoạt động nhờ phản ứng phân huỷ cực nhanh của NaN₃ tạo khí N₂ bơm phồng túi trong vài mili-giây.</p>`,
    explore3D: { elements: [], molecules: ["H2O2", "H2O", "O2", "CaCO3", "CaO", "CO2"] },
    practice: {
      missions: [
        { id: "m1", description: "Phân huỷ H₂O₂ → H₂O + O₂", completionKey: "react:H2O2" },
        { id: "m2", description: "Nhiệt phân CaCO₃ → CaO + CO₂", completionKey: "react:CaCO3" },
      ],
      recommendedMode: "both",
      defaultMolecules: ["H2O2", "CaCO3"],
    },
    quiz: [
      {
        id: "q1",
        question: "H₂O₂ phân huỷ tạo ra?",
        options: ["H₂ và O", "H₂O và O₂", "H₂ và O₂", "HO và OH"],
        answer: 1,
      },
    ],
  },
  {
    id: "road2-lesson6",
    roadId: 2,
    order: 6,
    chapter: "Chương 3: Acid & Base",
    title: "Acid & Base",
    theory: `<p><strong>Axit</strong> là chất khi tan trong nước phân li ra ion H⁺ (vd HCl, H₂SO₄). <strong>Bazơ</strong> phân li ra ion OH⁻ (vd NaOH, Ca(OH)₂).</p>
<h4>Thang pH</h4>
<ul>
<li>pH < 7: môi trường axit (chanh ~2, dạ dày ~1.5).</li>
<li>pH = 7: trung tính (nước cất).</li>
<li>pH > 7: môi trường bazơ (xà phòng ~10, nước Javen ~12).</li>
</ul>
<h4>Phản ứng trung hoà</h4>
<p>Axit phản ứng với bazơ tạo <strong>muối và nước</strong>: <strong>Axit + Bazơ → Muối + H₂O</strong>.</p>
<p>Ví dụ: HCl + NaOH → NaCl + H₂O. Bản chất là H⁺ + OH⁻ → H₂O, toả nhiệt.</p>
<h4>Chất chỉ thị</h4>
<p>Quỳ tím hoá đỏ trong axit, hoá xanh trong bazơ. Phenolphtalein không màu trong axit, hồng trong bazơ.</p>
<p>💡 <em>Kiến thức liên quan:</em> Khi bị ong đốt (axit) bôi vôi/baking soda (bazơ); khi bị kiến đốt cũng dùng nguyên lý trung hoà này.</p>`,
    explore3D: { elements: [], molecules: ["HCl", "NaOH", "NaCl", "H2O", "HF", "H2SO4"] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Trung hoà HCl + NaOH → NaCl + H₂O",
          completionKey: "react:HCl+NaOH",
        },
      ],
      recommendedMode: "both",
      defaultMolecules: ["HCl", "NaOH"],
    },
    quiz: [
      {
        id: "q1",
        question: "Sản phẩm của phản ứng acid-base là?",
        options: ["Chỉ muối", "Chỉ nước", "Muối và nước", "Oxide và nước"],
        answer: 2,
      },
    ],
  },
  {
    id: "road2-lesson7",
    roadId: 2,
    order: 7,
    chapter: "Chương 3: Năng lượng phản ứng",
    title: "Nhiệt hoá học (ΔH)",
    theory: `<p>Mỗi phản ứng đều kèm theo sự thay đổi năng lượng, đo bằng <strong>biến thiên enthalpy ΔH</strong> (đơn vị kJ/mol).</p>
<h4>Toả nhiệt vs Thu nhiệt</h4>
<ul>
<li><strong>Toả nhiệt (ΔH &lt; 0):</strong> giải phóng năng lượng ra môi trường, hệ nóng lên. Vd: cháy, trung hoà. (Trong Lab, hiệu ứng chớp <span style="color:#f97316">cam-đỏ 🔥</span>.)</li>
<li><strong>Thu nhiệt (ΔH &gt; 0):</strong> hấp thụ năng lượng, hệ lạnh đi. Vd: nhiệt phân CaCO₃, điện phân. (Hiệu ứng chớp <span style="color:#3b82f6">xanh ❄️</span>.)</li>
</ul>
<h4>Năng lượng liên kết</h4>
<p>Phá vỡ liên kết <em>cần</em> năng lượng; tạo liên kết <em>giải phóng</em> năng lượng.<br/>
ΔH ≈ (tổng năng lượng liên kết bị phá) − (tổng năng lượng liên kết tạo thành).<br/>
Nếu sản phẩm có liên kết bền hơn ⇒ phản ứng toả nhiệt.</p>
<p>💡 <em>Kiến thức liên quan:</em> Túi chườm nóng/lạnh y tế dùng phản ứng toả/thu nhiệt; ví dụ NH₄NO₃ tan trong nước thu nhiệt mạnh tạo túi chườm lạnh.</p>`,
    explore3D: { elements: [], molecules: ["H2", "O2", "H2O", "CH4", "CO2"] },
    practice: {
      missions: [
        { id: "m1", description: "Quan sát ΔH của H₂ + O₂ → H₂O", completionKey: "react:H2+O2" },
        {
          id: "m2",
          description: "So sánh ΔH của các phản ứng trong danh sách",
          completionKey: "view:reactions",
        },
      ],
      recommendedMode: "both",
      defaultMolecules: ["H2", "O2", "CH4"],
    },
    quiz: [
      {
        id: "q1",
        question: "Phản ứng toả nhiệt có ΔH?",
        options: ["ΔH > 0", "ΔH < 0", "ΔH = 0", "ΔH không xác định"],
        answer: 1,
      },
    ],
  },
  {
    id: "road2-lesson8",
    roadId: 2,
    order: 8,
    chapter: "Chương 3: Năng lượng phản ứng",
    title: "Tốc độ phản ứng",
    theory: `<p><strong>Tốc độ phản ứng</strong> cho biết phản ứng xảy ra nhanh hay chậm (lượng chất biến đổi trong một đơn vị thời gian).</p>
<h4>Các yếu tố ảnh hưởng</h4>
<ul>
<li><strong>Nhiệt độ:</strong> tăng nhiệt ⇒ phân tử va chạm mạnh và thường xuyên hơn ⇒ nhanh hơn.</li>
<li><strong>Nồng độ / áp suất:</strong> càng đậm đặc, va chạm càng nhiều ⇒ nhanh hơn.</li>
<li><strong>Diện tích bề mặt:</strong> chất rắn nghiền nhỏ phản ứng nhanh hơn (bột than cháy nhanh hơn cục than).</li>
<li><strong>Chất xúc tác:</strong> làm tăng tốc độ mà không bị tiêu hao, bằng cách giảm năng lượng hoạt hoá.</li>
</ul>
<h4>Thuyết va chạm</h4>
<p>Phản ứng chỉ xảy ra khi các phân tử va chạm <strong>đủ mạnh</strong> (vượt năng lượng hoạt hoá Eₐ) và <strong>đúng hướng</strong>.</p>
<p>💡 <em>Kiến thức liên quan:</em> Enzyme trong cơ thể là chất xúc tác sinh học cực mạnh, tăng tốc phản ứng lên hàng triệu lần ở nhiệt độ cơ thể.</p>`,
    explore3D: { elements: [], molecules: ["H2", "O2", "H2O"] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Điều chỉnh điều kiện và quan sát tốc độ phản ứng",
          completionKey: "sim:speed",
        },
      ],
      recommendedMode: "sim",
      defaultMolecules: ["H2", "O2"],
    },
    quiz: [
      {
        id: "q1",
        question: "Tăng nhiệt độ ảnh hưởng tốc độ phản ứng thế nào?",
        options: ["Giảm", "Tăng", "Không đổi", "Tuỳ phản ứng"],
        answer: 1,
      },
    ],
  },
  {
    id: "road2-lesson9",
    roadId: 2,
    order: 9,
    chapter: "Chương 4: Cân bằng hoá học",
    title: "Cân bằng hoá học",
    theory: `<p>Nhiều phản ứng là <strong>thuận nghịch</strong> (xảy ra theo cả hai chiều), ký hiệu ⇌. Khi tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch, hệ đạt <strong>trạng thái cân bằng động</strong> — nồng độ các chất không đổi nhưng phản ứng vẫn diễn ra ở mức vi mô.</p>
<h4>Nguyên lý Le Chatelier</h4>
<p>"Khi một hệ cân bằng chịu tác động từ bên ngoài, hệ sẽ <strong>chuyển dịch theo chiều chống lại</strong> tác động đó."</p>
<ul>
<li><strong>Tăng nồng độ chất phản ứng</strong> ⇒ cân bằng dịch sang phải (tạo thêm sản phẩm).</li>
<li><strong>Tăng áp suất</strong> ⇒ dịch về phía có ít phân tử khí hơn.</li>
<li><strong>Tăng nhiệt độ</strong> ⇒ dịch theo chiều thu nhiệt.</li>
</ul>
<h4>Ứng dụng: Haber-Bosch (N₂ + 3H₂ ⇌ 2NH₃)</h4>
<p>Phản ứng toả nhiệt và giảm số mol khí, nên để tăng NH₃ người ta dùng <strong>áp suất cao</strong> và nhiệt độ vừa phải, đồng thời liên tục tách NH₃ ra khỏi hệ.</p>
<p>💡 <em>Kiến thức liên quan:</em> Hemoglobin trong máu vận chuyển O₂ cũng dựa trên cân bằng thuận nghịch giữa hemoglobin và oxi.</p>`,
    explore3D: { elements: [], molecules: ["N2", "H2", "NH3"] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Thay đổi điều kiện Haber-Bosch và quan sát cân bằng",
          completionKey: "sim:equilibrium",
        },
      ],
      recommendedMode: "sim",
      defaultMolecules: ["N2", "H2", "NH3"],
    },
    quiz: [
      {
        id: "q1",
        question: "Nguyên lý Le Chatelier phát biểu điều gì?",
        options: [
          "Phản ứng luôn hoàn toàn",
          "Hệ cân bằng chống lại sự thay đổi",
          "Nhiệt độ không ảnh hưởng cân bằng",
          "Áp suất không ảnh hưởng cân bằng",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "road2-lesson10",
    roadId: 2,
    order: 10,
    chapter: "Chương 4: Cân bằng hoá học",
    title: "Thực hành AR tổng hợp",
    theory: `<p>Chúc mừng bạn đã đi hết Road 2: Phản ứng Hoá học! 🎉 Đây là bài tổng hợp để bạn vận dụng tất cả kiến thức đã học.</p>
<h4>Thử thách lớn — kích hoạt 5 loại phản ứng</h4>
<ol>
<li>🔥 <strong>Cháy:</strong> CH₄ + O₂ → CO₂ + H₂O</li>
<li>🧬 <strong>Tổng hợp:</strong> N₂ + H₂ → NH₃</li>
<li>💥 <strong>Phân huỷ:</strong> H₂O₂ → H₂O + O₂</li>
<li>⚗️ <strong>Trung hoà:</strong> HCl + NaOH → NaCl + H₂O</li>
<li>⚡ <strong>Oxi hoá:</strong> Fe + O₂ → Fe₂O₃</li>
</ol>
<p>Hãy chú ý màu của hiệu ứng: cam-đỏ là toả nhiệt, xanh là thu nhiệt. Quan sát nhật ký phản ứng góc phải để theo dõi những gì bạn đã tạo ra.</p>
<p>Chúc bạn có những khám phá thú vị và đừng quên thử các phản ứng ngoài danh sách bằng cách ghép các chất khác nhau!</p>`,
    explore3D: { elements: [], molecules: ["H2", "O2", "CH4", "HCl", "NaOH", "NaCl", "H2O"] },
    practice: {
      missions: [
        {
          id: "m1",
          description: "Grand experiment: Kích hoạt 5 phản ứng khác nhau",
          completionKey: "react:5",
        },
      ],
      recommendedMode: "ar",
      defaultMolecules: ["H2", "O2", "CH4", "HCl", "NaOH"],
    },
    quiz: [],
  },
];

export const ALL_LESSONS: Lesson[] = [...ROAD1_LESSONS, ...ROAD2_LESSONS];

export function getLessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function getLessonsByRoad(roadId: 1 | 2): Lesson[] {
  return ALL_LESSONS.filter((l) => l.roadId === roadId);
}
