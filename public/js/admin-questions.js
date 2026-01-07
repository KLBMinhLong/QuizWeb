// Admin Questions Form Handler

document.addEventListener("DOMContentLoaded", function() {
  const typeSelect = document.getElementById("type");
  const answersContainer = document.getElementById("answers-container");
  
  if (typeSelect && answersContainer) {
    typeSelect.addEventListener("change", function() {
      updateAnswersFields(this.value);
    });
    
    // Initialize on page load if type is already selected
    if (typeSelect.value) {
      updateAnswersFields(typeSelect.value);
    }
  }
});

function updateAnswersFields(type) {
  const container = document.getElementById("answers-container");
  if (!container) return;
  
  container.innerHTML = "";
  
  switch(type) {
    case "single_choice":
    case "multiple_choice":
      renderChoiceAnswers(container, type === "multiple_choice");
      break;
    case "true_false":
      renderTrueFalseAnswers(container);
      break;
    case "fill_in_blank":
      renderFillInBlankAnswers(container);
      break;
    case "matching":
      renderMatchingAnswers(container);
      break;
  }
}

function renderChoiceAnswers(container, multiple) {
  container.innerHTML = `
    <label class="admin-form-label">Các lựa chọn: <span style="color: #dc2626;">*</span></label>
    <div id="choice-answers-list"></div>
    <button type="button" class="admin-btn admin-btn--secondary admin-btn--sm" onclick="addChoiceAnswer()" style="margin-top: 0.5rem;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Thêm lựa chọn
    </button>
  `;
  
  // Only add default empty options for new question (not in edit mode)
  // Edit mode will call loadExistingAnswers which will populate the answers
  if (!window.isEditMode) {
    addChoiceAnswer('', false);
    addChoiceAnswer('', false);
  }
}

function addChoiceAnswer(text, isCorrect) {
  const list = document.getElementById("choice-answers-list");
  if (!list) return;
  
  const index = list.children.length;
  const div = document.createElement("div");
  div.className = "admin-form-group";
  div.style.display = "flex";
  div.style.gap = "0.75rem";
  div.style.alignItems = "center";
  div.style.marginBottom = "0.75rem";
  div.style.padding = "0.75rem";
  div.style.background = "#f8fafc";
  div.style.borderRadius = "8px";
  div.innerHTML = `
    <span style="color: var(--color-text-muted); font-weight: 600; min-width: 24px;">${String.fromCharCode(65 + index)}.</span>
    <input type="text" name="choice-text-${index}" value="${text || ''}" placeholder="Nội dung đáp án" class="admin-form-input" style="flex: 1;" />
    <label style="display: flex; align-items: center; gap: 6px; white-space: nowrap; cursor: pointer;">
      <input type="checkbox" name="choice-correct-${index}" ${isCorrect ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--color-primary);" />
      <span style="color: ${isCorrect ? 'var(--color-primary)' : 'var(--color-text-muted)'}; font-weight: 500;">Đúng</span>
    </label>
    <button type="button" class="admin-btn admin-btn--ghost" onclick="this.parentElement.remove(); updateChoiceLabels();" style="color: #dc2626; padding: 6px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>
  `;
  list.appendChild(div);
}

function updateChoiceLabels() {
  const list = document.getElementById("choice-answers-list");
  if (!list) return;
  
  Array.from(list.children).forEach((div, index) => {
    const label = div.querySelector("span");
    if (label) {
      label.textContent = String.fromCharCode(65 + index) + ".";
    }
  });
}

function renderTrueFalseAnswers(container) {
  container.innerHTML = `
    <label class="admin-form-label">Chọn đáp án đúng: <span style="color: #dc2626;">*</span></label>
    <div style="display: flex; gap: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; transition: all 0.2s;">
        <input type="radio" name="tf-correct" value="true" style="width: 18px; height: 18px; accent-color: var(--color-primary);" />
        <span style="font-weight: 500;">Đúng</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; transition: all 0.2s;">
        <input type="radio" name="tf-correct" value="false" style="width: 18px; height: 18px; accent-color: var(--color-primary);" />
        <span style="font-weight: 500;">Sai</span>
      </label>
    </div>
  `;
}

function renderFillInBlankAnswers(container) {
  container.innerHTML = `
    <label class="admin-form-label">Các đáp án được chấp nhận (mỗi đáp án một dòng): <span style="color: #dc2626;">*</span></label>
    <textarea id="fill-answers" name="fill-answers" class="admin-form-input" rows="5" style="resize: vertical;" placeholder="đáp án 1&#10;đáp án 2&#10;đáp án 3"></textarea>
    <p style="font-size: 13px; color: var(--color-text-muted); margin-top: 6px;">
      💡 Mỗi dòng là một đáp án được chấp nhận. Không phân biệt hoa/thường.
    </p>
  `;
}

