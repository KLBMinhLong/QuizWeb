/**
 * Exam Take Page
 * Features:
 * - Server-side synchronized timer (Resume support)
 * - Auto-save progress to Server (Background sync)
 * - Auto-submit on timeout
 */

(function () {
  "use strict";

  const examForm = document.getElementById("exam-form");
  if (!examForm) return;

  const attemptId = examForm.dataset.attemptId;
  const totalQuestions = parseInt(
    examForm.dataset.totalQuestions || "0"
  );
  
  // Timer Init
  // Ưu tiên dùng remainingSeconds từ server gửi về (chính xác hơn)
  let remainingSeconds = parseInt(
    examForm.dataset.remainingSeconds || 
    (parseInt(examForm.dataset.durationMinutes || "0") * 60)
  );

  const timerElement = document.getElementById("exam-timer");
  const timerTextElement = document.getElementById("exam-timer-text");
  const timerWarningElement = document.getElementById("exam-timer-warning");

  function formatTime(seconds) {
    if (seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function updateTimer() {
    timerTextElement.textContent = formatTime(remainingSeconds);

    if (remainingSeconds <= 300) {
      timerElement.classList.add("exam-timer--warning");
      if (timerWarningElement) timerWarningElement.style.display = "block";
    }

    if (remainingSeconds <= 60) {
      timerElement.classList.remove("exam-timer--warning");
      timerElement.classList.add("exam-timer--critical");
    }

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      autoSubmitExam();
      return;
    }
    remainingSeconds--;
  }

  // Khởi động timer
  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);

  // --- Logic Auto Save ---
  let saveTimeout;
  
  function triggerAutoSave() {
    clearTimeout(saveTimeout);
    // Debounce 2s: Chờ user thao tác xong mới save để giảm tải
    saveTimeout = setTimeout(saveProgressToServer, 2000);
  }

  async function saveProgressToServer() {
    const answers = transformFormData();
    try {
      const res = await fetch("/exam/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      // Optional: Show saving indicator
      if (!res.ok) console.warn("Auto-save failed");
    } catch (e) {
      console.warn("Auto-save error", e);
    }
  }

  // --- Form Events ---
  examForm.addEventListener("change", (e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "SELECT" ||
      e.target.tagName === "TEXTAREA"
    ) {
      triggerAutoSave();
    }
  });
  
  // Input event cho text field
  examForm.addEventListener("input", (e) => {
    if (e.target.type === "text" || e.target.tagName === "TEXTAREA") {
      triggerAutoSave();
    }
  });

  // --- Submit Logic (Giữ nguyên logic cũ nhưng gọn hơn) ---
  examForm.addEventListener("submit", function (e) {
    e.preventDefault();
    
    // Check un-answered
    const unanswered = getUnansweredCount();
    let msg = "Bạn có chắc chắn muốn nộp bài?";
    if (unanswered > 0) msg += `\n\n⚠️ Còn ${unanswered} câu chưa làm.`;

    if (!confirm(msg)) return;

    doSubmit();
  });

  function autoSubmitExam() {
    if (timerWarningElement) {
      timerWarningElement.textContent = "Hết giờ! Đang nộp bài...";
      timerWarningElement.style.display = "block";
    }
    // Disable inputs
    const inputs = examForm.querySelectorAll("input, button, select");
    inputs.forEach((i) => (i.disabled = true));
    
    doSubmit();
  }

  function doSubmit() {
    const submitBtn = examForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang nộp...";
    }

    const answers = transformFormData();
    const payload = {
       subjectId: examForm.querySelector('input[name="subjectId"]').value,
       attemptId: attemptId,
       answers
    };

    fetch(examForm.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.redirected) window.location.href = res.url;
        else return res.text();
      })
      .then((html) => {
        if (html) {
          document.open();
          document.write(html);
          document.close();
        }
      })
      .catch((err) => {
        alert("Lỗi khi nộp bài: " + err);
        if (submitBtn) submitBtn.disabled = false;
      });
  }

  // Helper: Lấy data form -> JSON object answers
  function transformFormData() {
    const formData = new FormData(examForm);
    const answers = {};
    const questions = examForm.querySelectorAll('.exam-question[data-question-id]');

    questions.forEach((questionEl) => {
      const questionId = questionEl.dataset.questionId;
      const questionType = questionEl.dataset.questionType;

      if (questionType === 'single_choice') {
        const radio = questionEl.querySelector(`input[type="radio"][name="answers[${questionId}]"]:checked`);
        if (radio) answers[questionId] = radio.value;
      } else if (questionType === 'multiple_choice') {
        const checkboxes = questionEl.querySelectorAll(`input[type="checkbox"][name="answers[${questionId}][]"]:checked`);
        if (checkboxes.length > 0) {
          answers[questionId] = Array.from(checkboxes).map(cb => cb.value);
        }
      } else if (questionType === 'true_false') {
        const radio = questionEl.querySelector(`input[type="radio"][name="answers[${questionId}]"]:checked`);
        if (radio) answers[questionId] = radio.value;
      } else if (questionType === 'fill_in_blank') {
        const textInput = questionEl.querySelector(`input[type="text"][name="answers[${questionId}]"]`);
        if (textInput && textInput.value.trim().length > 0) {
          answers[questionId] = textInput.value.trim();
        }
      } else if (questionType === 'matching') {
        const selects = questionEl.querySelectorAll(`select[name^="answers[${questionId}]"]`);
        const mapping = {};
        selects.forEach(select => {
          const name = select.name;
          const match = name.match(/answers\[.*?\]\[(.*?)\]/);
          if (match && select.value.trim().length > 0) {
            mapping[match[1]] = select.value;
          }
        });
        if (Object.keys(mapping).length > 0) answers[questionId] = mapping;
      }
    });

    return answers;
  }

  function getUnansweredCount() {
    const data = transformFormData();
    // Count keys in `data` vs `totalQuestions`
    // Tuy nhiên data chỉ chứa câu đã trả lời
    const answeredCount = Object.keys(data).length;
    return Math.max(0, totalQuestions - answeredCount);
  }

})();
