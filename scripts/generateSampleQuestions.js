/**
 * Script để tạo các file Excel và CSV mẫu cho import questions
 * 
 * Usage: node scripts/generateSampleQuestions.js
 */

var XLSX = require("xlsx");
var fs = require("fs");
var path = require("path");

// Đảm bảo thư mục samples tồn tại
const samplesDir = path.join(__dirname, "../samples");
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// Danh sách các môn học (có thể thay đổi theo subjects thực tế trong DB)
const subjects = [
  { slug: "toan-hoc", name: "Toán học" },
  { slug: "vat-ly", name: "Vật lý" },
  { slug: "hoa-hoc", name: "Hóa học" },
  { slug: "sinh-hoc", name: "Sinh học" },
  { slug: "lich-su", name: "Lịch sử" },
];

const difficulties = ["easy", "medium", "hard"];
const types = ["single_choice", "multiple_choice", "true_false", "fill_in_blank", "matching"];

/**
 * Nội dung câu hỏi theo môn học
 */
const questionTemplates = {
  "toan-hoc": {
    single_choice: [
      { q: "Giá trị của biểu thức 2 + 3 × 4 bằng bao nhiêu?", a: ["14", "20", "11", "24"], correct: 0 },
      { q: "Số nguyên tố nhỏ nhất là:", a: ["0", "1", "2", "3"], correct: 2 },
      { q: "Căn bậc hai của 16 là:", a: ["4", "8", "16", "32"], correct: 0 },
      { q: "Phương trình x² - 5x + 6 = 0 có nghiệm là:", a: ["x = 2 và x = 3", "x = 1 và x = 6", "x = -2 và x = -3", "x = 0 và x = 5"], correct: 0 },
      { q: "Đạo hàm của hàm số f(x) = x³ là:", a: ["3x²", "x²", "3x", "x³"], correct: 0 },
    ],
    multiple_choice: [
      { q: "Các số nào sau đây là số chẵn? (chọn nhiều đáp án)", a: ["2", "3", "4", "5"], correct: [0, 2] },
      { q: "Những phương trình nào có nghiệm? (chọn nhiều đáp án)", a: ["x + 1 = 0", "x² + 1 = 0", "2x = 4", "x² = -1"], correct: [0, 2] },
    ],
    true_false: [
      { q: "Số 0 là số nguyên tố", correct: false },
      { q: "Tổng các góc trong tam giác bằng 180 độ", correct: true },
      { q: "Số π (pi) là số hữu tỉ", correct: false },
    ],
    fill_in_blank: [
      { q: "Số tự nhiên lớn nhất có một chữ số là: _____", a: ["9", "chín"] },
      { q: "1 + 1 = _____", a: ["2", "hai"] },
    ],
    matching: [
      { q: "Nối các công thức toán học với tên gọi:", pairs: [
        { left: "a² + b² = c²", right: "Định lý Pythagoras" },
        { left: "πr²", right: "Diện tích hình tròn" },
        { left: "V = l×w×h", right: "Thể tích hình hộp chữ nhật" },
      ]},
    ],
  },
  "vat-ly": {
    single_choice: [
      { q: "Đơn vị đo vận tốc trong hệ SI là:", a: ["m/s", "km/h", "mph", "cm/s"], correct: 0 },
      { q: "Lực hấp dẫn giữa hai vật phụ thuộc vào:", a: ["Khối lượng và khoảng cách", "Chỉ khối lượng", "Chỉ khoảng cách", "Thể tích"], correct: 0 },
      { q: "Hiện tượng nào sau đây không liên quan đến lực ma sát?", a: ["Phanh xe", "Viết bút", "Bay trong không khí", "Đi bộ"], correct: 2 },
      { q: "Năng lượng động năng phụ thuộc vào:", a: ["Khối lượng và vận tốc", "Chỉ khối lượng", "Chỉ vận tốc", "Thể tích"], correct: 0 },
    ],
    multiple_choice: [
      { q: "Các đơn vị nào sau đây dùng để đo năng lượng? (chọn nhiều đáp án)", a: ["Joule", "Watt", "Calorie", "Newton"], correct: [0, 2] },
    ],
    true_false: [
      { q: "Ánh sáng truyền thẳng trong môi trường đồng nhất", correct: true },
      { q: "Điện tích cùng dấu thì hút nhau", correct: false },
    ],
    fill_in_blank: [
      { q: "Vận tốc ánh sáng trong chân không là khoảng _____ m/s", a: ["300000000", "3×10⁸", "3e8"] },
    ],
    matching: [
      { q: "Nối các đại lượng vật lý với đơn vị:", pairs: [
        { left: "Lực", right: "Newton (N)" },
        { left: "Năng lượng", right: "Joule (J)" },
        { left: "Công suất", right: "Watt (W)" },
      ]},
    ],
  },
  "hoa-hoc": {
    single_choice: [
      { q: "Ký hiệu hóa học của nước là:", a: ["H₂O", "CO₂", "O₂", "H₂"], correct: 0 },
      { q: "Nguyên tố có số nguyên tử bằng 1 là:", a: ["Hydrogen", "Helium", "Carbon", "Oxygen"], correct: 0 },
      { q: "Phản ứng nào sau đây là phản ứng oxi hóa-khử?", a: ["2H₂ + O₂ → 2H₂O", "NaCl + AgNO₃ → AgCl + NaNO₃", "HCl + NaOH → NaCl + H₂O", "CaCO₃ → CaO + CO₂"], correct: 0 },
    ],
    multiple_choice: [
      { q: "Các kim loại nào sau đây có thể phản ứng với axit? (chọn nhiều đáp án)", a: ["Sắt", "Vàng", "Kẽm", "Bạc"], correct: [0, 2] },
    ],
    true_false: [
      { q: "Nước là hợp chất", correct: true },
      { q: "Oxygen là kim loại", correct: false },
    ],
    fill_in_blank: [
      { q: "Công thức hóa học của khí carbon dioxide là: _____", a: ["CO2", "CO₂"] },
    ],
    matching: [
      { q: "Nối các nguyên tố với ký hiệu hóa học:", pairs: [
        { left: "Hydrogen", right: "H" },
        { left: "Carbon", right: "C" },
        { left: "Oxygen", right: "O" },
      ]},
    ],
  },
  "lich-su": {
    single_choice: [
      { q: "Chiến thắng Điện Biên Phủ diễn ra vào năm nào?", a: ["1954", "1945", "1975", "1950"], correct: 0 },
      { q: "Vị vua nào thành lập nhà Nguyễn?", a: ["Gia Long", "Tự Đức", "Minh Mạng", "Thiệu Trị"], correct: 0 },
      { q: "Cách mạng Tháng Tám thành công vào năm:", a: ["1945", "1954", "1975", "1941"], correct: 0 },
    ],
    multiple_choice: [
      { q: "Các triều đại nào sau đây thuộc lịch sử Việt Nam? (chọn nhiều đáp án)", a: ["Nhà Lý", "Nhà Đường", "Nhà Trần", "Nhà Tống"], correct: [0, 2] },
    ],
    true_false: [
      { q: "Hà Nội là thủ đô của Việt Nam từ năm 1010", correct: true },
      { q: "Chiến tranh Việt Nam kết thúc năm 1973", correct: false },
    ],
    fill_in_blank: [
      { q: "Ngày Quốc khánh Việt Nam là ngày _____ tháng 9", a: ["2", "02", "hai"] },
    ],
    matching: [
      { q: "Nối các sự kiện với năm:", pairs: [
        { left: "Điện Biên Phủ", right: "1954" },
        { left: "Cách mạng Tháng Tám", right: "1945" },
        { left: "Giải phóng miền Nam", right: "1975" },
      ]},
    ],
  },
  "sinh-hoc": {
    single_choice: [
      { q: "Cơ quan nào trong cơ thể người có chức năng lọc máu?", a: ["Thận", "Gan", "Phổi", "Tim"], correct: 0 },
      { q: "Số nhiễm sắc thể ở người bình thường là:", a: ["46", "23", "44", "48"], correct: 0 },
    ],
    true_false: [
      { q: "ADN là vật chất di truyền", correct: true },
      { q: "Con người có 3 phổi", correct: false },
    ],
    fill_in_blank: [
      { q: "Quá trình quang hợp tạo ra khí _____", a: ["O2", "O₂", "oxygen", "oxy"] },
    ],
  },
};