function renderMatchingAnswers(container) {
  container.innerHTML = `
    <label class="admin-form-label">Các cặp để nối: <span style="color: #dc2626;">*</span></label>
    <div id="matching-pairs-list"></div>
    <button type="button" class="admin-btn admin-btn--secondary admin-btn--sm" onclick="addMatchingPair()" style="margin-top: 0.5rem;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Thêm cặp
    </button>
    <p style="font-size: 13px; color: var(--color-text-muted); margin-top: 6px;">
      💡 Thí sinh sẽ nối các mục bên trái với mục tương ứng bên phải.
    </p>
  `;
  
  // Only add default empty pairs for new question (not in edit mode)
  if (!window.isEditMode) {
    addMatchingPair('', '');
    addMatchingPair('', '');
  }
}

function addMatchingPair(left, right) {
  const list = document.getElementById("matching-pairs-list");
  if (!list) return;
  
  const index = list.children.length;
  const div = document.createElement("div");
  div.className = "admin-form-group";
  div.style.display = "grid";
  div.style.gridTemplateColumns = "1fr auto 1fr auto";
  div.style.gap = "0.75rem";
  div.style.alignItems = "center";
  div.style.marginBottom = "0.75rem";
  div.style.padding = "0.75rem";
  div.style.background = "#f8fafc";
  div.style.borderRadius = "8px";
  div.innerHTML = `
    <input type="text" name="match-left-${index}" value="${left || ''}" placeholder="Bên trái" class="admin-form-input" />
    <span style="color: var(--color-text-muted);">↔</span>
    <input type="text" name="match-right-${index}" value="${right || ''}" placeholder="Bên phải" class="admin-form-input" />
    <button type="button" class="admin-btn admin-btn--ghost" onclick="this.parentElement.remove()" style="color: #dc2626; padding: 6px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>
  `;
  list.appendChild(div);
}

// Build answers JSON before form submit
function buildAnswersJSON() {
  const typeSelect = document.getElementById("type");
  if (!typeSelect) return true;
  
  const type = typeSelect.value;
  const answersInput = document.getElementById("answers-json");
  if (!answersInput) return true;
  
  switch(type) {
    case "single_choice":
    case "multiple_choice": {
      const choiceAnswers = [];
      const list = document.getElementById("choice-answers-list");
      if (!list) break;
      
      Array.from(list.children).forEach((div, index) => {
        const textInput = div.querySelector(`[name^="choice-text-"]`);
        const correctInput = div.querySelector(`[name^="choice-correct-"]`);
        const text = textInput ? textInput.value.trim() : "";
        if (text) {
          choiceAnswers.push({
            text: text,
            isCorrect: correctInput ? correctInput.checked : false
          });
        }
      });
      
      if (choiceAnswers.length < 2) {
        alert("Phải có ít nhất 2 lựa chọn");
        return false;
      }
      const correctCount = choiceAnswers.filter(a => a.isCorrect).length;
      if (type === "single_choice" && correctCount !== 1) {
        alert("Câu hỏi một lựa chọn phải có đúng 1 đáp án đúng");
        return false;
      }
      if (type === "multiple_choice" && correctCount < 1) {
        alert("Câu hỏi nhiều lựa chọn phải có ít nhất 1 đáp án đúng");
        return false;
      }
      answersInput.value = JSON.stringify(choiceAnswers);
      break;
    }
    case "true_false": {
      const correctInput = document.querySelector('input[name="tf-correct"]:checked');
      if (!correctInput) {
        alert("Vui lòng chọn đáp án đúng");
        return false;
      }
      const isTrueCorrect = correctInput.value === "true";
      answersInput.value = JSON.stringify([
        { value: true, isCorrect: isTrueCorrect },
        { value: false, isCorrect: !isTrueCorrect }
      ]);
      break;
    }
    case "fill_in_blank": {
      const textarea = document.getElementById("fill-answers");
      if (!textarea) break;
      const accepted = textarea.value.split("\n").map(s => s.trim()).filter(s => s.length > 0);
      if (accepted.length === 0) {
        alert("Phải có ít nhất 1 đáp án được chấp nhận");
        return false;
      }
      answersInput.value = JSON.stringify({ accepted: accepted });
      break;
    }
    case "matching": {
      const pairs = [];
      const list = document.getElementById("matching-pairs-list");
      if (!list) break;
      
      Array.from(list.children).forEach((div) => {
        const leftInput = div.querySelector(`[name^="match-left-"]`);
        const rightInput = div.querySelector(`[name^="match-right-"]`);
        const left = leftInput ? leftInput.value.trim() : "";
        const right = rightInput ? rightInput.value.trim() : "";
        if (left && right) {
          pairs.push({ left: left, right: right });
        }
      });
      
      if (pairs.length < 2) {
        alert("Phải có ít nhất 2 cặp để nối");
        return false;
      }
      answersInput.value = JSON.stringify({ pairs: pairs });
      break;
    }
  }
  
  return true;
}

// Attach to form submit
document.addEventListener("DOMContentLoaded", function() {
  const form = document.querySelector("form[action*='/questions']");
  if (form) {
    form.addEventListener("submit", function(e) {
      if (!buildAnswersJSON()) {
        e.preventDefault();
        return false;
      }
    });
  }
});
