/**
 * Shared client-side data layer for patient/resident records.
 * Persisted in localStorage since this prototype has no backend yet.
 */

const PATIENTS_KEY = 'kalinga_patients';

// Usernames reserved for the fixed admin/staff logins (see script.js STATIC_ACCOUNTS).
// Kept in sync manually since this file loads on pages that don't load script.js.
const RESERVED_USERNAMES = ['admin.kalinga', 'staff.kalinga'];

const DEFAULT_PATIENTS = [
  {
    id: 'p-seed-1',
    username: 'user.kalinga',
    password: 'kalinga123',
    name: 'Resident Kalinga',
    age: '',
    address: '',
    archived: false,
    prescriptions: [],
    schedule: []
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function loadPatients() {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    if (!raw) {
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(DEFAULT_PATIENTS));
      return clone(DEFAULT_PATIENTS);
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(DEFAULT_PATIENTS);
  } catch (e) {
    return clone(DEFAULT_PATIENTS);
  }
}

function savePatients(patients) {
  try {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  } catch (e) {
    /* localStorage unavailable, changes stay in-memory for this call only */
  }
}

const PatientStore = {
  getAll() {
    return loadPatients();
  },

  getActive() {
    return loadPatients().filter((p) => !p.archived);
  },

  getById(id) {
    return loadPatients().find((p) => p.id === id) || null;
  },

  getByUsername(username) {
    return loadPatients().find((p) => p.username === username) || null;
  },

  create({ username, password, name, age, address }) {
    const patients = loadPatients();
    const cleanUsername = (username || '').trim();
    if (!cleanUsername || !password || !name) {
      return { ok: false, error: 'Name, username, and password are required.' };
    }
    if (RESERVED_USERNAMES.includes(cleanUsername) || patients.some((p) => p.username === cleanUsername)) {
      return { ok: false, error: 'That username is already taken.' };
    }
    const patient = {
      id: genId('p'),
      username: cleanUsername,
      password,
      name,
      age: age || '',
      address: address || '',
      archived: false,
      prescriptions: [],
      schedule: []
    };
    patients.push(patient);
    savePatients(patients);
    return { ok: true, patient };
  },

  // Admin only: profile fields + password.
  updateProfile(id, { username, name, age, address, password }) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === id);
    if (!patient) return { ok: false, error: 'Patient not found.' };

    const cleanUsername = (username || '').trim();
    if (cleanUsername && cleanUsername !== patient.username) {
      if (RESERVED_USERNAMES.includes(cleanUsername) || patients.some((p) => p.username === cleanUsername && p.id !== id)) {
        return { ok: false, error: 'That username is already taken.' };
      }
      patient.username = cleanUsername;
    }
    if (name) patient.name = name;
    if (age !== undefined) patient.age = age;
    if (address !== undefined) patient.address = address;
    if (password) patient.password = password;

    savePatients(patients);
    return { ok: true, patient };
  },

  // Admin only: permanently delete.
  remove(id) {
    const patients = loadPatients().filter((p) => p.id !== id);
    savePatients(patients);
    return { ok: true };
  },

  // Staff only: soft-suspend / restore access, profile data kept intact.
  setArchived(id, archived) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === id);
    if (!patient) return { ok: false, error: 'Patient not found.' };
    patient.archived = archived;
    savePatients(patients);
    return { ok: true, patient };
  },

  // Resident: request a prescription.
  requestPrescription(patientId, medicine, notes) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { ok: false, error: 'Patient not found.' };
    patient.prescriptions.push({
      id: genId('rx'),
      medicine,
      notes: notes || '',
      status: 'requested',
      dateRequested: new Date().toISOString(),
      dateFulfilled: null
    });
    savePatients(patients);
    return { ok: true };
  },

  // Staff: add a prescription directly (already fulfilled) or fulfill an existing request.
  addPrescription(patientId, medicine, notes) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { ok: false, error: 'Patient not found.' };
    patient.prescriptions.push({
      id: genId('rx'),
      medicine,
      notes: notes || '',
      status: 'fulfilled',
      dateRequested: new Date().toISOString(),
      dateFulfilled: new Date().toISOString()
    });
    savePatients(patients);
    return { ok: true };
  },

  fulfillPrescription(patientId, prescriptionId) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { ok: false, error: 'Patient not found.' };
    const rx = patient.prescriptions.find((r) => r.id === prescriptionId);
    if (!rx) return { ok: false, error: 'Prescription not found.' };
    rx.status = 'fulfilled';
    rx.dateFulfilled = new Date().toISOString();
    savePatients(patients);
    return { ok: true };
  },

  deletePrescription(patientId, prescriptionId) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { ok: false, error: 'Patient not found.' };
    patient.prescriptions = patient.prescriptions.filter((r) => r.id !== prescriptionId);
    savePatients(patients);
    return { ok: true };
  },

  // Resident: request an appointment.
  requestAppointment(patientId, date, time, reason) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { ok: false, error: 'Patient not found.' };
    patient.schedule.push({
      id: genId('sch'),
      date,
      time,
      reason: reason || '',
      status: 'requested'
    });
    savePatients(patients);
    return { ok: true };
  },

  // Staff: set an appointment directly (already confirmed).
  addAppointment(patientId, date, time, reason) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { ok: false, error: 'Patient not found.' };
    patient.schedule.push({
      id: genId('sch'),
      date,
      time,
      reason: reason || '',
      status: 'confirmed'
    });
    savePatients(patients);
    return { ok: true };
  },

  confirmAppointment(patientId, scheduleId) {
    const patients = loadPatients();
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return { ok: false, error: 'Patient not found.' };
    const appt = patient.schedule.find((s) => s.id === scheduleId);
    if (!appt) return { ok: false, error: 'Appointment not found.' };
    appt.status = 'confirmed';
    savePatients(patients);
    return { ok: true };
  },

  // Cancel/remove an appointment. Called with just the schedule entry id
  // (patientId isn't known at every call site), so search across patients.
  cancelAppointment(scheduleId) {
    const patients = loadPatients();
    for (const patient of patients) {
      const idx = patient.schedule.findIndex((s) => s.id === scheduleId);
      if (idx !== -1) {
        patient.schedule.splice(idx, 1);
        savePatients(patients);
        return { ok: true };
      }
    }
    return { ok: false, error: 'Appointment not found.' };
  },

  // Flattened views across all patients, used by admin (view-only) and staff.
  getAllPrescriptions() {
    return loadPatients().flatMap((p) =>
      p.prescriptions.map((rx) => ({ ...rx, patientId: p.id, patientName: p.name || p.username }))
    );
  },

  getAllSchedule() {
    return loadPatients().flatMap((p) =>
      p.schedule.map((s) => ({ ...s, patientId: p.id, patientName: p.name || p.username }))
    );
  }
};

window.PatientStore = PatientStore;
