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
    const inputs = examForm.querySelectorAll("input, button, select");
    inputs.forEach((input) => {
      input.disabled = true;
    });

    // Submit form using fetch after short delay
    setTimeout(() => {
      const answers = transformFormData();
      const payload = {
        subjectId: examForm.querySelector('input[name="subjectId"]').value,
        attemptId: examForm.querySelector('input[name="attemptId"]').value,
        answers: answers
      };

      fetch(examForm.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }).then(response => {
        if (response.redirected) {
          window.location.href = response.url;
        } else if (response.ok) {
          return response.text().then(html => {
            document.open();
            document.write(html);
            document.close();
          });
        }
      }).catch(error => {
        console.error('Error auto-submitting form:', error);
        // Fallback to regular form submit
        examForm.submit();
      });
    }, 1000);
  }

  // Start timer
  updateTimer(); // Initial display
  const timerInterval = setInterval(updateTimer, 1000);

  // Transform form data to proper format for submission
  function transformFormData() {
    const formData = new FormData(examForm);
    const answers = {};
    const questions = examForm.querySelectorAll('.exam-question[data-question-id]');

    questions.forEach((questionEl) => {
      const questionId = questionEl.dataset.questionId;
      const questionType = questionEl.dataset.questionType;

      if (questionType === 'single_choice') {
        const radio = questionEl.querySelector(`input[type="radio"][name="answers[${questionId}]"]:checked`);
        if (radio) {
          answers[questionId] = radio.value; // index as string
        }
      } else if (questionType === 'multiple_choice') {
        const checkboxes = questionEl.querySelectorAll(`input[type="checkbox"][name="answers[${questionId}][]"]:checked`);
        if (checkboxes.length > 0) {
          answers[questionId] = Array.from(checkboxes).map(cb => cb.value); // array of indices
        }
      } else if (questionType === 'true_false') {
        const radio = questionEl.querySelector(`input[type="radio"][name="answers[${questionId}]"]:checked`);
        if (radio) {
          answers[questionId] = radio.value; // "true" or "false" string
        }
      } else if (questionType === 'fill_in_blank') {
        const textInput = questionEl.querySelector(`input[type="text"][name="answers[${questionId}]"]`);
        if (textInput && textInput.value.trim().length > 0) {
          answers[questionId] = textInput.value.trim(); // string
        }
      } else if (questionType === 'matching') {
        const selects = questionEl.querySelectorAll(`select[name^="answers[${questionId}]"]`);
        const mapping = {};
        selects.forEach(select => {
          const name = select.name;
          const match = name.match(/answers\[.*?\]\[(.*?)\]/);
          if (match && select.value.trim().length > 0) {
            const leftItem = match[1];
            mapping[leftItem] = select.value;
          }
        });
        if (Object.keys(mapping).length > 0) {
          answers[questionId] = mapping; // object mapping
        }
      }
    });

    return answers;
  }

  // Handle form submit with confirmation (US-41)
  examForm.addEventListener("submit", function (e) {
    // Always prevent default and use fetch for proper JSON handling
    e.preventDefault();

    // Check if there are unanswered questions
    const unansweredCount = getUnansweredCount();
    let confirmMessage = "Bạn có chắc chắn muốn nộp bài?";

    if (unansweredCount > 0) {
      confirmMessage += `\n\nBạn còn ${unansweredCount} câu hỏi chưa trả lời.`;
    }

    if (!confirm(confirmMessage)) {
      return false;
    }

    // Transform and prepare form data for submission
    const answers = transformFormData();

    // Prepare payload for server
    const payload = {
      subjectId: examForm.querySelector('input[name="subjectId"]').value,
      attemptId: examForm.querySelector('input[name="attemptId"]').value,
      answers: answers
    };

    // Disable submit button to prevent double submission
    const submitBtn = examForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang nộp bài...";
    }

    // Submit using fetch with JSON
    fetch(examForm.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }).then(response => {
      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
        return response.text().then(html => {
          document.open();
          document.write(html);
          document.close();
        });
      } else {
        return response.text().then(text => {
          alert('Có lỗi xảy ra: ' + text);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Nộp bài";
          }
        });
      }
    }).catch(error => {
      console.error('Error submitting form:', error);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Nộp bài";
      }
    });
  });

  // Count unanswered questions (hỗ trợ tất cả các dạng câu hỏi)
  function getUnansweredCount() {
    const questions = examForm.querySelectorAll('.exam-question[data-question-id]');
    let answeredCount = 0;

    questions.forEach((questionEl) => {
      const questionId = questionEl.dataset.questionId;
      const questionType = questionEl.dataset.questionType;
      let isAnswered = false;

      if (questionType === 'single_choice' || questionType === 'true_false') {
        const radio = questionEl.querySelector(`input[type="radio"][name^="answers["]:checked`);
        isAnswered = !!radio;
      } else if (questionType === 'multiple_choice') {
        const checkboxes = questionEl.querySelectorAll(`input[type="checkbox"][name^="answers["]:checked`);
        isAnswered = checkboxes.length > 0;
      } else if (questionType === 'fill_in_blank') {
        const textInput = questionEl.querySelector(`input[type="text"][name^="answers["]`);
        isAnswered = textInput && textInput.value.trim().length > 0;
      } else if (questionType === 'matching') {
        const selects = questionEl.querySelectorAll(`select[name^="answers["]`);
        isAnswered = Array.from(selects).some(select => select.value.trim().length > 0);
      }

      if (isAnswered) answeredCount++;
    });

    const totalQuestions = parseInt(examForm.dataset.totalQuestions || "0");
    return Math.max(0, totalQuestions - answeredCount);
  }

  // Save progress to localStorage periodically (optional enhancement)
  function saveProgress() {
    const answers = transformFormData();
    localStorage.setItem(`exam_progress_${attemptId}`, JSON.stringify(answers));
  }

  // Load progress from localStorage (optional enhancement)
  function loadProgress() {
    const saved = localStorage.getItem(`exam_progress_${attemptId}`);
    if (saved) {
      try {
        const answers = JSON.parse(saved);
        const questions = examForm.querySelectorAll('.exam-question[data-question-id]');

        questions.forEach((questionEl) => {
          const questionId = questionEl.dataset.questionId;
          const questionType = questionEl.dataset.questionType;
          const savedAnswer = answers[questionId];

          if (!savedAnswer) return;

          if (questionType === 'single_choice') {
            const radio = questionEl.querySelector(`input[type="radio"][name="answers[${questionId}]"][value="${savedAnswer}"]`);
            if (radio) radio.checked = true;
          } else if (questionType === 'multiple_choice' && Array.isArray(savedAnswer)) {
            savedAnswer.forEach(val => {
              const checkbox = questionEl.querySelector(`input[type="checkbox"][name="answers[${questionId}][]"][value="${val}"]`);
              if (checkbox) checkbox.checked = true;
            });
          } else if (questionType === 'true_false') {
            const radio = questionEl.querySelector(`input[type="radio"][name="answers[${questionId}]"][value="${savedAnswer}"]`);
            if (radio) radio.checked = true;
          } else if (questionType === 'fill_in_blank') {
            const textInput = questionEl.querySelector(`input[type="text"][name="answers[${questionId}]"]`);
            if (textInput) textInput.value = savedAnswer;
          } else if (questionType === 'matching' && typeof savedAnswer === 'object') {
            Object.keys(savedAnswer).forEach(leftItem => {
              const select = questionEl.querySelector(`select[name="answers[${questionId}][${leftItem}]"]`);
              if (select) select.value = savedAnswer[leftItem];
            });
          }
        });
      } catch (e) {
        console.error("Error loading progress:", e);
      }
    }
  }

  // Auto-save progress on input changes
  examForm.addEventListener('change', function(e) {
    if (e.target.classList.contains('exam-answer-input')) {
      saveProgress();
    }
  });

  examForm.addEventListener('input', function(e) {
    if (e.target.classList.contains('exam-answer-input')) {
      saveProgress();
    }
  });

  // Auto-save progress every 30 seconds as backup
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

