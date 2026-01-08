(function () {
  "use strict";

  const examForm = document.getElementById("examForm");
  const submitBtn = document.getElementById("submitBtn");
  
  if (!examForm) return;

  const attemptId = examForm.dataset.attemptId;
  const totalQuestions = parseInt(examForm.dataset.totalQuestions || "0");
  
  let remainingSeconds = parseInt(
    examForm.dataset.remainingSeconds || 
    (parseInt(examForm.dataset.durationMinutes || "0") * 60)
  );

  const timerElement = document.getElementById("examTimer");
  const timerTextElement = document.getElementById("timerText");
  const timerWarningElement = document.getElementById("exam-timer-warning");

  function formatTime(seconds) {
    if (seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function updateTimer() {
    if (!timerTextElement) return;
    
    timerTextElement.textContent = formatTime(remainingSeconds);

    if (remainingSeconds <= 300) { // 5 mins
      if (timerElement) timerElement.classList.add("exam-timer--warning");
    }

    if (remainingSeconds <= 60) { // 1 min
      if (timerElement) {
        timerElement.classList.remove("exam-timer--warning");
        timerElement.classList.add("exam-timer--critical");
      }
    }

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      autoSubmitExam();
      return;
    }
    remainingSeconds--;
  }

  const timerInterval = setInterval(updateTimer, 1000);
  updateTimer();

  const progressText = document.getElementById("progressText");
  const navItems = document.querySelectorAll(".question-nav__item");

  window.scrollToQuestion = function(index) {
    const questionEl = document.getElementById(`question-${index}`);
    if (questionEl) {
      const headerOffset = 100;
      const elementPosition = questionEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      navItems.forEach(item => item.classList.remove('question-nav__item--current'));
      const navItem = document.querySelector(`.question-nav__item[data-index="${index}"]`);
      if (navItem) navItem.classList.add('question-nav__item--current');
    }
  };

  function updateProgress() {
    const answeredCount = Object.keys(transformFormData()).length;
    if (progressText) {
      progressText.textContent = `${answeredCount}/${totalQuestions} câu`;
    }
    
    const data = transformFormData();
    navItems.forEach(item => {
      const idx = item.dataset.index;
      const qCard = document.getElementById(`question-${idx}`);
      if (qCard) {
        const qId = qCard.dataset.questionId;
        if (data[qId]) {
          item.classList.add('question-nav__item--answered');
        } else {
          item.classList.remove('question-nav__item--answered');
        }
      }
    });
  }

  let saveTimeout;
  
  function triggerAutoSave() {
    updateProgress();
    clearTimeout(saveTimeout);
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
      if (!res.ok) console.warn("Auto-save failed");
    } catch (e) {
      console.warn("Auto-save error", e);
    }
  }

  const draggables = document.querySelectorAll('.matching-chip');
  const dropSlots = document.querySelectorAll('.matching-item__slot');
  const pools = document.querySelectorAll('.matching-pool');

  draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', () => {
      draggable.classList.add('dragging');
    });

    draggable.addEventListener('dragend', () => {
      draggable.classList.remove('dragging');
      triggerAutoSave();
    });
  });

  const allDropZones = [...dropSlots, ...pools];

  allDropZones.forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      if (!zone.classList.contains('matching-pool')) {
         zone.classList.add('drag-over');
      }
    });

    zone.addEventListener('dragleave', e => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      
      const draggable = document.querySelector('.dragging');
      if (!draggable) return;

      const draggedFromPool = draggable.closest('.answer-matching');
      const droppedToZone = zone.closest('.answer-matching');
      
      if (draggedFromPool !== droppedToZone) return;
      if (zone.classList.contains('matching-item__slot')) {
        const existingChip = zone.querySelector('.matching-chip');
        if (existingChip) {
           const pool = droppedToZone.querySelector('.matching-pool');
           pool.appendChild(existingChip);
        }
        
        zone.appendChild(draggable);
        
        const placeholder = zone.querySelector('.matching-item__placeholder');
        if (placeholder) placeholder.style.display = 'none';
        const leftItem = zone.dataset.left;
        const input = droppedToZone.querySelector(`input[name="answers[${droppedToZone.dataset.questionId}][${leftItem}]"]`);
        if (input) input.value = draggable.dataset.value;

      } else if (zone.classList.contains('matching-pool')) {
        zone.appendChild(draggable);
      }
      
      const slots = droppedToZone.querySelectorAll('.matching-item__slot');
      slots.forEach(slot => {
         const chip = slot.querySelector('.matching-chip');
         const leftItem = slot.dataset.left;
         const input = droppedToZone.querySelector(`input[name="answers[${droppedToZone.dataset.questionId}][${leftItem}]"]`);
         const placeholder = slot.querySelector('.matching-item__placeholder');
         
         if (chip) {
           if (input) input.value = chip.dataset.value;
           if (placeholder) placeholder.style.display = 'none';
         } else {
           if (input) input.value = "";
           if (placeholder) placeholder.style.display = 'block';
         }
      });
    });
  });

  if (submitBtn) {
    submitBtn.addEventListener("click", function (e) {
      e.preventDefault();
      
      const unanswered = getUnansweredCount();
      let msg = "Bạn có chắc chắn muốn nộp bài?";
      if (unanswered > 0) msg += `\n\n Cảnh báo!!! Còn ${unanswered} câu chưa làm.`;

      if (!confirm(msg)) return;
      doSubmit();
    });
  }

  function autoSubmitExam() {
    alert("Hết giờ làm bài! Hệ thống đang tự động nộp bài của bạn.");
    const inputs = examForm.querySelectorAll("input, button");
    inputs.forEach((i) => (i.disabled = true));
    doSubmit();
  }

  function doSubmit() {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Đang nộp...</span>';
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
        if (submitBtn) {
           submitBtn.disabled = false;
           submitBtn.textContent = "Nộp bài";
        }
      });
  }

  examForm.addEventListener("change", (e) => {
    if (e.target.matches('input[type="radio"], input[type="checkbox"]')) {
       updateAnswerVisualState(e.target);
       triggerAutoSave();
    }
  });

  function updateAnswerVisualState(input) {
    const questionCard = input.closest('.question-card');
    if (!questionCard) return;

    const questionType = questionCard.dataset.questionType;

    if (questionType === 'single_choice' || questionType === 'true_false') {
      const allOptions = questionCard.querySelectorAll('.answer-option, .truefalse-option');
      allOptions.forEach(opt => opt.classList.remove('answer-option--selected', 'truefalse-option--selected'));
      
      const parentLabel = input.closest('.answer-option, .truefalse-option');
      if (parentLabel) {
        parentLabel.classList.add(parentLabel.classList.contains('truefalse-option') ? 'truefalse-option--selected' : 'answer-option--selected');
      }
    } 
    else if (questionType === 'multiple_choice') {
      const parentLabel = input.closest('.answer-option');
      if (parentLabel) {
        if (input.checked) {
          parentLabel.classList.add('answer-option--selected');
        } else {
          parentLabel.classList.remove('answer-option--selected');
        }
      }
    }
  }

  examForm.addEventListener("input", (e) => {
    if (e.target.matches('input[type="text"]')) {
       triggerAutoSave();
    }
  });

  function transformFormData() {
    const answers = {};
    const questions = document.querySelectorAll('.question-card');

    questions.forEach((questionEl) => {
      const questionId = questionEl.dataset.questionId;
      const questionType = questionEl.dataset.questionType;

      if (questionType === 'single_choice') {
        const radio = questionEl.querySelector(`input[type="radio"][name="answers[${questionId}]"]:checked`);
        if (radio) answers[questionId] = radio.value;
      } 
      else if (questionType === 'multiple_choice') {
        const checkboxes = questionEl.querySelectorAll(`input[type="checkbox"][name="answers[${questionId}][]"]:checked`);
        if (checkboxes.length > 0) {
          answers[questionId] = Array.from(checkboxes).map(cb => cb.value);
        }
      } 
      else if (questionType === 'true_false') {
        const radio = questionEl.querySelector(`input[type="radio"][name="answers[${questionId}]"]:checked`);
        if (radio) answers[questionId] = radio.value;
      } 
      else if (questionType === 'fill_in_blank') {
        const textInput = questionEl.querySelector(`input[type="text"][name="answers[${questionId}]"]`);
        if (textInput && textInput.value.trim().length > 0) {
          answers[questionId] = textInput.value.trim();
        }
      } 
      else if (questionType === 'matching') {
        const mapping = {};
        const inputs = questionEl.querySelectorAll(`input[type="hidden"][name^="answers[${questionId}]"]`);
        inputs.forEach(input => {
           const match = input.name.match(/answers\[.*?\]\[(.*?)\]/);
           if (match && input.value) {
             mapping[match[1]] = input.value;
           }
        });
        if (Object.keys(mapping).length > 0) answers[questionId] = mapping;
      }
    });

    return answers;
  }

  function getUnansweredCount() {
    const data = transformFormData();
    const answeredCount = Object.keys(data).length;
    return Math.max(0, totalQuestions - answeredCount);
  }

})();
