function renderDashboardStats() {
  const patients = PatientStore.getAll();
  const totalEl = document.getElementById('stat-total-patients');
  const archivedEl = document.getElementById('stat-archived-patients');
  const apptEl = document.getElementById('stat-total-appointments');

  if (totalEl) totalEl.textContent = patients.length;
  if (archivedEl) archivedEl.textContent = patients.filter((p) => p.archived).length;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (apptEl) apptEl.textContent = EventStore.getUpcoming(todayStr).length;
}

function statusPill(text, className) {
  const span = document.createElement('span');
  span.className = `status-pill ${className}`;
  span.textContent = text;
  return span;
}

let patientsActiveTab = 'active';

function renderPatientsTable(searchQuery = '') {
  const tbody = document.getElementById('patients-table-body');
  const emptyEl = document.getElementById('patients-empty');
  const countBadge = document.getElementById('patients-records-count');
  const activeCountEl = document.getElementById('patients-tab-count-active');
  const archivedCountEl = document.getElementById('patients-tab-count-archived');
  if (!tbody) return;

  const allPatients = PatientStore.getAll();
  if (activeCountEl) activeCountEl.textContent = allPatients.filter((p) => !p.archived).length;
  if (archivedCountEl) archivedCountEl.textContent = allPatients.filter((p) => p.archived).length;

  let patients = allPatients.filter((p) => (patientsActiveTab === 'archived' ? p.archived : !p.archived));
  const totalCount = patients.length;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    patients = patients.filter((p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.age !== undefined && String(p.age).includes(q))
    );
  }

  if (countBadge) {
    if (searchQuery) {
      countBadge.textContent = `${patients.length} of ${totalCount} ${patientsActiveTab} patients`;
    } else {
      countBadge.textContent = `${totalCount} ${patientsActiveTab} patient${totalCount === 1 ? '' : 's'}`;
    }
  }

  tbody.innerHTML = '';

  if (patients.length === 0) {
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.style.display = 'flex';
      const msgNode = emptyEl.querySelector('.empty-state-msg') || emptyEl.lastChild;
      if (searchQuery) {
        msgNode.textContent = `No patients found matching "${searchQuery}".`;
      } else {
        msgNode.textContent = patientsActiveTab === 'archived' ? 'No archived patients.' : 'No active patients.';
      }
    }
    return;
  }

  if (emptyEl) {
    emptyEl.hidden = true;
    emptyEl.style.display = 'none';
  }

  patients.forEach((patient) => {
    const tr = document.createElement('tr');
    tr.className = 'patient-row-clickable';
    tr.title = 'Click to view complete patient details';
    tr.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      showPatientDetailsModal(patient);
    });

    const nameTd = document.createElement('td');
    nameTd.className = 'col-name' + (!patient.name ? ' table-empty-val' : '');
    nameTd.textContent = patient.name || patient.username || '-';
    nameTd.title = patient.name || patient.username || '-';
    tr.appendChild(nameTd);

    const statusTd = document.createElement('td');
    statusTd.className = 'col-status';
    statusTd.appendChild(patient.archived ? statusPill('Archived', 'archived') : statusPill('Active', 'active'));
    tr.appendChild(statusTd);

    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell col-actions';

    // Details button
    const detailsBtn = makeIconRowBtn({ action: 'details', label: 'View details' });
    detailsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showPatientDetailsModal(patient);
    });
    actionsTd.appendChild(detailsBtn);

    const editBtn = makeIconRowBtn({ action: 'edit', label: 'Edit patient' });
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPatientForm(patient);
    });
    actionsTd.appendChild(editBtn);

    const toggleBtn = makeIconRowBtn({
      action: patient.archived ? 'unarchive' : 'archive',
      label: patient.archived ? 'Unarchive' : 'Archive'
    });
    toggleBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const willArchive = !patient.archived;
      const ok = await confirmDialog({
        title: willArchive ? 'Archive this patient?' : 'Restore this patient?',
        message: willArchive
          ? `${patient.name || patient.username} will no longer be able to log in until restored. Their records are kept.`
          : `${patient.name || patient.username} will be able to log in again.`,
        confirmLabel: willArchive ? 'Yes, Archive' : 'Yes, Restore',
        cancelLabel: 'Cancel',
        danger: willArchive
      });
      if (!ok) return;
      PatientStore.setArchived(patient.id, willArchive);
      const curSearch = document.getElementById('patients-table-search')?.value.trim() || '';
      renderPatientsTable(curSearch);
      renderDashboardStats();
      showToast(willArchive ? 'Patient archived.' : 'Patient restored.');
    });
    actionsTd.appendChild(toggleBtn);



    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });
}

