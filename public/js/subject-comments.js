// Subject Comments - Form Handling
// Handles character counter and loading state for comment form

document.addEventListener("DOMContentLoaded", function () {
  // Character counter for comment textarea
  const commentContent = document.getElementById("commentContent");
  const charCount = document.getElementById("charCount");

  if (commentContent && charCount) {
    function updateCharCount() {
      const length = commentContent.value.length;
      charCount.textContent = `${length}/1000 ký tự`;
      if (length > 900) {
        charCount.style.color = "var(--color-hard)";
      } else if (length > 700) {
        charCount.style.color = "var(--color-medium)";
      } else {
        charCount.style.color = "var(--color-text-muted)";
      }
    }

    commentContent.addEventListener("input", updateCharCount);
    updateCharCount(); // Initial count
  }

  // Loading state when submitting comment
  const commentForm = document.getElementById("commentForm");
  const submitCommentBtn = document.getElementById("submitCommentBtn");

  if (commentForm && submitCommentBtn) {
    commentForm.addEventListener("submit", function (e) {
      submitCommentBtn.disabled = true;
      submitCommentBtn.textContent = "Đang gửi...";
      // Form will submit normally
    });
  }
});

