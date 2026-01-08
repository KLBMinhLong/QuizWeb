function showEditModal(id, name, description) {
  document.getElementById("editForm").action =
    "/admin/subjects/" + id + "/update";
  document.getElementById("editName").value = name;
  document.getElementById("editDescription").value = description;
  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

function showConfigModal(id, easy, medium, hard, duration) {
  document.getElementById("configForm").action =
    "/admin/subjects/" + id + "/update-config";
  document.getElementById("configEasy").value = easy;
  document.getElementById("configMedium").value = medium;
  document.getElementById("configHard").value = hard;
  document.getElementById("configDuration").value = duration;
  document.getElementById("configModal").style.display = "flex";
}

function closeConfigModal() {
  document.getElementById("configModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  const editModal = document.getElementById("editModal");
  const configModal = document.getElementById("configModal");

  if (editModal) {
    editModal.addEventListener("click", function (e) {
      if (e.target === this) closeEditModal();
    });
  }

  if (configModal) {
    configModal.addEventListener("click", function (e) {
      if (e.target === this) closeConfigModal();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeEditModal();
      closeConfigModal();
    }
  });
});