/**
 * Tạo dữ liệu câu hỏi mẫu
 */
function generateSampleQuestions(subjectSlug, count = 50) {
  const questions = [];
  const templates = questionTemplates[subjectSlug] || questionTemplates["toan-hoc"]; // Fallback to math

  // Đếm số câu hỏi đã tạo theo type
  let typeCounts = { single_choice: 0, multiple_choice: 0, true_false: 0, fill_in_blank: 0, matching: 0 };
  
  for (let i = 1; i <= count; i++) {
    // Phân bổ type: 40% single_choice, 20% multiple_choice, 15% true_false, 15% fill_in_blank, 10% matching
    let type;
    const rand = Math.random();
    if (rand < 0.4) type = "single_choice";
    else if (rand < 0.6) type = "multiple_choice";
    else if (rand < 0.75) type = "true_false";
    else if (rand < 0.9) type = "fill_in_blank";
    else type = "matching";

    // Chọn difficulty (phân bổ: 40% easy, 35% medium, 25% hard)
    let difficulty;
    const diffRand = Math.random();
    if (diffRand < 0.4) difficulty = "easy";
    else if (diffRand < 0.75) difficulty = "medium";
    else difficulty = "hard";

    let answersJson = "";
    let content = "";

    const typeTemplates = templates[type] || [];
    if (typeTemplates.length > 0) {
      const template = typeTemplates[typeCounts[type] % typeTemplates.length];
      typeCounts[type]++;

      switch (type) {
        case "single_choice":
          content = template.q;
          const singleOptions = template.a.map((text, idx) => ({
            text: text,
            isCorrect: idx === template.correct,
          }));
          answersJson = JSON.stringify(singleOptions);
          break;

        case "multiple_choice":
          content = template.q;
          const multiOptions = template.a.map((text, idx) => ({
            text: text,
            isCorrect: template.correct.includes(idx),
          }));
          answersJson = JSON.stringify(multiOptions);
          break;

        case "true_false":
          content = template.q;
          const tfOptions = [
            { value: true, isCorrect: template.correct },
            { value: false, isCorrect: !template.correct },
          ];
          answersJson = JSON.stringify(tfOptions);
          break;

        case "fill_in_blank":
          content = template.q;
          answersJson = JSON.stringify({ accepted: template.a });
          break;

        case "matching":
          content = template.q;
          answersJson = JSON.stringify({ pairs: template.pairs });
          break;
      }
    } else {
      // Fallback nếu không có template
      content = `Câu hỏi ${i} về ${subjectSlug}`;
      const singleOptions = [
        { text: "Đáp án A", isCorrect: true },
        { text: "Đáp án B", isCorrect: false },
        { text: "Đáp án C", isCorrect: false },
      ];
      answersJson = JSON.stringify(singleOptions);
      type = "single_choice";
    }

    questions.push({
      subjectSlug: subjectSlug,
      difficulty: difficulty,
      type: type,
      content: content,
      answersJson: answersJson,
      mediaUrl: "",
    });
  }

  return questions;
}

