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

// Small helper: create an element with a class and (safe) text
function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// "2026-11-20" -> "Nov 20, 2026"
function formatRxDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Find the event's name from its id (empty if walk-in or not found)
function getEventName(eventId) {
  if (!eventId) return '';
  const event = PatientStore.getAllSchedule().find((s) => s.id === eventId);
  return event ? (event.reason || 'Health event') : '';
}

// One number box, e.g. label "Dose", value "500 mg"
function makeNumBox(label, value) {
  const box = makeEl('div', 'rx-num');
  box.appendChild(makeEl('span', 'rx-num-label', label));
  box.appendChild(makeEl('span', 'rx-num-value', value));
  return box;
}

// Opens the prescription photo in a pop-up window inside the page
function openRxPhoto(rx) {
  const title = `Prescription photo, ${formatRxDate(rx.dateGiven)}`;
  const dialog = makeEl('dialog', 'rx-photo-dialog');
  dialog.setAttribute('aria-label', title);
  dialog.appendChild(makeEl('h3', 'rx-photo-title', title));

  const img = makeEl('img', 'rx-photo-img');
  img.src = rx.photo;
  img.alt = `Photo of the signed prescription from ${rx.doctorName}`;
  dialog.appendChild(img);

  const closeBtn = makeEl('button', 'rx-btn', 'Close');
  closeBtn.type = 'button';
  closeBtn.addEventListener('click', () => dialog.close());
  dialog.appendChild(closeBtn);

  dialog.addEventListener('close', () => dialog.remove());
  document.body.appendChild(dialog);
  dialog.showModal();
}

// Opens a clean print page with the prescription photo, then prints it
function printRxPhoto(rx) {
  const win = window.open('', '_blank');
  if (!win) {
    showToast('Please allow pop-ups so the prescription can be printed.');
    return;
  }
  const doc = win.document;
  const patient = getMyPatient();
  const patientName = patient ? (patient.name || patient.username) : '';
  doc.title = `Prescription - ${formatRxDate(rx.dateGiven)}`;

  const style = doc.createElement('style');
  style.textContent = `
    @page { margin: 15mm; }
    body { font-family: Arial, sans-serif; color: #000; margin: 0; }
    .head { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
    .head p { margin: 2px 0; }
    img { display: block; max-width: 100%; max-height: 210mm; margin: 0 auto; }
    .foot { display: flex; justify-content: space-between; border-top: 1px solid #999; margin-top: 16px; padding-top: 6px; font-size: 11px; color: #444; }
  `;
  doc.head.appendChild(style);

  const head = makeEl('div', 'head');
  const left = makeEl('div');
  left.appendChild(makeEl('p', '', 'Barangay 386 Health Center'));
  left.appendChild(makeEl('p', '', 'Quiapo, Manila'));
  const right = makeEl('div');
  right.appendChild(makeEl('p', '', `Patient: ${patientName}`));
  right.appendChild(makeEl('p', '', `Date given: ${formatRxDate(rx.dateGiven)}`));
  head.append(left, right);

  const img = makeEl('img');
  img.alt = `Signed prescription from ${rx.doctorName}`;

  const foot = makeEl('div', 'foot');
  foot.appendChild(makeEl('span', '', `Printed from Alaga Portal on ${new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`));
  foot.appendChild(makeEl('span', '', `Ref no. ${rx.id}`));

  doc.body.append(head, img, foot);

  // Print only after the photo has finished loading, then close the tab
  img.addEventListener('load', () => {
    win.focus();
    win.print();
  });
  win.addEventListener('afterprint', () => win.close());
  img.src = new URL(rx.photo, window.location.href).href;
}

function renderPrescriptions() {
  const list = document.getElementById('prescriptions-list');
  const emptyEl = document.getElementById('prescriptions-empty');
  if (!list) return;

  const patient = getMyPatient();
  // Only new-format prescriptions (with a medicines list), newest first
  const entries = (patient ? patient.prescriptions : [])
    .filter((rx) => Array.isArray(rx.medicines))
    .sort((a, b) => b.dateGiven.localeCompare(a.dateGiven));
  list.innerHTML = '';

  if (entries.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  entries.forEach((rx) => {
    const card = makeEl('article', 'rx-card');

    const header = makeEl('div', 'rx-card-header');
    header.appendChild(makeEl('h3', 'rx-card-date', formatRxDate(rx.dateGiven)));
    header.appendChild(makeEl('p', 'rx-card-meta', `Prescribed by ${rx.doctorName}`));
    const eventName = getEventName(rx.eventId);
    if (eventName) header.appendChild(makeEl('p', 'rx-card-meta', `From event: ${eventName}`));
    card.appendChild(header);

    const medList = makeEl('ol', 'rx-med-list');
    rx.medicines.forEach((med) => {
      const item = makeEl('li', 'rx-med');
      item.appendChild(makeEl('p', 'rx-med-name', med.name));
      const nums = makeEl('div', 'rx-med-numbers');
      nums.appendChild(makeNumBox('Dose', `${med.dose} ${med.unit}`));
      nums.appendChild(makeNumBox('Times a day', `${med.timesPerDay}x`));
      nums.appendChild(makeNumBox('For how long', `${med.days} days`));
      item.appendChild(nums);
      if (med.note) item.appendChild(makeEl('p', 'rx-med-note', med.note));
      medList.appendChild(item);
    });
    card.appendChild(medList);

        // Only show photo buttons if this prescription has a photo
    if (rx.photo) {
      const actions = makeEl('div', 'rx-card-actions');
      const viewBtn = makeEl('button', 'rx-btn', 'View photo');
      viewBtn.type = 'button';
      viewBtn.addEventListener('click', () => openRxPhoto(rx));
      actions.appendChild(viewBtn);
            const printBtn = makeEl('button', 'rx-btn', 'Print photo');
      printBtn.type = 'button';
      printBtn.addEventListener('click', () => printRxPhoto(rx));
      actions.appendChild(printBtn);
      card.appendChild(actions);
    }
    list.appendChild(card);
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