// "13:30" -> "1:30 PM"
function formatTime12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function renderScheduleTable() {
  const tbody = document.getElementById('schedule-table-body');
  if (!tbody) return;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const all = EventStore.getAll();
  // Upcoming first (soonest on top), then past events (most recent first)
  const upcoming = all.filter((ev) => ev.date >= today);
  const past = all.filter((ev) => ev.date < today).reverse();
  const entries = upcoming.concat(past);

  tbody.innerHTML = '';

  if (entries.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'table-empty-val';
    td.textContent = 'No events yet.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  entries.forEach((ev) => {
    const tr = document.createElement('tr');
    if (ev.date < today) tr.className = 'event-row--past';
    const time = ev.endTime
      ? `${formatTime12(ev.startTime)} – ${formatTime12(ev.endTime)}`
      : formatTime12(ev.startTime);
    const cells = [
      ['col-date', 'Date', ev.date],
      ['col-time', 'Time', time],
      ['col-reason', 'Event', ev.title],
      ['col-location', 'Location', ev.location],
      ['col-audience', 'Who should attend', ev.audience || '-']
    ];
    cells.forEach(([className, label, text]) => {
      const td = document.createElement('td');
      td.className = className;
      td.dataset.label = label;
      td.textContent = text;
      td.title = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  if (typeof KalingaCalendar !== 'undefined') KalingaCalendar.render();
}

function openPatientForm(patient) {
  const form = document.getElementById('patient-form');
  const title = document.getElementById('patient-form-title');
  const idField = document.getElementById('patient-form-id');
  const nameField = document.getElementById('patient-name');
  const ageField = document.getElementById('patient-age');
  const addressField = document.getElementById('patient-address');
  const usernameField = document.getElementById('patient-username');
  const passwordField = document.getElementById('patient-password');
  const errorEl = document.getElementById('patient-form-error');
  if (!form) return;

  errorEl.hidden = true;
  errorEl.textContent = '';

  if (patient) {
    title.textContent = 'Edit Patient';
    idField.value = patient.id;
    nameField.value = patient.name || '';
    ageField.value = patient.age || '';
    addressField.value = patient.address || '';
    usernameField.value = patient.username || '';
    passwordField.value = '';
    passwordField.placeholder = 'Leave blank to keep current password';
  } else {
    title.textContent = 'Add Patient';
    idField.value = '';
    nameField.value = '';
    ageField.value = '';
    addressField.value = '';
    usernameField.value = '';
    passwordField.value = '';
    passwordField.placeholder = '';
  }

  form.hidden = false;
  nameField.focus();
}

function closePatientForm() {
  const form = document.getElementById('patient-form');
  if (form) form.hidden = true;
}

document.addEventListener('DOMContentLoaded', () => {
  renderDashboardStats();
  renderPatientsTable();
  renderScheduleTable();

  // Patients Table Live Search
  const patientsSearch = document.getElementById('patients-table-search');
  const patientsSearchClear = document.getElementById('patients-table-search-clear');
  if (patientsSearch) {
    patientsSearch.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (patientsSearchClear) patientsSearchClear.hidden = !q;
      renderPatientsTable(q);
    });
  }
  if (patientsSearchClear) {
    patientsSearchClear.addEventListener('click', () => {
      if (patientsSearch) {
        patientsSearch.value = '';
        patientsSearchClear.hidden = true;
        renderPatientsTable('');
        patientsSearch.focus();
      }
    });
  }

  // Patients Active / Archived Tabs
  const patientsTabs = document.getElementById('patients-view-tabs');
  if (patientsTabs) {
    patientsTabs.querySelectorAll('.view-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        patientsActiveTab = btn.dataset.tab;
        patientsTabs.querySelectorAll('.view-tab-btn').forEach((b) => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        renderPatientsTable(patientsSearch?.value.trim() || '');
      });
    });
  }

  if (typeof KalingaCalendar !== 'undefined') {
    KalingaCalendar.init({
      container: 'calendar-widget-container',
      role: 'admin',
      onUpdate: () => {
        renderScheduleTable();
        renderDashboardStats();
      }
    });
  }

  const addBtn = document.getElementById('add-patient-btn');
  if (addBtn) addBtn.addEventListener('click', () => openPatientForm(null));

  const cancelBtn = document.getElementById('patient-form-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', closePatientForm);

  const form = document.getElementById('patient-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('patient-form-error');
      errorEl.hidden = true;

      const id = document.getElementById('patient-form-id').value;
      const name = document.getElementById('patient-name').value.trim();
      const age = document.getElementById('patient-age').value;
      const address = document.getElementById('patient-address').value.trim();
      const username = document.getElementById('patient-username').value.trim();
      const password = document.getElementById('patient-password').value;

      let result;
      if (id) {
        result = PatientStore.updateProfile(id, { username, name, age, address, password });
      } else {
        if (!password) {
          errorEl.textContent = 'Password is required for a new account.';
          errorEl.hidden = false;
          return;
        }
        result = PatientStore.create({ username, password, name, age, address });
      }

      if (!result.ok) {
        errorEl.textContent = result.error || 'Something went wrong.';
        errorEl.hidden = false;
        return;
      }

      closePatientForm();
      const curSearch = document.getElementById('patients-table-search')?.value.trim() || '';
      renderPatientsTable(curSearch);
      renderDashboardStats();
      showToast(id ? 'Patient updated.' : 'Patient account created.');
    });
  }

  document.addEventListener('kalinga:viewchange', (e) => {
    if (e.detail.view === 'patients') {
      const curSearch = document.getElementById('patients-table-search')?.value.trim() || '';
      renderPatientsTable(curSearch);
    }
    if (e.detail.view === 'schedule') {
      renderScheduleTable();
      if (typeof KalingaCalendar !== 'undefined') KalingaCalendar.render();
    }
    if (e.detail.view === 'dashboard') renderDashboardStats();
  });
});
