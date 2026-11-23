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
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (apptEl) apptEl.textContent = EventStore.getUpcoming(todayStr).length;
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
  const event = EventStore.getById(eventId);
  return event ? event.title : '';
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

// How many older prescriptions to show at a time
const OLDER_PAGE_SIZE = 5;
let olderShownCount = OLDER_PAGE_SIZE;

// "2026-11-20" -> "NOVEMBER 2026"
function formatRxMonth(isoDate) {
  const [y, m] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }).toUpperCase();
}

// Saves the prescription photo to the resident's device (after a privacy warning)
async function downloadRxPhoto(rx) {
  const message = 'Your prescription will be saved on this phone or computer. Anyone who uses this device can see it.';
  const ok = typeof confirmDialog === 'function'
    ? await confirmDialog({ title: 'Save to this device?', message, confirmLabel: 'Yes, download' })
    : window.confirm(`Save to this device?\n\n${message}`);
  if (!ok) return;

  const link = document.createElement('a');
  link.href = rx.photo;
  const ext = rx.photo.split('.').pop().split('?')[0] || 'jpg';
  link.download = `prescription-${rx.dateGiven}.${ext}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Prescription downloaded.');
}

// Builds one full prescription card (same design as before)
function buildRxCard(rx, isLatest) {
  const card = makeEl('article', 'rx-card');

  const header = makeEl('div', 'rx-card-header');
  const top = makeEl('div', 'rx-card-top');
  top.appendChild(makeEl('h3', 'rx-card-date', formatRxDate(rx.dateGiven)));
  if (isLatest) top.appendChild(makeEl('span', 'rx-latest-tag', 'Latest'));
  header.appendChild(top);
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
    const printBtn = makeEl('button', 'rx-btn', 'Print photo');
    printBtn.type = 'button';
    printBtn.addEventListener('click', () => printRxPhoto(rx));
    const downloadBtn = makeEl('button', 'rx-btn', 'Download');
    downloadBtn.type = 'button';
    downloadBtn.addEventListener('click', () => downloadRxPhoto(rx));
    actions.append(viewBtn, printBtn, downloadBtn);
    card.appendChild(actions);
  }
  return card;
}

// One short row for an older prescription; tapping it opens the full card
function buildRxRow(rx, index) {
  const wrap = makeEl('div', 'rx-row-wrap');
  const panelId = `rx-panel-${index}`;

  const row = makeEl('button', 'rx-row');
  row.type = 'button';
  row.setAttribute('aria-expanded', 'false');
  row.setAttribute('aria-controls', panelId);
  row.appendChild(makeEl('span', 'rx-row-date', formatRxDate(rx.dateGiven)));
  row.appendChild(makeEl('span', 'rx-row-names', rx.medicines.map((m) => m.name).join(', ')));
  const count = rx.medicines.length;
  row.appendChild(makeEl('span', 'rx-row-count', `${count} ${count === 1 ? 'medicine' : 'medicines'}`));

  const panel = makeEl('div', 'rx-row-panel');
  panel.id = panelId;
  panel.hidden = true;
  panel.appendChild(buildRxCard(rx, false));

  row.addEventListener('click', () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    row.setAttribute('aria-expanded', String(willOpen));
  });

  wrap.append(row, panel);
  return wrap;
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

  // 1. Latest prescription, fully open
  list.appendChild(buildRxCard(entries[0], true));

  // 2. Older prescriptions as short rows, grouped by month
  const older = entries.slice(1);
  let lastMonth = '';
  older.slice(0, olderShownCount).forEach((rx, i) => {
    const month = formatRxMonth(rx.dateGiven);
    if (month !== lastMonth) {
      list.appendChild(makeEl('h3', 'rx-month-heading', month));
      lastMonth = month;
    }
    list.appendChild(buildRxRow(rx, i));
  });

  // 3. "Show older prescriptions" if there are more
  if (older.length > olderShownCount) {
    const moreBtn = makeEl('button', 'rx-btn rx-more-btn', 'Show older prescriptions');
    moreBtn.type = 'button';
    moreBtn.addEventListener('click', () => {
      olderShownCount += OLDER_PAGE_SIZE;
      renderPrescriptions();
    });
    list.appendChild(moreBtn);
  }
}

// "13:30" -> "1:30 PM"
function formatTime12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// How many upcoming events residents see
const MAX_EVENTS_SHOWN = 3;

// Returns "Today", "Tonight" (6 PM or later), "Tomorrow", or "" (no badge)
function getWhenLabel(ev, today) {
  if (ev.date === today) return ev.startTime >= '18:00' ? 'Tonight' : 'Today';
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  return ev.date === tomorrow ? 'Tomorrow' : '';
}

function renderSchedule() {
  const list = document.getElementById('events-list');
  const emptyEl = document.getElementById('events-empty');
  if (!list) return;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const events = EventStore.getUpcoming(today).slice(0, MAX_EVENTS_SHOWN);
  list.innerHTML = '';
  if (emptyEl) emptyEl.hidden = events.length > 0;

  events.forEach((ev) => {
    const [y, m, d] = ev.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    const card = makeEl('article', 'event-card');

    // Big date badge, e.g. "DEC 3" (hidden from screen readers; the full date is read below)
    const badge = makeEl('div', 'event-date-badge');
    badge.setAttribute('aria-hidden', 'true');
    badge.appendChild(makeEl('span', 'event-date-month', dateObj.toLocaleDateString('en-PH', { month: 'short' }).toUpperCase()));
    badge.appendChild(makeEl('span', 'event-date-day', String(d)));
    card.appendChild(badge);

    const body = makeEl('div', 'event-card-body');
    const whenLabel = getWhenLabel(ev, today);
    if (whenLabel) body.appendChild(makeEl('span', 'event-when', whenLabel));
    body.appendChild(makeEl('h3', 'event-title', ev.title));
    if (ev.audience) body.appendChild(makeEl('p', 'event-audience', `For: ${ev.audience}`));
    const fullDate = dateObj.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });
    const time = ev.endTime
      ? `${formatTime12(ev.startTime)} – ${formatTime12(ev.endTime)}`
      : formatTime12(ev.startTime);
    body.appendChild(makeEl('p', 'event-meta', `${fullDate}, ${time}`));
    body.appendChild(makeEl('p', 'event-meta', ev.location));
    if (ev.notes) body.appendChild(makeEl('p', 'event-notes', ev.notes));
    card.appendChild(body);

    list.appendChild(card);
  });

  if (typeof KalingaCalendar !== 'undefined' && KalingaCalendar.container) {
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
