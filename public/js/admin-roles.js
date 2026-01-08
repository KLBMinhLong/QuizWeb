function showCreateModal() {
  document.getElementById('createModal').classList.add('admin-modal--active');
}

function closeCreateModal() {
  document.getElementById('createModal').classList.remove('admin-modal--active');
}

function showEditModal(btn) {
  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const description = btn.dataset.description;

  document.getElementById('editRoleId').value = id;
  document.getElementById('editRoleName').value = name;
  document.getElementById('editRoleDescription').value = description || '';
  document.getElementById('editForm').action = '/admin/roles/' + id + '/update';
  document.getElementById('editModal').classList.add('admin-modal--active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('admin-modal--active');
}

let currentRoleId = null;
let currentClaims = [];
let availablePermissions = [];

function managePermissions(roleId, roleName) {
  currentRoleId = roleId;
  document.getElementById('permissionsRoleName').textContent = roleName;
  document.getElementById('permissionsModal').classList.add('admin-modal--active');
  document.getElementById('permissionsLoading').style.display = 'block';
  document.getElementById('permissionsContent').style.display = 'none';

  fetch(`/admin/roles/${roleId}/claims`)
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        currentClaims = data.claims || [];
        availablePermissions = data.availablePermissions || [];
        renderPermissions(data);
      } else {
        alert('Lỗi: ' + data.message);
        closePermissionsModal();
      }
    })
    .catch(err => {
      console.error('Error loading permissions:', err);
      alert('Lỗi khi tải permissions');
      closePermissionsModal();
    });
}

function renderPermissions(data) {
  document.getElementById('permissionsLoading').style.display = 'none';
  document.getElementById('permissionsContent').style.display = 'block';

  const currentPermsDiv = document.getElementById('currentPermissions');
  if (currentClaims.length === 0) {
    currentPermsDiv.innerHTML = '<p style="color: var(--color-text-muted); width: 100%;">Chưa có permission nào</p>';
  } else {
    currentPermsDiv.innerHTML = currentClaims.map(claim => {
      const perm = availablePermissions.find(p => p.value === claim.claimValue);
      return `
        <span class="admin-badge admin-badge--info" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;">
          ${perm ? perm.label : claim.claimValue}
          <button type="button" onclick="removePermission('${claim._id}')" style="background: none; border: none; color: currentColor; cursor: pointer; padding: 0; font-size: 14px; opacity: 0.7;" title="Xóa permission">✕</button>
        </span>
      `;
    }).join('');
  }

  const select = document.getElementById('permissionSelect');
  const currentValues = currentClaims.map(c => c.claimValue);
  const available = availablePermissions.filter(p => !currentValues.includes(p.value));

  select.innerHTML = '<option value="">-- Chọn permission --</option>' +
    available.map(p => `<option value="${p.value}">${p.label} (${p.value})</option>`).join('');

  const availableDiv = document.getElementById('availablePermissions');
  const byCategory = {};
  availablePermissions.forEach(perm => {
    if (!byCategory[perm.category]) {
      byCategory[perm.category] = [];
    }
    byCategory[perm.category].push(perm);
  });

  availableDiv.innerHTML = Object.keys(byCategory).map(category => {
    const perms = byCategory[category];
    return `
      <div style="border: 1px solid rgba(0,0,0,0.1); border-radius: var(--radius-sm); padding: var(--spacing-md);">
        <h5 style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-text-main); font-size: 14px;">${category}</h5>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${perms.map(perm => {
            const isActive = currentValues.includes(perm.value);
            return `
              <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px;
                background: ${isActive ? 'var(--color-primary-soft)' : 'transparent'};
                color: ${isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)'};
                border: 1px solid ${isActive ? 'var(--color-primary)' : 'rgba(0,0,0,0.1)'};
              ">${perm.label}</span>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function addPermission() {
  const select = document.getElementById('permissionSelect');
  const permissionValue = select.value;

  if (!permissionValue) {
    alert('Vui lòng chọn permission');
    return;
  }

  fetch(`/admin/roles/${currentRoleId}/claims/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `claimType=permission&claimValue=${encodeURIComponent(permissionValue)}`
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        managePermissions(currentRoleId, document.getElementById('permissionsRoleName').textContent);
      } else {
        alert('Lỗi: ' + data.message);
      }
    })
    .catch(err => {
      console.error('Error adding permission:', err);
      alert('Lỗi khi thêm permission');
    });
}

function removePermission(claimId) {
  if (!confirm('Bạn có chắc muốn xóa permission này?')) return;

  fetch(`/admin/roles/${currentRoleId}/claims/${claimId}/remove`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        managePermissions(currentRoleId, document.getElementById('permissionsRoleName').textContent);
      } else {
        alert('Lỗi: ' + data.message);
      }
    })
    .catch(err => {
      console.error('Error removing permission:', err);
      alert('Lỗi khi xóa permission');
    });
}

function closePermissionsModal() {
  document.getElementById('permissionsModal').classList.remove('admin-modal--active');
  currentRoleId = null;
  currentClaims = [];
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.admin-modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('admin-modal--active');
      }
    });
  });
});
