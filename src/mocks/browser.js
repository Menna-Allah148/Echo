// Lightweight in-browser fetch mock (used when REACT_APP_USE_API=false)
const db = {
  cases: [
    {
      caseId: 'c1',
      patientName: 'John Doe',
      medicalId: 'MID123',
      examDate: '2025-11-18',
      updatedAt: '2025-11-18T10:00:00Z',
      videoUrl: 'http://localhost:4000/videos/c1.mp4',
      segmentedVideoUrl: null
    },
    {
      caseId: 'c2',
      patientName: 'Jane Roe',
      medicalId: 'MID124',
      examDate: '2025-11-17',
      updatedAt: '2025-11-17T09:00:00Z',
      videoUrl: 'http://localhost:4000/videos/c2.mp4',
      segmentedVideoUrl: 'http://localhost:4000/videos/c2_segmented.mp4'
    }
  ],
  patients: [
    { medicalId: 'MID123', patientName: 'John Doe', dob: '1980-01-01' },
    { medicalId: 'MID124', patientName: 'Jane Roe', dob: '1975-05-05' }
  ],
  results: {
    c1: { caseId: 'c1', ef: 55, edv: 120, esv: 54, segmentedVideoUrl: null },
    c2: { caseId: 'c2', ef: 42, edv: 140, esv: 81, segmentedVideoUrl: 'http://localhost:4000/videos/c2_segmented.mp4' }
  }
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function parseUrl(input) {
  try {
    return new URL(input, window.location.origin);
  } catch {
    return null;
  }
}

function extractIdFromPath(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).replace(/^\/+/, '');
}

export async function start() {
  if (!('fetch' in window)) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const reqUrl = typeof input === 'string' ? input : (input && input.url);
    const url = parseUrl(reqUrl);
    if (!url) return originalFetch(input, init);

    const pathname = url.pathname;
    const method = (init.method || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();

    // Only intercept /api/* requests
    if (!pathname.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    try {
      // GET /api/cases
      if (method === 'GET' && pathname === '/api/cases') {
        const q = url.searchParams.get('q') || '';
        const filtered = db.cases.filter(c => {
          if (!q) return true;
          const s = q.toLowerCase();
          return (c.patientName || '').toLowerCase().includes(s) ||
                 (c.medicalId || '').toLowerCase().includes(s) ||
                 (c.caseId || '').toLowerCase().includes(s);
        });
        return jsonResponse(filtered);
      }

      // GET /api/cases/:id
      const caseId = extractIdFromPath(pathname, '/api/cases/');
      if (method === 'GET' && caseId) {
        const c = db.cases.find(x => x.caseId === caseId);
        if (!c) return jsonResponse({ message: 'Case not found' }, 404);
        return jsonResponse(c);
      }

      // POST /api/cases
      if (method === 'POST' && pathname === '/api/cases') {
        let data = {};
        // formData
        if (init.body && typeof init.body.get === 'function') {
          data.patientName = init.body.get('patientName') || 'Unknown';
          data.medicalId = init.body.get('medicalId') || `MID${Math.floor(Math.random() * 10000)}`;
          data.examDate = init.body.get('examDate') || new Date().toISOString();
        } else if (init.body && typeof init.body === 'string') {
          try { data = JSON.parse(init.body); } catch {}
        } else if (typeof input !== 'string' && input && input.formData) {
          try {
            const form = await input.formData();
            data.patientName = form.get('patientName') || 'Unknown';
            data.medicalId = form.get('medicalId') || `MID${Math.floor(Math.random() * 10000)}`;
            data.examDate = form.get('examDate') || new Date().toISOString();
          } catch {}
        }

        const id = `c${Math.floor(Math.random() * 100000)}`;
        const newCase = {
          caseId: id,
          patientName: data.patientName || 'Unknown',
          medicalId: data.medicalId || `MID${Math.floor(Math.random() * 10000)}`,
          examDate: data.examDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          videoUrl: null,
          segmentedVideoUrl: null
        };
        db.cases.unshift(newCase);
        db.results[id] = { caseId: id, ef: null, edv: null, esv: null, segmentedVideoUrl: null };
        return jsonResponse({ caseId: id }, 201);
      }

      // GET /api/cases/:id/results
      if (method === 'GET' && pathname.startsWith('/api/cases/') && pathname.endsWith('/results')) {
        const id = pathname.split('/')[3];
        const r = db.results[id];
        if (!r) return jsonResponse({ message: 'Results not found' }, 404);
        return jsonResponse(r);
      }

      // GET /api/patients
      if (method === 'GET' && pathname === '/api/patients') {
        return jsonResponse(db.patients);
      }

      // POST /api/auth/login
      if (method === 'POST' && pathname === '/api/auth/login') {
        let body = {};
        if (init.body && typeof init.body === 'string') {
          try { body = JSON.parse(init.body); } catch {}
        } else if (!init.body && typeof input !== 'string') {
          try { body = await input.json(); } catch {}
        }
        const username = body.username || 'demo';
        const token = `demo-token-${username}`;
        const user = { id: `u-${username}`, name: username, role: 'doctor', tenantId: 'clinic-1' };
        return jsonResponse({ token, user });
      }

      // default: not found
      return jsonResponse({ message: 'Not found (mock)' }, 404);
    } catch (err) {
      return jsonResponse({ message: 'Mock server error', error: String(err) }, 500);
    }
  };
}