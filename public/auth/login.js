const STATIC_ACCOUNTS = {
  'admin.kalinga': { password: 'kalingaadmin', role: 'admin', name: 'Admin Kalinga' },
  'staff.kalinga': { password: 'kalingastaff123', role: 'staff', name: 'Staff Kalinga' }
};

const SESSION_KEY = 'kalinga_session';

function dashboardUrlForRole(role) {
  if (role === 'admin') return '/admin/admin-dashboard.html';
  if (role === 'staff') return '/staff/staff-dashboard.html';
  return '/resident/resident-dashboard.html';
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setSession(username, role, name, patientId) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      username: username,
      role: role,
      name: name,
      patientId: patientId || null
    }));
  } catch (e) {
    /* sessionStorage unavailable, continue without persistence */
  }
}

(function redirectIfLoggedIn() {
  const session = getSession();
  if (session && session.role) {
    window.location.href = dashboardUrlForRole(session.role);
  }
})();

const toggleCheckbox = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');

if (toggleCheckbox && passwordInput) {
  toggleCheckbox.addEventListener('change', () => {
    passwordInput.type = toggleCheckbox.checked ? 'text' : 'password';
  });
}

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const errorEl = document.getElementById('login-error');
const submitBtn = document.getElementById('submit-btn') || document.querySelector('.sign-in-btn');

function setSubmitLoading(isLoading) {
  if (!submitBtn) return;
  submitBtn.disabled = isLoading;
  if (isLoading) {
    submitBtn.innerHTML = '<span>SIGNING IN...</span>';
  } else {
    submitBtn.innerHTML = '<span>SIGN IN</span><svg class="btn-arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
  }
}

function showError(message) {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
  // Re-trigger the pop-out animation smoothly even on consecutive errors
  errorEl.style.animation = 'none';
  void errorEl.offsetHeight;
  errorEl.style.animation = '';
  setSubmitLoading(false);
}

function clearError() {
  if (!errorEl) return;
  errorEl.hidden = true;
  errorEl.textContent = '';
}

if (loginForm && usernameInput && passwordInput) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showError('Please enter both your username and password.');
      return;
    }

    setSubmitLoading(true);

    const staticAccount = STATIC_ACCOUNTS[username];
    if (staticAccount) {
      if (staticAccount.password !== password) {
        showError('Wrong username or password. Please try again.');
        passwordInput.value = '';
        passwordInput.focus();
        return;
      }
      setSession(username, staticAccount.role, staticAccount.name);
      window.location.href = dashboardUrlForRole(staticAccount.role);
      return;
    }

    const patient = typeof PatientStore !== 'undefined' ? PatientStore.getByUsername(username) : null;
    if (!patient) {
      showError('Wrong username or password. Please try again.');
      passwordInput.value = '';
      passwordInput.focus();
      return;
    }
    if (patient.archived) {
      showError('This account has been deactivated or archived. Please contact the barangay office.');
      passwordInput.value = '';
      setSubmitLoading(false);
      return;
    }
    if (patient.password !== password) {
      showError('Wrong username or password. Please try again.');
      passwordInput.value = '';
      passwordInput.focus();
      return;
    }

    setSession(username, 'resident', patient.name || username, patient.id);
    window.location.href = dashboardUrlForRole('resident');
  });
}

// Replay entrance animations if restored from bfcache
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    const animElements = document.querySelectorAll(
      '.top-nav, .hero-headline, .hero-description, .input-field-group, .form-aux-row, .sign-in-btn'
    );
    animElements.forEach((el) => {
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
    });
  }
});

