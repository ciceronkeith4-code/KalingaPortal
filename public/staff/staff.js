function statusPill(text, className) {
  const span = document.createElement('span');
  span.className = `status-pill ${className}`;
  span.textContent = text;
  return span;
}

function renderDashboardStats() {
  const patients = PatientStore.getAll();
  const allRx = PatientStore.getAllPrescriptions();
  const allSchedule = PatientStore.getAllSchedule();

  const activeEl = document.getElementById('stat-active-patients');
  const pendingRxEl = document.getElementById('stat-pending-rx');
  const archivedEl = document.getElementById('stat-archived-patients');
  const apptEl = document.getElementById('stat-total-appointments');

  if (activeEl) activeEl.textContent = patients.filter((p) => !p.archived).length;
  if (pendingRxEl) pendingRxEl.textContent = allRx.filter((rx) => rx.status === 'requested').length;
  if (archivedEl) archivedEl.textContent = patients.filter((p) => p.archived).length;
  if (apptEl) apptEl.textContent = allSchedule.length;
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
      (p.address && p.address.toLowerCase().includes(q))
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
    nameTd.dataset.label = 'Name';
    nameTd.textContent = patient.name || patient.username || '-';
    nameTd.title = patient.name || patient.username || '-';
    tr.appendChild(nameTd);

    const statusTd = document.createElement('td');
    statusTd.className = 'col-status';
    statusTd.dataset.label = 'Status';
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

    // Archive / Restore button
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
      populatePatientSelects();
      showToast(willArchive ? 'Patient archived.' : 'Patient restored.');
    });
    actionsTd.appendChild(toggleBtn);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

function setupPatientSearchAutocomplete(searchInputId, hiddenInputId, clearBtnId, listContainerId) {
  const searchInput = document.getElementById(searchInputId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const clearBtn = document.getElementById(clearBtnId);
  const listContainer = document.getElementById(listContainerId);
  if (!searchInput || !hiddenInput || !listContainer) return;

  function renderList(query = '') {
    const active = PatientStore.getActive();
    let filtered = active;
    if (query) {
      const q = query.toLowerCase();
      filtered = active.filter((p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q))
      );
    }

    listContainer.innerHTML = '';
    if (filtered.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'patient-autocomplete-empty';
      emptyDiv.textContent = query ? 'No matching patients found' : 'No active patients';
      listContainer.appendChild(emptyDiv);
      listContainer.hidden = false;
      return;
    }

    filtered.forEach((patient) => {
      const item = document.createElement('div');
      item.className = 'patient-autocomplete-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'patient-auto-name';
      nameSpan.textContent = patient.name || patient.username;

      const userSpan = document.createElement('span');
      userSpan.className = 'patient-auto-user';
      userSpan.textContent = `@${patient.username}`;

      item.appendChild(nameSpan);
      item.appendChild(userSpan);

      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectPatient(patient);
      });
      listContainer.appendChild(item);
    });
    listContainer.hidden = false;
  }

  function selectPatient(patient) {
    const label = patient.name ? `${patient.name} (@${patient.username})` : `@${patient.username}`;
    searchInput.value = label;
    hiddenInput.value = patient.id;
    listContainer.hidden = true;
    if (clearBtn) clearBtn.hidden = false;
  }

  searchInput.addEventListener('focus', () => {
    renderList(searchInput.value.trim());
  });

  searchInput.addEventListener('click', () => {
    renderList(searchInput.value.trim());
  });

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (clearBtn) clearBtn.hidden = !val;

    // Check for exact match
    const active = PatientStore.getActive();
    const exactMatch = active.find((p) => {
      const fullLabel = p.name ? `${p.name} (@${p.username})` : `@${p.username}`;
      return fullLabel.toLowerCase() === val.toLowerCase() ||
             (p.username && `@${p.username}`.toLowerCase() === val.toLowerCase()) ||
             (p.name && p.name.toLowerCase() === val.toLowerCase());
    });
    if (exactMatch) {
      hiddenInput.value = exactMatch.id;
    } else {
      hiddenInput.value = '';
    }

    renderList(val);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      listContainer.hidden = true;
    } else if (e.key === 'Enter') {
      const firstItem = listContainer.querySelector('.patient-autocomplete-item');
      if (firstItem && !listContainer.hidden) {
        e.preventDefault();
        firstItem.dispatchEvent(new MouseEvent('mousedown'));
      }
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      hiddenInput.value = '';
      clearBtn.hidden = true;
      listContainer.hidden = true;
      searchInput.focus();
    });
  }

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !listContainer.contains(e.target)) {
      listContainer.hidden = true;
    }
  });
}