/**
 * Tạo file Excel
 */
function createExcelFile(filename, questions) {
  // Tạo worksheet từ dữ liệu
  const ws = XLSX.utils.json_to_sheet(questions);

  // Tạo workbook
  const wb = XLSX.utils.book_new();

  // Đổi tên sheet thành "Questions"
  XLSX.utils.book_append_sheet(wb, ws, "Questions");

  // Ghi file
  const filePath = path.join(samplesDir, filename);
  XLSX.writeFile(wb, filePath);

  console.log(`✓ Đã tạo file: ${filePath}`);
}

/**
 * Tạo file CSV
 */
function createCSVFile(filename, questions) {
  // Header
  const headers = ["subjectSlug", "difficulty", "type", "content", "answersJson", "mediaUrl"];
  let csvContent = headers.join(",") + "\n";

  // Data rows
  questions.forEach((q) => {
    const row = [
      q.subjectSlug,
      q.difficulty,
      q.type,
      `"${q.content.replace(/"/g, '""')}"`, // Escape quotes trong CSV
      `"${q.answersJson.replace(/"/g, '""')}"`,
      q.mediaUrl || "",
    ];
    csvContent += row.join(",") + "\n";
  });

  // Ghi file với UTF-8 encoding và BOM để Excel nhận diện đúng encoding
  const filePath = path.join(samplesDir, filename);
  // Thêm BOM (Byte Order Mark) UTF-8 để Excel nhận diện đúng encoding
  const BOM = "\uFEFF";
  fs.writeFileSync(filePath, BOM + csvContent, { encoding: "utf-8" });

  console.log(`✓ Đã tạo file: ${filePath}`);
}

// Tạo các file mẫu
console.log("Đang tạo các file mẫu...\n");

// File 1: Toán học - Excel
const mathQuestions = generateSampleQuestions("toan-hoc", 50);
createExcelFile("toan-hoc-questions.xlsx", mathQuestions);

// File 2: Vật lý - Excel
const physicsQuestions = generateSampleQuestions("vat-ly", 50);
createExcelFile("vat-ly-questions.xlsx", physicsQuestions);

// File 3: Lịch sử - Excel
const historyQuestions = generateSampleQuestions("lich-su", 50);
createExcelFile("lich-su-questions.xlsx", historyQuestions);

// File 4: Hóa học - CSV
const chemistryQuestions = generateSampleQuestions("hoa-hoc", 50);
createCSVFile("hoa-hoc-questions.csv", chemistryQuestions);

console.log("\n✓ Hoàn tất! Đã tạo 4 file mẫu:");
console.log("  - toan-hoc-questions.xlsx (50 câu hỏi)");
console.log("  - vat-ly-questions.xlsx (50 câu hỏi)");
console.log("  - lich-su-questions.xlsx (50 câu hỏi)");
console.log("  - hoa-hoc-questions.csv (50 câu hỏi)");
console.log(`\nCác file được lưu tại: ${samplesDir}`);

