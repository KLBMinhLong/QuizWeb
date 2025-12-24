// Admin Questions Form Handler

document.addEventListener("DOMContentLoaded", function() {
  const typeSelect = document.getElementById("type");
  const answersContainer = document.getElementById("answers-container");
  
  if (typeSelect && answersContainer) {
    typeSelect.addEventListener("change", function() {
      updateAnswersFields(this.value);
    });
    
    // Initialize on page load
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
    <label class="form-label">Các lựa chọn:</label>
    <div id="choice-answers-list"></div>
    <button type="button" class="btn" onclick="addChoiceAnswer()" style="margin-top: 0.5rem;">Thêm lựa chọn</button>
  `;
  
  const list = document.getElementById("choice-answers-list");
  addChoiceAnswer(); // Add first option
  addChoiceAnswer(); // Add second option
}

function addChoiceAnswer() {
  const list = document.getElementById("choice-answers-list");
  if (!list) return;
  
  const index = list.children.length;
  const div = document.createElement("div");
  div.className = "form-group";
  div.style.display = "flex";
  div.style.gap = "0.5rem";
  div.style.alignItems = "center";
  div.style.marginBottom = "0.5rem";
  div.innerHTML = `
    <input type="text" name="choice-text-${index}" placeholder="Nội dung đáp án" class="form-input" style="flex: 1;" />
    <input type="checkbox" name="choice-correct-${index}" />
    <label style="white-space: nowrap;">Đúng</label>
    <button type="button" class="btn" onclick="this.parentElement.remove()" style="padding: 0.4rem 0.8rem;">Xóa</button>
  `;
  list.appendChild(div);
}

function renderTrueFalseAnswers(container) {
  container.innerHTML = `
    <label class="form-label">Chọn đáp án đúng:</label>
    <div class="form-group">
      <label><input type="radio" name="tf-correct" value="true" /> Đúng</label>
      <label style="margin-left: 1rem;"><input type="radio" name="tf-correct" value="false" /> Sai</label>
    </div>
  `;
}

function renderFillInBlankAnswers(container) {
  container.innerHTML = `
    <label class="form-label">Các đáp án được chấp nhận (mỗi đáp án một dòng):</label>
    <textarea id="fill-answers" name="fill-answers" class="form-textarea" rows="5" placeholder="đáp án 1&#10;đáp án 2&#10;đáp án 3"></textarea>
  `;
}

function renderMatchingAnswers(container) {
  container.innerHTML = `
    <label class="form-label">Các cặp để nối:</label>
    <div id="matching-pairs-list"></div>
    <button type="button" class="btn" onclick="addMatchingPair()" style="margin-top: 0.5rem;">Thêm cặp</button>
  `;
  
  const list = document.getElementById("matching-pairs-list");
  addMatchingPair(); // Add first pair
  addMatchingPair(); // Add second pair
}

function addMatchingPair() {
  const list = document.getElementById("matching-pairs-list");
  if (!list) return;
  
  const index = list.children.length;
  const div = document.createElement("div");
  div.className = "form-group";
  div.style.display = "grid";
  div.style.gridTemplateColumns = "1fr 1fr auto";
  div.style.gap = "0.5rem";
  div.style.alignItems = "center";
  div.style.marginBottom = "0.5rem";
  div.innerHTML = `
    <input type="text" name="match-left-${index}" placeholder="Bên trái" class="form-input" />
    <input type="text" name="match-right-${index}" placeholder="Bên phải" class="form-input" />
    <button type="button" class="btn" onclick="this.parentElement.remove()" style="padding: 0.4rem 0.8rem;">Xóa</button>
  `;
  list.appendChild(div);
}

// Build answers JSON before form submit
function buildAnswersJSON() {
  const type = document.getElementById("type").value;
  const answersInput = document.getElementById("answers-json");
  
  let answers = null;
  
  switch(type) {
    case "single_choice":
    case "multiple_choice": {
      const choiceAnswers = [];
      const inputs = document.querySelectorAll('[name^="choice-text-"]');
      inputs.forEach((input, index) => {
        const text = input.value.trim();
        if (text) {
          const correctInput = document.querySelector(`[name="choice-correct-${index}"]`);
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
      const leftInputs = document.querySelectorAll('[name^="match-left-"]');
      leftInputs.forEach((input, index) => {
        const left = input.value.trim();
        const rightInput = document.querySelector(`[name="match-right-${index}"]`);
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