function populatePatientSelects(filterQuery = '', targetSelectId = null) {
  // Safe helper kept for compatibility
  const activePatients = PatientStore.getActive();
  [document.getElementById('rx-patient'), document.getElementById('sch-patient')].forEach((select) => {
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '';
    activePatients.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name ? `${p.name} (@${p.username})` : p.username;
      select.appendChild(opt);
    });
    if (activePatients.some((p) => p.id === currentValue)) {
      select.value = currentValue;
    }
  });
}

function renderPrescriptionsTable(searchQuery = '') {
  const tbody = document.getElementById('prescriptions-table-body');
  const emptyEl = document.getElementById('prescriptions-empty');
  const countBadge = document.getElementById('rx-records-count');
  if (!tbody) return;

  // Adds one table cell with safe text
  function addCell(tr, className, label, text) {
    const td = document.createElement('td');
    td.className = className;
    td.dataset.label = label;
    td.textContent = text;
    td.title = text;
    tr.appendChild(td);
  }

  // New-format prescriptions only (with a medicines list), newest first
  let entries = PatientStore.getAllPrescriptions()
    .filter((rx) => Array.isArray(rx.medicines))
    .sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));
  const totalCount = entries.length;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    entries = entries.filter((rx) =>
      (rx.patientName && rx.patientName.toLowerCase().includes(q)) ||
      (rx.doctorName && rx.doctorName.toLowerCase().includes(q)) ||
      rx.dateGiven.includes(q) ||
      rx.medicines.some((m) => m.name.toLowerCase().includes(q))
    );
  }

  if (countBadge) {
    countBadge.textContent = searchQuery
      ? `${entries.length} of ${totalCount} records`
      : `${totalCount} records total`;
  }

  tbody.innerHTML = '';

  if (entries.length === 0) {
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.style.display = 'flex';
      const msgNode = emptyEl.querySelector('.empty-state-msg') || emptyEl.lastChild;
      msgNode.textContent = searchQuery
        ? `No prescriptions found matching "${searchQuery}".`
        : 'No prescriptions yet.';
    }
    return;
  }
  if (emptyEl) {
    emptyEl.hidden = true;
    emptyEl.style.display = 'none';
  }

  entries.forEach((rx) => {
    const tr = document.createElement('tr');
    addCell(tr, 'col-patient', 'Patient', rx.patientName);
    addCell(tr, 'col-date', 'Date given', rx.dateGiven);
    addCell(tr, 'col-doctor', 'Doctor', rx.doctorName);
    addCell(tr, 'col-medicine', 'Medicines', rx.medicines.map((m) => m.name).join(', '));
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
        showAppointmentDetailsModal(entry, 'staff', () => {
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

    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell col-actions';

    if (entry.status === 'requested') {
      const confirmBtn = makeIconRowBtn({ action: 'confirm', label: 'Confirm appointment', extraClass: 'success' });
      confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        PatientStore.confirmAppointment(entry.patientId, entry.id);
        renderScheduleTable();
        renderDashboardStats();
        showToast('Appointment confirmed.');
      });
      actionsTd.appendChild(confirmBtn);
    }

    const detailsBtn = makeIconRowBtn({ action: 'details', label: 'View details' });
    detailsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showAppointmentDetailsModal(entry, 'staff', () => {
        renderScheduleTable();
        renderDashboardStats();
      });
    });
    actionsTd.appendChild(detailsBtn);

    const cancelBtn = makeIconRowBtn({ action: 'cancel', label: 'Cancel appointment', extraClass: 'danger' });
    cancelBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await confirmDialog({
        title: 'Cancel Appointment?',
        message: `Cancel the appointment for ${entry.patientName}?`,
        confirmLabel: 'Yes, Cancel',
        danger: true
      });
      if (ok) {
        PatientStore.cancelAppointment(entry.id);
        renderScheduleTable();
        renderDashboardStats();
        showToast('Appointment cancelled.');
      }
    });
    actionsTd.appendChild(cancelBtn);

    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });

  if (typeof KalingaCalendar !== 'undefined') {
    KalingaCalendar.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderDashboardStats();
  renderPatientsTable();
  populatePatientSelects();
  renderPrescriptionsTable();
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

  // Prescriptions Table Live Search
  const rxSearch = document.getElementById('rx-table-search');
  const rxSearchClear = document.getElementById('rx-table-search-clear');
  if (rxSearch) {
    rxSearch.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (rxSearchClear) rxSearchClear.hidden = !q;
      renderPrescriptionsTable(q);
    });
  }
  if (rxSearchClear) {
    rxSearchClear.addEventListener('click', () => {
      if (rxSearch) {
        rxSearch.value = '';
        rxSearchClear.hidden = true;
        renderPrescriptionsTable('');
        rxSearch.focus();
      }
    });
  }

  // Searchable Patient Autocomplete for Prescription & Schedule Forms
  setupPatientSearchAutocomplete('rx-patient-search', 'rx-patient', 'rx-patient-search-clear', 'rx-patient-autocomplete');
  setupPatientSearchAutocomplete('sch-patient-search', 'sch-patient', 'sch-patient-search-clear', 'sch-patient-autocomplete');

  if (typeof KalingaCalendar !== 'undefined') {
    KalingaCalendar.init({
      container: 'calendar-widget-container',
      role: 'staff',
      onUpdate: () => {
        renderScheduleTable();
        renderDashboardStats();
      }
    });
  }

  const rxForm = document.getElementById('prescription-form');
  if (rxForm) {
        const MAX_MEDICINES = 5;
    const medRows = document.getElementById('rx-med-rows');
    const addMedBtn = document.getElementById('rx-add-med');
    let medRowCount = 0;

    // Today's date as YYYY-MM-DD (local time)
    function rxToday() {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // Adds one empty medicine row (max 5)
    function addMedRow() {
      if (medRows.children.length >= MAX_MEDICINES) return;
      medRowCount += 1;
      const n = medRowCount;
      const row = document.createElement('div');
      row.className = 'rx-med-row';
      row.innerHTML = `
        <div class="form-field rx-med-name-field"><label for="med-name-${n}">Medicine</label><input type="text" id="med-name-${n}" class="med-name" placeholder="e.g. Amoxicillin" required></div>
        <div class="form-field"><label for="med-dose-${n}">Dose</label><input type="number" id="med-dose-${n}" class="med-dose" min="0" step="any" required></div>
        <div class="form-field"><label for="med-unit-${n}">Unit</label><select id="med-unit-${n}" class="med-unit"><option>mg</option><option>ml</option><option>tablet</option></select></div>
        <div class="form-field"><label for="med-times-${n}">Times a day</label><input type="number" id="med-times-${n}" class="med-times" min="1" max="24" required></div>
        <div class="form-field"><label for="med-days-${n}">Days</label><input type="number" id="med-days-${n}" class="med-days" min="1" required></div>
        <div class="form-field rx-med-note-field"><label for="med-note-${n}">Note (optional)</label><input type="text" id="med-note-${n}" class="med-note" placeholder="e.g. After meals"></div>
        <button type="button" class="rx-btn rx-remove-med-btn">Remove this row</button>`;
      row.querySelector('.rx-remove-med-btn').addEventListener('click', () => {
        row.remove();
        updateMedButtons();
      });
      medRows.appendChild(row);
      updateMedButtons();
    }

    // Hide "Remove" when only 1 row is left, and hide "Add" at 5 rows
    function updateMedButtons() {
      const rows = medRows.querySelectorAll('.rx-med-row');
      rows.forEach((r) => { r.querySelector('.rx-remove-med-btn').hidden = rows.length === 1; });
      addMedBtn.hidden = rows.length >= MAX_MEDICINES;
    }

    // Back to one empty row (after saving)
    function resetMedRows() {
      medRows.innerHTML = '';
      addMedRow();
    }

    // Fill the Event list with events staff created
    function fillEventOptions() {
      const select = document.getElementById('rx-event');
      select.length = 1; // keep "None (walk-in)"
      PatientStore.getAllSchedule().forEach((ev) => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = `${ev.reason || 'Health event'} (${ev.date})`;
        select.appendChild(opt);
      });
    }

    addMedBtn.addEventListener('click', addMedRow);
    const rxDateInput = document.getElementById('rx-date');
    rxDateInput.value = rxToday();
    rxDateInput.max = rxToday(); // a prescription can't be given in the future
    fillEventOptions();
    resetMedRows();
    rxForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let patientId = document.getElementById('rx-patient').value;
      const rxSearchInput = document.getElementById('rx-patient-search');

      // If hidden input is empty, attempt auto-matching from the search text
      if (!patientId && rxSearchInput && rxSearchInput.value.trim()) {
        const val = rxSearchInput.value.trim().toLowerCase();
        const active = PatientStore.getActive();
        const match = active.find((p) => {
          const fullLabel = p.name ? `${p.name} (@${p.username})` : `@${p.username}`;
          return fullLabel.toLowerCase().includes(val) ||
                 (p.name && p.name.toLowerCase().includes(val)) ||
                 (p.username && p.username.toLowerCase().includes(val.replace(/^@/, '')));
        });
        if (match) {
          patientId = match.id;
          document.getElementById('rx-patient').value = match.id;
        }
      }

      if (!patientId) {
        showToast('Please search and select a valid active patient.');
        if (rxSearchInput) rxSearchInput.focus();
        return;
      }
            // Collect every medicine row into a list
      const medicines = [...medRows.querySelectorAll('.rx-med-row')].map((row) => ({
        name: row.querySelector('.med-name').value.trim(),
        dose: Number(row.querySelector('.med-dose').value),
        unit: row.querySelector('.med-unit').value,
        timesPerDay: Number(row.querySelector('.med-times').value),
        days: Number(row.querySelector('.med-days').value),
        note: row.querySelector('.med-note').value.trim()
      }));

      const result = PatientStore.createPrescription(patientId, {
        dateGiven: rxDateInput.value,
        doctorName: document.getElementById('rx-doctor').value.trim(),
        eventId: document.getElementById('rx-event').value || null,
        medicines
      });
      if (!result.ok) {
        showToast(result.error);
        return;
      }

      rxForm.reset();
      resetMedRows();
      rxDateInput.value = rxToday();
      if (rxSearchInput) rxSearchInput.value = '';
      document.getElementById('rx-patient').value = '';
      const clearBtn = document.getElementById('rx-patient-search-clear');
      if (clearBtn) clearBtn.hidden = true;

      const curRxSearch = document.getElementById('rx-table-search')?.value.trim() || '';
      renderPrescriptionsTable(curRxSearch);
      renderDashboardStats();
      showToast('Prescription added.');
    });
  }

  const schForm = document.getElementById('schedule-form');
  if (schForm) {
        // Returns today's date as YYYY-MM-DD (local time, not UTC)
    function getToday() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${now.getFullYear()}-${month}-${day}`;
    }

    // Grey out past dates in the date picker
    document.getElementById('sch-date').min = getToday();
    schForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let patientId = document.getElementById('sch-patient').value;
      const schSearchInput = document.getElementById('sch-patient-search');

      // If hidden input is empty, attempt auto-matching from the search text
      if (!patientId && schSearchInput && schSearchInput.value.trim()) {
        const val = schSearchInput.value.trim().toLowerCase();
        const active = PatientStore.getActive();
        const match = active.find((p) => {
          const fullLabel = p.name ? `${p.name} (@${p.username})` : `@${p.username}`;
          return fullLabel.toLowerCase().includes(val) ||
                 (p.name && p.name.toLowerCase().includes(val)) ||
                 (p.username && p.username.toLowerCase().includes(val.replace(/^@/, '')));
        });
        if (match) {
          patientId = match.id;
          document.getElementById('sch-patient').value = match.id;
        }
      }

      if (!patientId) {
        showToast('Please search and select a valid active patient.');
        if (schSearchInput) schSearchInput.focus();
        return;
      }
      const date = document.getElementById('sch-date').value;
      const time = document.getElementById('sch-time').value;
      const reason = document.getElementById('sch-reason').value.trim();
      if (!date || !time) return;
            if (date < getToday()) {
        showToast('Events cannot be set in the past. Please choose today or a future date.');
        return;
      }

      PatientStore.addAppointment(patientId, date, time, reason);
      schForm.reset();
      if (schSearchInput) schSearchInput.value = '';
      document.getElementById('sch-patient').value = '';
      const clearBtn = document.getElementById('sch-patient-search-clear');
      if (clearBtn) clearBtn.hidden = true;

      renderScheduleTable();
      renderDashboardStats();
      showToast('Appointment set.');
    });
  }

  document.addEventListener('kalinga:viewchange', (e) => {
    if (e.detail.view === 'dashboard') renderDashboardStats();
    if (e.detail.view === 'patients') {
      const curPatientsSearch = document.getElementById('patients-table-search')?.value.trim() || '';
      renderPatientsTable(curPatientsSearch);
    }
    if (e.detail.view === 'prescriptions') {
      const curRxSearch = document.getElementById('rx-table-search')?.value.trim() || '';
      renderPrescriptionsTable(curRxSearch);
    }
    if (e.detail.view === 'schedule') {
      renderScheduleTable();
      if (typeof KalingaCalendar !== 'undefined') KalingaCalendar.render();
    }
  });
});
