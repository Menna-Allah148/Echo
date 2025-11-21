import { rest } from 'msw';

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

export const handlers = [
  // list cases
  rest.get('/api/cases', (req, res, ctx) => {
    // optional query support: q, scope, limit, page
    const q = req.url.searchParams.get('q') || '';
    const filtered = db.cases.filter(c => {
      if (!q) return true;
      const s = q.toLowerCase();
      return (c.patientName || '').toLowerCase().includes(s) || (c.medicalId || '').toLowerCase().includes(s) || (c.caseId || '').toLowerCase().includes(s);
    });
    return res(ctx.status(200), ctx.json(filtered));
  }),

  // get case by id
  rest.get('/api/cases/:id', (req, res, ctx) => {
    const { id } = req.params;
    const c = db.cases.find(x => x.caseId === id);
    if (!c) return res(ctx.status(404), ctx.json({ message: 'Case not found' }));
    return res(ctx.status(200), ctx.json(c));
  }),

  // create case (multipart/form-data expected)
  rest.post('/api/cases', async (req, res, ctx) => {
    // read formData if available
    let data = {};
    try {
      const form = await req.formData();
      data.patientName = form.get('patientName') || 'Unknown';
      data.medicalId = form.get('medicalId') || `MID${Math.floor(Math.random() * 10000)}`;
      data.examDate = form.get('examDate') || new Date().toISOString();
    } catch (e) {
      try { data = await req.json(); } catch {}
    }
    const id = `c${Math.floor(Math.random() * 100000)}`;
    const newCase = {
      caseId: id,
      patientName: data.patientName,
      medicalId: data.medicalId,
      examDate: data.examDate,
      updatedAt: new Date().toISOString(),
      videoUrl: null,
      segmentedVideoUrl: null
    };
    db.cases.unshift(newCase);
    // optionally create a result entry placeholder
    db.results[id] = { caseId: id, ef: null, edv: null, esv: null, segmentedVideoUrl: null };
    return res(ctx.status(201), ctx.json({ caseId: id }));
  }),

  // get results for case
  rest.get('/api/cases/:id/results', (req, res, ctx) => {
    const { id } = req.params;
    const r = db.results[id];
    if (!r) return res(ctx.status(404), ctx.json({ message: 'Results not found' }));
    return res(ctx.status(200), ctx.json(r));
  }),

  // list patients
  rest.get('/api/patients', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(db.patients));
  }),

  // basic auth login (demo)
  rest.post('/api/auth/login', async (req, res, ctx) => {
    const body = await req.json().catch(() => ({}));
    const username = body.username || 'demo';
    // demo token and user
    const token = `demo-token-${username}`;
    const user = { id: `u-${username}`, name: username, role: 'doctor', tenantId: 'clinic-1' };
    return res(ctx.status(200), ctx.json({ token, user }));
  })
];