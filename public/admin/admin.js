function renderDashboardStats() {
  const patients = PatientStore.getAll();
  const totalEl = document.getElementById('stat-total-patients');
  const archivedEl = document.getElementById('stat-archived-patients');
  const apptEl = document.getElementById('stat-total-appointments');

  if (totalEl) totalEl.textContent = patients.length;
  if (archivedEl) archivedEl.textContent = patients.filter((p) => p.archived).length;
  if (apptEl) apptEl.textContent = PatientStore.getAllSchedule().length;
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
    nameTd.textContent = patient.name || '-';
    nameTd.title = patient.name || '-';
    tr.appendChild(nameTd);

    const ageTd = document.createElement('td');
    const hasAge = patient.age !== undefined && patient.age !== null && String(patient.age).trim() !== '';
    ageTd.className = 'col-age' + (!hasAge ? ' table-empty-val' : '');
    ageTd.textContent = hasAge ? patient.age : '-';
    ageTd.title = hasAge ? String(patient.age) : '-';
    tr.appendChild(ageTd);

    const addressTd = document.createElement('td');
    const hasAddress = patient.address && String(patient.address).trim() !== '';
    addressTd.className = 'col-address' + (!hasAddress ? ' table-empty-val' : '');
    addressTd.textContent = hasAddress ? patient.address : '-';
    addressTd.title = hasAddress ? patient.address : '-';
    tr.appendChild(addressTd);

    const usernameTd = document.createElement('td');
    usernameTd.className = 'col-username';
    usernameTd.textContent = patient.username;
    usernameTd.title = patient.username;
    tr.appendChild(usernameTd);

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

    const deleteBtn = makeIconRowBtn({ action: 'delete', label: 'Delete patient', extraClass: 'danger' });
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await confirmDialog({
        title: 'Delete this patient?',
        message: `This will permanently remove ${patient.name || patient.username} and all of their records. This cannot be undone.`,
        confirmLabel: 'Yes, Delete',
        cancelLabel: 'Cancel',
        danger: true
      });
      if (!ok) return;
      PatientStore.remove(patient.id);
      const curSearch = document.getElementById('patients-table-search')?.value.trim() || '';
      renderPatientsTable(curSearch);
      renderDashboardStats();
      showToast('Patient deleted.');
    });
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });
}

function renderScheduleTable() {
  const tbody = document.getElementById('schedule-table-body');
  if (!tbody) return;

  const entries = PatientStore.getAllSchedule();
  tbody.innerHTML = '';

  if (entries.length === 0) {
    if (typeof KalingaCalendar !== 'undefined') KalingaCalendar.render();
    return;
  }

  entries.forEach((entry) => {
    const tr = document.createElement('tr');
    tr.className = 'patient-row-clickable';
    tr.title = 'Click to view appointment details';
    tr.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (typeof showAppointmentDetailsModal === 'function') {
        showAppointmentDetailsModal(entry, 'admin', () => {
          renderScheduleTable();
          renderDashboardStats();
        });
      }
    });

    const patientTd = document.createElement('td');
    patientTd.className = 'col-patient';
    patientTd.dataset.label = 'Patient';
    patientTd.textContent = entry.patientName;
    patientTd.title = entry.patientName;
    tr.appendChild(patientTd);

    const dateTd = document.createElement('td');
    dateTd.className = 'col-date' + (!entry.date ? ' table-empty-val' : '');
    dateTd.dataset.label = 'Date';
    dateTd.textContent = entry.date || '-';
    dateTd.title = entry.date || '-';
    tr.appendChild(dateTd);

    const timeTd = document.createElement('td');
    timeTd.className = 'col-time' + (!entry.time ? ' table-empty-val' : '');
    timeTd.dataset.label = 'Time';
    timeTd.textContent = entry.time || '-';
    timeTd.title = entry.time || '-';
    tr.appendChild(timeTd);

    const reasonTd = document.createElement('td');
    reasonTd.className = 'col-reason' + (!entry.reason ? ' table-empty-val' : '');
    reasonTd.dataset.label = 'Reason';
    reasonTd.textContent = entry.reason || '-';
    reasonTd.title = entry.reason || '-';
    tr.appendChild(reasonTd);

    const statusTd = document.createElement('td');
    statusTd.className = 'col-status';
    statusTd.dataset.label = 'Status';
    statusTd.appendChild(entry.status === 'confirmed' ? statusPill('Confirmed', 'confirmed') : statusPill('Requested', 'requested'));
    tr.appendChild(statusTd);

    tbody.appendChild(tr);
  });

  if (typeof KalingaCalendar !== 'undefined') {
    KalingaCalendar.render();
  }
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
