function statusPill(text, className) {
  const span = document.createElement('span');
  span.className = `status-pill ${className}`;
  span.textContent = text;
  return span;
}

function getMyPatient() {
  if (!session || !session.patientId) return null;
  return PatientStore.getById(session.patientId);
}

function renderDashboardStats() {
  const patient = getMyPatient();
  const rxEl = document.getElementById('stat-my-prescriptions');
  const apptEl = document.getElementById('stat-upcoming-appointments');
  if (rxEl) rxEl.textContent = patient ? patient.prescriptions.length : 0;
  if (apptEl) apptEl.textContent = patient ? patient.schedule.length : 0;
}

function renderPrescriptions() {
  const tbody = document.getElementById('prescriptions-table-body');
  const emptyEl = document.getElementById('prescriptions-empty');
  if (!tbody) return;

  const patient = getMyPatient();
  const entries = patient ? patient.prescriptions : [];
  tbody.innerHTML = '';

  if (entries.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  entries.forEach((rx) => {
    const tr = document.createElement('tr');

    const medTd = document.createElement('td');
    medTd.className = 'col-medicine';
    medTd.dataset.label = 'Medicine';
    medTd.textContent = rx.medicine;
    medTd.title = rx.medicine;
    tr.appendChild(medTd);

    const notesTd = document.createElement('td');
    notesTd.className = 'col-notes' + (!rx.notes ? ' table-empty-val' : '');
    notesTd.dataset.label = 'Notes';
    notesTd.textContent = rx.notes || '-';
    notesTd.title = rx.notes || '-';
    tr.appendChild(notesTd);

    const statusTd = document.createElement('td');
    statusTd.className = 'col-status';
    statusTd.dataset.label = 'Status';
    statusTd.appendChild(rx.status === 'fulfilled' ? statusPill('Fulfilled', 'fulfilled') : statusPill('Requested', 'requested'));
    tr.appendChild(statusTd);

    tbody.appendChild(tr);
  });
}

function renderSchedule() {
  const tbody = document.getElementById('schedule-table-body');
  if (!tbody) return;

  const patient = getMyPatient();
  const entries = patient ? patient.schedule : [];
  tbody.innerHTML = '';

  if (entries.length === 0) {
    if (typeof KalingaCalendar !== 'undefined') KalingaCalendar.render();
    return;
  }

  entries.forEach((entry) => {
    const tr = document.createElement('tr');
    tr.className = 'patient-row-clickable';
    tr.title = 'Click to view appointment details';
    tr.addEventListener('click', () => {
      if (typeof showAppointmentDetailsModal === 'function') {
        showAppointmentDetailsModal(entry, 'resident', () => {
          renderSchedule();
          renderDashboardStats();
        });
      }
    });

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

function renderDetails() {
  const patient = getMyPatient();
  const nameEl = document.getElementById('details-name');
  const ageEl = document.getElementById('details-age');
  const addressEl = document.getElementById('details-address');
  const usernameEl = document.getElementById('details-username');
  if (nameEl) nameEl.textContent = patient && patient.name ? patient.name : '-';
  if (ageEl) ageEl.textContent = patient && patient.age ? patient.age : '-';
  if (addressEl) addressEl.textContent = patient && patient.address ? patient.address : '-';
  if (usernameEl) usernameEl.textContent = patient ? patient.username : '-';
}

document.addEventListener('DOMContentLoaded', () => {
  renderDashboardStats();
  renderPrescriptions();
  renderSchedule();
  renderDetails();

  if (typeof KalingaCalendar !== 'undefined') {
    KalingaCalendar.init({
      container: 'calendar-widget-container',
      role: 'resident',
      onUpdate: () => {
        renderSchedule();
        renderDashboardStats();
      }
    });
  }

  const rxForm = document.getElementById('rx-request-form');
  if (rxForm) {
    rxForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const patient = getMyPatient();
      if (!patient) return;
      const medicine = document.getElementById('rx-request-medicine').value.trim();
      const notes = document.getElementById('rx-request-notes').value.trim();
      if (!medicine) return;

      PatientStore.requestPrescription(patient.id, medicine, notes);
      rxForm.reset();
      renderPrescriptions();
      renderDashboardStats();
      showToast('Prescription requested.');
    });
  }
 

  document.addEventListener('kalinga:viewchange', (e) => {
    if (e.detail.view === 'dashboard') renderDashboardStats();
    if (e.detail.view === 'prescriptions') renderPrescriptions();
    if (e.detail.view === 'schedule') {
      renderSchedule();
      if (typeof KalingaCalendar !== 'undefined') KalingaCalendar.render();
    }
    if (e.detail.view === 'details') renderDetails();
  });
});
