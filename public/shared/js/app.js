const SESSION_KEY = 'kalinga_session';

const ROLE_LABELS = {
  admin: 'Admin',
  staff: 'Staff',
  resident: 'Patient/Resident'
};

const ROLE_BADGES = {
  admin: 'ADMIN',
  staff: 'STAFF',
  resident: 'PATIENT/RESIDENT'
};

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    /* ignore */
  }
}

// ---- Auth guard: bounce back to login if there is no valid session ----
const session = getSession();
if (!session || !session.role) {
  window.location.href = '/index.html';
}

// Icon-only table row action button. The icon itself comes from the
// existing CSS `::before` background keyed off data-action/.danger (see
// dashboard.css), so this just wires up the button shell, a hover tooltip,
// and an accessible name for screen readers - no visible text label.
function makeIconRowBtn({ action, label, extraClass }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'row-btn' + (extraClass ? ' ' + extraClass : '');
  btn.dataset.action = action;
  btn.title = label;
  btn.setAttribute('aria-label', label);
  return btn;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function ordinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatDateTime(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${dayName} ${monthName} ${day}${ordinalSuffix(day)}, ${year} ${hours}:${minutes} ${ampm}`;
}

function updateClock() {
  const el = document.getElementById('current-datetime');
  if (!el) return;
  el.textContent = formatDateTime(new Date());
}

function toggleDropdown(panel, trigger) {
  if (!panel) return;
  const isHidden = panel.hasAttribute('hidden');
  document.querySelectorAll('.dropdown-panel').forEach((p) => p.setAttribute('hidden', ''));
  document.querySelectorAll('[aria-expanded]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  if (isHidden) {
    panel.removeAttribute('hidden');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-panel').forEach((p) => p.setAttribute('hidden', ''));
  document.querySelectorAll('[aria-expanded]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = '';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('width', '20');
  icon.setAttribute('height', '20');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2.5');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20 6 9 17l-5-5');
  icon.appendChild(path);

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

/**
 * Accessible confirmation dialog used in place of window.confirm() for
 * destructive/state-changing actions (delete, archive). Returns a Promise
 * that resolves true/false. Built with textContent (never innerHTML) for
 * any caller-supplied strings since patient names are user-entered data.
 */
function confirmDialog({ title, message, confirmLabel, cancelLabel, danger }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');

    const icon = document.createElement('div');
    icon.className = 'confirm-icon' + (danger ? ' confirm-icon-danger' : '');
    icon.innerHTML = danger
      ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path></svg>'
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';

    const heading = document.createElement('h2');
    heading.textContent = title;

    const body = document.createElement('p');
    body.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'ghost-btn';
    cancelBtn.textContent = cancelLabel || 'Cancel';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = danger ? 'danger-btn' : 'primary-btn';
    okBtn.textContent = confirmLabel || 'Yes, Continue';

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    dialog.appendChild(icon);
    dialog.appendChild(heading);
    dialog.appendChild(body);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    okBtn.focus();

    function cleanup(result) {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
      resolve(result);
    }
    function onKeydown(e) {
      if (e.key === 'Escape') cleanup(false);
    }

    document.addEventListener('keydown', onKeydown);
    cancelBtn.addEventListener('click', () => cleanup(false));
    okBtn.addEventListener('click', () => cleanup(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}

/**
 * Patient Information Modal
 * Displays comprehensive patient details, prescriptions history, and consultation schedule.
 */
function showPatientDetailsModal(patient) {
  if (!patient) return;
  const existing = document.getElementById('patient-details-modal');
  if (existing) existing.remove();

  const prescriptions = (typeof PatientStore !== 'undefined' && PatientStore.getPrescriptions)
    ? PatientStore.getPrescriptions(patient.username)
    : (patient.prescriptions || []);
  const schedule = (typeof PatientStore !== 'undefined' && PatientStore.getSchedule)
    ? PatientStore.getSchedule(patient.username)
    : (patient.schedule || []);

  const overlay = document.createElement('div');
  overlay.id = 'patient-details-modal';
  overlay.className = 'patient-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'patient-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  // Header
  const header = document.createElement('div');
  header.className = 'patient-modal-header';

  const userBlock = document.createElement('div');
  userBlock.className = 'patient-modal-user-block';

  const avatar = document.createElement('div');
  avatar.className = 'patient-modal-avatar';
  avatar.textContent = initials(patient.name || patient.username);

  const nameGroup = document.createElement('div');
  nameGroup.className = 'patient-modal-name-group';
  const nameHeading = document.createElement('h2');
  nameHeading.className = 'patient-modal-name';
  nameHeading.textContent = patient.name || patient.username;

  const metaRow = document.createElement('div');
  metaRow.className = 'patient-modal-meta';

  const userTag = document.createElement('span');
  userTag.className = 'patient-modal-username';
  userTag.textContent = `@${patient.username}`;

  const statusBadge = document.createElement('span');
  statusBadge.className = `status-pill ${patient.archived ? 'archived' : 'active'}`;
  statusBadge.textContent = patient.archived ? 'Archived' : 'Active';

  metaRow.appendChild(userTag);
  metaRow.appendChild(statusBadge);
  nameGroup.appendChild(nameHeading);
  nameGroup.appendChild(metaRow);
  userBlock.appendChild(avatar);
  userBlock.appendChild(nameGroup);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeBtn.addEventListener('click', close);

  header.appendChild(userBlock);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Details Grid
  const grid = document.createElement('div');
  grid.className = 'patient-details-grid';

  const fields = [
    { label: 'Age', value: patient.age ? `${patient.age} years old` : 'Not specified' },
    { label: 'Barangay Address', value: patient.address || 'Not specified' },
    { label: 'System ID', value: patient.id || '-' },
    { label: 'Role & Registry', value: 'Barangay 603 Resident' }
  ];

  fields.forEach(f => {
    const box = document.createElement('div');
    box.className = 'patient-detail-box';
    const lbl = document.createElement('div');
    lbl.className = 'patient-detail-label';
    lbl.textContent = f.label;
    const val = document.createElement('div');
    val.className = 'patient-detail-val';
    val.textContent = f.value;
    box.appendChild(lbl);
    box.appendChild(val);
    grid.appendChild(box);
  });
  modal.appendChild(grid);

  // Prescriptions Section
  const rxSection = document.createElement('div');
  rxSection.className = 'patient-history-section';
  const rxTitle = document.createElement('h3');
  rxTitle.className = 'patient-history-title';
  rxTitle.innerHTML = `Prescriptions Record <span class="patient-history-count">${prescriptions.length}</span>`;
  rxSection.appendChild(rxTitle);

  if (prescriptions.length === 0) {
    const emptyRx = document.createElement('div');
    emptyRx.className = 'patient-history-empty';
    emptyRx.textContent = 'No prescription records logged.';
    rxSection.appendChild(emptyRx);
  } else {
    const rxList = document.createElement('div');
    rxList.className = 'patient-history-list';
    prescriptions.forEach(rx => {
      const item = document.createElement('div');
      item.className = 'patient-history-item';
      const main = document.createElement('div');
      main.className = 'patient-history-item-main';
      const t = document.createElement('div');
      t.className = 'patient-history-item-title';
      t.textContent = rx.medicine;
      const s = document.createElement('div');
      s.className = 'patient-history-item-sub';
      s.textContent = rx.notes ? `Instructions: ${rx.notes}` : 'Standard regimen';
      main.appendChild(t);
      main.appendChild(s);

      const pill = document.createElement('span');
      pill.className = `status-pill ${rx.status === 'fulfilled' ? 'fulfilled' : 'requested'}`;
      pill.textContent = rx.status === 'fulfilled' ? 'Fulfilled' : 'Requested';

      item.appendChild(main);
      item.appendChild(pill);
      rxList.appendChild(item);
    });
    rxSection.appendChild(rxList);
  }
  modal.appendChild(rxSection);

  // Appointments Section
  const schSection = document.createElement('div');
  schSection.className = 'patient-history-section';
  const schTitle = document.createElement('h3');
  schTitle.className = 'patient-history-title';
  schTitle.innerHTML = `Consultations & Schedule <span class="patient-history-count">${schedule.length}</span>`;
  schSection.appendChild(schTitle);

  if (schedule.length === 0) {
    const emptySch = document.createElement('div');
    emptySch.className = 'patient-history-empty';
    emptySch.textContent = 'No clinic appointments scheduled.';
    schSection.appendChild(emptySch);
  } else {
    const schList = document.createElement('div');
    schList.className = 'patient-history-list';
    schedule.forEach(sch => {
      const item = document.createElement('div');
      item.className = 'patient-history-item';
      const main = document.createElement('div');
      main.className = 'patient-history-item-main';
      const t = document.createElement('div');
      t.className = 'patient-history-item-title';
      t.textContent = sch.reason || 'General Consultation';
      const s = document.createElement('div');
      s.className = 'patient-history-item-sub';
      s.textContent = `${sch.date || 'TBD'} · ${sch.time || 'TBD'}`;
      main.appendChild(t);
      main.appendChild(s);

      const pill = document.createElement('span');
      pill.className = `status-pill ${sch.status === 'confirmed' ? 'confirmed' : 'requested'}`;
      pill.textContent = sch.status === 'confirmed' ? 'Confirmed' : 'Requested';

      item.appendChild(main);
      item.appendChild(pill);
      schList.appendChild(item);
    });
    schSection.appendChild(schList);
  }
  modal.appendChild(schSection);

  // Actions Footer
  const actions = document.createElement('div');
  actions.className = 'patient-modal-actions';

  if (session && session.role === 'admin' && typeof openPatientForm === 'function') {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'primary-btn';
    editBtn.textContent = 'Edit Patient Record';
    editBtn.addEventListener('click', () => {
      close();
      openPatientForm(patient);
    });
    actions.appendChild(editBtn);
  }

  const closeFootBtn = document.createElement('button');
  closeFootBtn.type = 'button';
  closeFootBtn.className = 'ghost-btn';
  closeFootBtn.textContent = 'Close';
  closeFootBtn.addEventListener('click', close);
  actions.appendChild(closeFootBtn);

  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

/**
 * Appointment Details Modal
 * Opens when an appointment chip or schedule item is clicked in calendar or list.
 */
function showAppointmentDetailsModal(appt, userRole, onUpdate) {
  if (!appt) return;
  const existing = document.getElementById('appt-details-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'appt-details-modal';
  overlay.className = 'appt-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'appt-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const header = document.createElement('div');
  header.className = 'appt-modal-header';
  const heading = document.createElement('h3');
  heading.textContent = 'Consultation Appointment';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeBtn.addEventListener('click', close);

  header.appendChild(heading);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const body = document.createElement('div');
  body.className = 'appt-modal-body';

  const infoItems = [
    {
      label: 'Patient',
      val: appt.patientName || appt.patientUsername || 'Unknown',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
    },
    {
      label: 'Date & Time',
      val: `${appt.date || 'TBD'} at ${appt.time || 'TBD'}`,
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
    },
    {
      label: 'Reason for Visit',
      val: appt.reason || 'General Consultation',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>'
    },
    {
      label: 'Status',
      val: (appt.status || 'requested').toUpperCase(),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>'
    }
  ];

  infoItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'appt-info-row';
    const ic = document.createElement('div');
    ic.className = 'appt-info-icon';
    ic.innerHTML = item.icon;
    const content = document.createElement('div');
    content.className = 'appt-info-content';
    const lbl = document.createElement('div');
    lbl.className = 'appt-info-label';
    lbl.textContent = item.label;
    const v = document.createElement('div');
    v.className = 'appt-info-val';
    v.textContent = item.val;
    content.appendChild(lbl);
    content.appendChild(v);
    row.appendChild(ic);
    row.appendChild(content);
    body.appendChild(row);
  });
  modal.appendChild(body);

  const actions = document.createElement('div');
  actions.className = 'appt-modal-actions';

  const role = userRole || (session ? session.role : '');
  if ((role === 'staff' || role === 'admin') && appt.status === 'requested') {
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'primary-btn';
    confirmBtn.textContent = 'Confirm Appointment';
    confirmBtn.addEventListener('click', () => {
      if (typeof PatientStore !== 'undefined' && PatientStore.confirmAppointment) {
        PatientStore.confirmAppointment(appt.patientId, appt.id);
        showToast('Appointment confirmed.');
        if (typeof onUpdate === 'function') onUpdate();
        close();
      }
    });
    actions.appendChild(confirmBtn);
  }

  if ((role === 'staff' || role === 'admin') && appt.status !== 'cancelled') {
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'ghost-btn';
    cancelBtn.style.color = 'var(--red-primary)';
    cancelBtn.textContent = 'Cancel Appointment';
    cancelBtn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Cancel appointment?',
        message: `Are you sure you want to cancel the appointment for ${appt.patientName || appt.patientUsername}?`,
        confirmLabel: 'Yes, Cancel Appointment',
        danger: true
      });
      if (ok) {
        if (typeof PatientStore !== 'undefined' && PatientStore.cancelAppointment) {
          PatientStore.cancelAppointment(appt.id);
          showToast('Appointment cancelled.');
          if (typeof onUpdate === 'function') onUpdate();
          close();
        }
      }
    });
    actions.appendChild(cancelBtn);
  }

  const closeFootBtn = document.createElement('button');
  closeFootBtn.type = 'button';
  closeFootBtn.className = 'ghost-btn';
  closeFootBtn.textContent = 'Close';
  closeFootBtn.addEventListener('click', close);
  actions.appendChild(closeFootBtn);

  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

/**
 * Prescription Details & Printable Slip Modal
 */
function showPrescriptionDetailsModal(rx, role, onUpdate) {
  if (!rx) return;
  const existing = document.getElementById('prescription-details-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'prescription-details-modal';
  overlay.className = 'appt-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'appt-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const header = document.createElement('div');
  header.className = 'appt-modal-header';

  const titleGroup = document.createElement('div');
  const title = document.createElement('h3');
  title.className = 'appt-modal-title';
  title.textContent = 'Prescription Details';

  const sub = document.createElement('p');
  sub.className = 'appt-modal-sub';
  sub.textContent = 'Barangay 603 Health Center Dispensary';

  titleGroup.appendChild(title);
  titleGroup.appendChild(sub);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'modal-close-btn';
  closeBtn.setAttribute('aria-label', 'Close modal');
  closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeBtn.addEventListener('click', close);

  header.appendChild(titleGroup);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'appt-modal-body';

  const grid = document.createElement('div');
  grid.className = 'appt-info-grid';

  function addField(label, value, isFullWidth = false, isPill = false) {
    const item = document.createElement('div');
    item.className = 'appt-info-item' + (isFullWidth ? ' appt-info-item--full' : '');
    const lbl = document.createElement('span');
    lbl.className = 'appt-info-label';
    lbl.textContent = label;
    item.appendChild(lbl);

    if (isPill) {
      const pill = document.createElement('span');
      pill.className = `status-pill ${value === 'fulfilled' ? 'fulfilled' : 'requested'}`;
      pill.textContent = value === 'fulfilled' ? 'Fulfilled' : 'Requested';
      item.appendChild(pill);
    } else {
      const val = document.createElement('span');
      val.className = 'appt-info-val';
      val.textContent = value || '-';
      item.appendChild(val);
    }
    grid.appendChild(item);
  }

  addField('Patient', rx.patientName || rx.patientUsername || 'Resident');
  addField('Status', rx.status, false, true);
  addField('Medicine', rx.medicine, true);
  addField('Notes / Dosage', rx.notes || 'As prescribed by doctor', true);
  if (rx.dateFulfilled) {
    addField('Fulfilled Date', new Date(rx.dateFulfilled).toLocaleString(), true);
  }

  body.appendChild(grid);
  modal.appendChild(body);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'appt-modal-actions';

  // Print Slip button
  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.className = 'primary-btn';
  printBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg><span>Print Slip</span>';
  printBtn.addEventListener('click', () => {
    printPrescriptionSlip(rx);
  });
  actions.appendChild(printBtn);

  if ((role === 'staff' || role === 'admin')) {
    if (rx.status === 'requested') {
      const fulfillBtn = document.createElement('button');
      fulfillBtn.type = 'button';
      fulfillBtn.className = 'primary-btn';
      fulfillBtn.style.background = '#065F28';
      fulfillBtn.textContent = 'Fulfill Prescription';
      fulfillBtn.addEventListener('click', async () => {
        const ok = await confirmDialog({
          title: 'Fulfill Prescription?',
          message: `Confirm that ${rx.medicine || 'this medicine'} has been dispensed to ${rx.patientName || 'the patient'}.`,
          confirmLabel: 'Yes, Fulfill'
        });
        if (!ok) return;
        if (typeof PatientStore !== 'undefined' && PatientStore.fulfillPrescription) {
          PatientStore.fulfillPrescription(rx.patientId, rx.id);
          if (typeof showToast === 'function') showToast('Prescription fulfilled.');
          if (typeof onUpdate === 'function') onUpdate();
          close();
        }
      });
      actions.appendChild(fulfillBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'ghost-btn';
    deleteBtn.style.color = 'var(--red-primary)';
    deleteBtn.textContent = 'Remove';
    deleteBtn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Remove Prescription?',
        message: `Are you sure you want to remove this prescription for ${rx.patientName || 'patient'}? This cannot be undone.`,
        confirmLabel: 'Yes, Remove',
        danger: true
      });
      if (ok) {
        if (typeof PatientStore !== 'undefined' && PatientStore.deletePrescription) {
          PatientStore.deletePrescription(rx.patientId, rx.id);
          if (typeof showToast === 'function') showToast('Prescription removed.');
          if (typeof onUpdate === 'function') onUpdate();
          close();
        }
      }
    });
    actions.appendChild(deleteBtn);
  }

  const closeFootBtn = document.createElement('button');
  closeFootBtn.type = 'button';
  closeFootBtn.className = 'ghost-btn';
  closeFootBtn.textContent = 'Close';
  closeFootBtn.addEventListener('click', close);
  actions.appendChild(closeFootBtn);

  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

function printPrescriptionSlip(rx) {
  const printWindow = window.open('', '_blank', 'width=650,height=600');
  if (!printWindow) {
    alert('Please allow popups to print prescription slips.');
    return;
  }
  const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prescription Slip - ${rx.patientName || 'Resident'}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #111827; }
        .header { text-align: center; border-bottom: 2px solid #1B2A80; padding-bottom: 12px; margin-bottom: 24px; }
        .header h1 { margin: 0; color: #1B2A80; font-size: 20px; text-transform: uppercase; }
        .header p { margin: 4px 0 0; color: #4B5563; font-size: 13px; font-weight: 600; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px; }
        .rx-box { border: 1.5px solid #D1D5DB; border-radius: 8px; padding: 20px; background: #F9FAFB; margin-bottom: 24px; }
        .rx-symbol { font-size: 32px; font-weight: bold; font-family: serif; color: #1B2A80; line-height: 1; margin-bottom: 10px; }
        .medicine { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 8px; }
        .notes { font-size: 14px; color: #374151; line-height: 1.5; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; }
        .sig-line { border-top: 1px solid #9CA3AF; width: 200px; text-align: center; padding-top: 6px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Barangay 603 Health Center</h1>
        <p>Metro Manila · Dispensary & Medical Care Services</p>
      </div>
      <div class="info-row">
        <div><strong>Patient:</strong> ${rx.patientName || rx.patientUsername}</div>
        <div><strong>Date:</strong> ${dateStr}</div>
      </div>
      <div class="rx-box">
        <div class="rx-symbol">&#8478;</div>
        <div class="medicine">${rx.medicine}</div>
        <div class="notes"><strong>Instructions:</strong> ${rx.notes || 'Take as directed by health officer.'}</div>
      </div>
      <div class="footer">
        <div>Official Barangay 603 Medical Record Slip</div>
        <div class="sig-line">Attending Health Staff / Officer</div>
      </div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach((v) => v.setAttribute('hidden', ''));
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.removeAttribute('hidden');

  document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  document.dispatchEvent(new CustomEvent('kalinga:viewchange', { detail: { view: viewName } }));
}

document.addEventListener('DOMContentLoaded', () => {
  // Populate profile info from session
  const chipName = document.querySelectorAll('.chip-name');
  const chipRole = document.querySelectorAll('.chip-role');
  const roleBadges = document.querySelectorAll('.role-badge');
  const panelEmail = document.getElementById('panel-email');

  if (session) {
    const roleLabel = ROLE_LABELS[session.role] || 'User';
    const roleBadge = ROLE_BADGES[session.role] || 'USER';

    chipName.forEach((el) => (el.textContent = session.name || session.username));
    chipRole.forEach((el) => (el.textContent = roleLabel));
    roleBadges.forEach((el) => (el.textContent = roleBadge));
    if (panelEmail) panelEmail.textContent = session.username;

    const profileUsername = document.getElementById('profile-username');
    const profileRole = document.getElementById('profile-role');
    if (profileUsername) profileUsername.textContent = session.username;
    if (profileRole) profileRole.textContent = roleLabel;
  }

  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Nav view switching
  document.querySelectorAll('.nav-item[data-view]').forEach((item) => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });

  // Profile dropdown
  const profileChip = document.getElementById('profile-chip');
  const profilePanel = document.getElementById('profile-dropdown');
  if (profileChip && profilePanel) {
    profileChip.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(profilePanel, profileChip);
    });
  }

  // Notification dropdown
  const notifBtn = document.getElementById('notif-btn');
  const notifPanel = document.getElementById('notif-dropdown');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(notifPanel, notifBtn);
    });
  }

  document.addEventListener('click', closeAllDropdowns);
  document.querySelectorAll('.dropdown-panel').forEach((p) => p.addEventListener('click', (e) => e.stopPropagation()));

  // Profile settings link -> switch to profile view
  document.querySelectorAll('[data-action="profile-settings"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeAllDropdowns();
      switchView('profile');
    });
  });

  // Logout
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearSession();
      window.location.href = '/index.html';
    });
  });

  // Placeholder action buttons (no backend yet) -> friendly toast instead of dead click
  document.querySelectorAll('[data-action="not-ready"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('No data yet — this will be available once records are added.');
    });
  });

  // Sidebar Collapse Toggle
  const appContainer = document.querySelector('.app');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const brandHeader = document.querySelector('.brand');
  const SIDEBAR_COLLAPSED_KEY = 'kalinga_sidebar_collapsed';

  function setSidebarCollapsed(collapsed) {
    if (!appContainer) return;
    if (collapsed) {
      appContainer.classList.add('sidebar-collapsed');
      if (sidebarToggleBtn) {
        sidebarToggleBtn.setAttribute('aria-expanded', 'false');
        sidebarToggleBtn.setAttribute('title', 'Expand sidebar');
      }
    } else {
      appContainer.classList.remove('sidebar-collapsed');
      if (sidebarToggleBtn) {
        sidebarToggleBtn.setAttribute('aria-expanded', 'true');
        sidebarToggleBtn.setAttribute('title', 'Collapse sidebar');
      }
    }
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
    } catch (e) {
      /* ignore */
    }
  }

  // Restore previous collapsed state on load
  try {
    if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true') {
      setSidebarCollapsed(true);
    }
  } catch (e) {
    /* ignore */
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCurrentlyCollapsed = appContainer ? appContainer.classList.contains('sidebar-collapsed') : false;
      setSidebarCollapsed(!isCurrentlyCollapsed);
    });
  }

  if (brandHeader) {
    brandHeader.addEventListener('click', () => {
      if (appContainer && appContainer.classList.contains('sidebar-collapsed')) {
        setSidebarCollapsed(false);
      }
    });
  }

  // Default view
  switchView('dashboard');
});
