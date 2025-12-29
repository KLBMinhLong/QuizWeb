/**
 * Exam Take Page - Timer & Submit Handler
 * US-41: Timer countdown và auto-submit khi hết giờ
 */

(function () {
  "use strict";

  // Get duration from data attribute
  const examForm = document.getElementById("exam-form");
  if (!examForm) return;

  const durationMinutes = parseInt(examForm.dataset.durationMinutes || "0");
  const attemptId = examForm.dataset.attemptId || "";

  if (durationMinutes <= 0) return;

  // Calculate total seconds
  let totalSeconds = durationMinutes * 60;
  let remainingSeconds = totalSeconds;

  // Get timer element
  const timerElement = document.getElementById("exam-timer");
  const timerTextElement = document.getElementById("exam-timer-text");
  const timerWarningElement = document.getElementById("exam-timer-warning");

  if (!timerElement || !timerTextElement) return;

  // Format time as MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Update timer display
  function updateTimer() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    timerTextElement.textContent = formatTime(remainingSeconds);

    // Warning styles when < 5 minutes
    if (remainingSeconds <= 300) {
      // 5 minutes = 300 seconds
      timerElement.classList.add("exam-timer--warning");
      if (timerWarningElement) {
        timerWarningElement.style.display = "block";
      }
    }

    // Critical style when < 1 minute
    if (remainingSeconds <= 60) {
      timerElement.classList.remove("exam-timer--warning");
      timerElement.classList.add("exam-timer--critical");
    }

    // Auto-submit when time is up (AC1)
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerTextElement.textContent = "00:00";
      autoSubmitExam();
      return;
    }

    remainingSeconds--;
  }

  // Auto-submit function
  function autoSubmitExam() {
    // Mark form as auto-submitting
    examForm.classList.add("auto-submitting");

    // Show notification
    if (timerWarningElement) {
      timerWarningElement.textContent = "⏰ Hết thời gian! Đang tự động nộp bài...";
      timerWarningElement.style.display = "block";
      timerWarningElement.classList.add("exam-timer-warning--critical");
    }

    // Disable form inputs
    const inputs = examForm.querySelectorAll("input, button");
    inputs.forEach((input) => {
      input.disabled = true;
    });

    // Submit form after short delay
    setTimeout(() => {
      examForm.submit();
    }, 1000);
  }

  // Start timer
  updateTimer(); // Initial display
  const timerInterval = setInterval(updateTimer, 1000);

  // Handle form submit with confirmation (US-41)
  examForm.addEventListener("submit", function (e) {
    // If auto-submitted, don't show confirmation
    if (examForm.classList.contains("auto-submitting")) {
      return;
    }

    // Check if there are unanswered questions
    const unansweredCount = getUnansweredCount();
    let confirmMessage = "Bạn có chắc chắn muốn nộp bài?";

    if (unansweredCount > 0) {
      confirmMessage += `\n\nBạn còn ${unansweredCount} câu hỏi chưa trả lời.`;
    }

    if (!confirm(confirmMessage)) {
      e.preventDefault();
      return false;
    }

    // Disable submit button to prevent double submission
    const submitBtn = examForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang nộp bài...";
    }
  });

  // Count unanswered questions
  function getUnansweredCount() {
    const questionInputs = examForm.querySelectorAll(
      'input[type="radio"][name^="answers["]'
    );
    const answeredQuestions = new Set();

    questionInputs.forEach((input) => {
      if (input.checked) {
        const name = input.name;
        const questionId = name.match(/answers\[(.*?)\]/)[1];
        answeredQuestions.add(questionId);
      }
    });

    // Count total questions (get from data attribute or count unique question IDs)
    const totalQuestions = parseInt(examForm.dataset.totalQuestions || "0");
    return Math.max(0, totalQuestions - answeredQuestions.size);
  }

  // Save progress to localStorage periodically (optional enhancement)
  function saveProgress() {
    const formData = new FormData(examForm);
    const answers = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("answers[")) {
        answers[key] = value;
      }
    }
    localStorage.setItem(`exam_progress_${attemptId}`, JSON.stringify(answers));
  }

  // Load progress from localStorage (optional enhancement)
  function loadProgress() {
    const saved = localStorage.getItem(`exam_progress_${attemptId}`);
    if (saved) {
      try {
        const answers = JSON.parse(saved);
        for (const [key, value] of Object.entries(answers)) {
          const input = examForm.querySelector(`input[name="${key}"][value="${value}"]`);
          if (input) {
            input.checked = true;
          }
        }
      } catch (e) {
        console.error("Error loading progress:", e);
      }
    }
  }

  // Auto-save progress every 30 seconds
  const saveInterval = setInterval(saveProgress, 30000);

  // Load progress on page load
  loadProgress();

  // Clean up on page unload
  window.addEventListener("beforeunload", function () {
    clearInterval(timerInterval);
    clearInterval(saveInterval);
    saveProgress();
  });
})();

