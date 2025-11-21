// src/utils/dataStore.js
// ==========================================
// Local Data Store - Simulates Database
// ==========================================

const STORAGE_KEYS = {
  CASES: 'echo_ai_cases',
  CASE_COUNTER: 'echo_ai_case_counter'
};

// ==========================================
// Initialize with default data
// ==========================================
const initializeDefaultData = () => {
  const existingCases = localStorage.getItem(STORAGE_KEYS.CASES);
  
  if (!existingCases) {
    const defaultCases = [
      {
        id: 1,
        patientName: 'Ahmed Mohamed',
        age: 58,
        gender: 'male',
        medicalId: 'MED-12345',
        clinicalNotes: 'Patient complains of chest pain and shortness of breath.',
        date: '2024-11-15',
        status: 'Completed',
        ef: '45%',
        diagnosis: 'Mild LV Dysfunction',
        results: {
          ef: 45,
          edv: 142,
          esv: 82,
          wallMotion: {
            anterior: 'normal',
            lateral: 'normal',
            inferior: 'hypokinetic',
            septal: 'normal'
          },
          confidence: 94
        }
      },
      {
        id: 2,
        patientName: 'Fatma Hassan',
        age: 62,
        gender: 'female',
        medicalId: 'MED-12346',
        clinicalNotes: 'Routine checkup.',
        date: '2024-11-15',
        status: 'Pending',
        ef: '-',
        diagnosis: 'Under Analysis'
      },
      {
        id: 3,
        patientName: 'Omar Khaled',
        age: 71,
        gender: 'male',
        medicalId: 'MED-12347',
        clinicalNotes: 'History of hypertension.',
        date: '2024-11-14',
        status: 'Completed',
        ef: '38%',
        diagnosis: 'Moderate LV Dysfunction',
        results: {
          ef: 38,
          edv: 165,
          esv: 102,
          wallMotion: {
            anterior: 'hypokinetic',
            lateral: 'normal',
            inferior: 'hypokinetic',
            septal: 'normal'
          },
          confidence: 89
        }
      }
    ];
    
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(defaultCases));
    localStorage.setItem(STORAGE_KEYS.CASE_COUNTER, '3');
  }
};

// Initialize on load
initializeDefaultData();

// ==========================================
// Data Store Functions
// ==========================================

export const dataStore = {
  // Get all cases
  getAllCases: () => {
    const cases = localStorage.getItem(STORAGE_KEYS.CASES);
    return cases ? JSON.parse(cases) : [];
  },

  // Get case by ID
  getCaseById: (id) => {
    const cases = dataStore.getAllCases();
    return cases.find(c => c.id === parseInt(id));
  },

  // Add new case
  addCase: (caseData) => {
    const cases = dataStore.getAllCases();
    const counter = parseInt(localStorage.getItem(STORAGE_KEYS.CASE_COUNTER) || '0');
    const newId = counter + 1;
    
    const newCase = {
      id: newId,
      ...caseData,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      ef: '-',
      diagnosis: 'Under Analysis'
    };
    
    cases.push(newCase);
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    localStorage.setItem(STORAGE_KEYS.CASE_COUNTER, newId.toString());
    
    return newCase;
  },

  // Update case
  updateCase: (id, updates) => {
    const cases = dataStore.getAllCases();
    const index = cases.findIndex(c => c.id === parseInt(id));
    
    if (index !== -1) {
      cases[index] = { ...cases[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
      return cases[index];
    }
    
    return null;
  },

  // Delete case
  deleteCase: (id) => {
    const cases = dataStore.getAllCases();
    const filtered = cases.filter(c => c.id !== parseInt(id));
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(filtered));
    return true;
  },

  // Simulate analysis completion
  completeAnalysis: (id, results) => {
    const efStatus = results.ef >= 50 ? 'Normal Function' : 
                     results.ef >= 40 ? 'Mild LV Dysfunction' :
                     results.ef >= 30 ? 'Moderate LV Dysfunction' : 
                     'Severe LV Dysfunction';
    
    return dataStore.updateCase(id, {
      status: 'Completed',
      ef: `${results.ef}%`,
      diagnosis: efStatus,
      results: results
    });
  }
};

/**
 * Simple client-side case store backed by sessionStorage + in-memory pub/sub.
 * Used when no backend is available so Upload -> Dashboard/Patients updates immediately.
 */
const CASES_KEY = 'localCases_v1';
const listeners = new Set();

export function _readAll() {
  try {
    return JSON.parse(sessionStorage.getItem(CASES_KEY) || '{}');
  } catch {
    return {};
  }
}

export function _writeAll(obj) {
  try {
    sessionStorage.setItem(CASES_KEY, JSON.stringify(obj));
  } catch (err) {
    // ignore storage errors
    // eslint-disable-next-line no-console
    console.warn('dataStore write failed', err);
  }
}

export function getCases() {
  const all = _readAll();
  return Object.values(all);
}

export function getCase(caseId) {
  const all = _readAll();
  return all[caseId] || null;
}

export function saveCase(caseObj) {
  const id = caseObj.caseId || `local-${Date.now()}`;
  const all = _readAll();
  const toSave = { ...caseObj, caseId: id, updatedAt: new Date().toISOString() };
  all[id] = toSave;
  _writeAll(all);
  emitChange();
  return toSave;
}

export function removeCase(caseId) {
  const all = _readAll();
  if (all[caseId]) {
    delete all[caseId];
    _writeAll(all);
    emitChange();
    return true;
  }
  return false;
}

function emitChange() {
  const snapshot = getCases();
  for (const l of Array.from(listeners)) {
    try { l(snapshot); } catch {}
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  // return unsubscribe
  return () => {
    listeners.delete(fn);
  };
}

export default dataStore;