function checkPasswordStrength(password) {
  const strengthBar = document.querySelector('.password-strength-bar');
  const strengthText = document.querySelector('.password-strength-text');

  if (!strengthBar || !strengthText) return;

  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const levels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  strengthBar.style.width = (strength * 20) + '%';
  strengthBar.style.background = colors[strength - 1] || colors[0];
  strengthText.textContent = levels[strength - 1] || levels[0];
}

document.addEventListener('DOMContentLoaded', function() {
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      checkPasswordStrength(this.value);
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (password !== confirmPassword) {
        e.preventDefault();
        alert('Mật khẩu xác nhận không khớp!');
        document.getElementById('confirmPassword').focus();
        return false;
      }
    });
  }

  const confirmPasswordInput = document.getElementById('confirmPassword');
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
      const password = document.getElementById('password').value;
      const confirmPassword = this.value;

      if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = '#ef4444';
      } else if (confirmPassword && password === confirmPassword) {
        this.style.borderColor = '#22c55e';
      } else {
        this.style.borderColor = '';
      }
    });
  }
});
