// src/pages/PatientsList.js

import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import useCases from '../hooks/useCases';

// small local date formatter (YYYY-MM-DD)
const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().slice(0, 10);
};

const PatientsList = () => {
  const { cases = [], loading } = useCases();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  // Group cases by patient key (medicalId if present, otherwise caseId)
  const patients = useMemo(() => {
    const map = {};
    (cases || []).forEach(c => {
      const key = c.medicalId || `__noid__${c.caseId}`;
      if (!map[key]) {
        map[key] = {
          key,
          medicalId: c.medicalId || null,
          name: c.patientName || 'Unknown',
          cases: []
        };
      }
      map[key].cases.push(c);
    });

    // sort each patient's cases by date desc
    Object.values(map).forEach(p => {
      p.cases.sort((a, b) => new Date(b.updatedAt || b.examDate || 0) - new Date(a.updatedAt || a.examDate || 0));
    });

    // filter by query (name or medicalId)
    const list = Object.values(map).filter(p => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (p.name || '').toLowerCase().includes(q) || (p.medicalId || '').toLowerCase().includes(q);
    });

    // sort patients by last seen
    list.sort((a, b) => {
      const aDate = new Date(a.cases[0]?.updatedAt || a.cases[0]?.examDate || 0);
      const bDate = new Date(b.cases[0]?.updatedAt || b.cases[0]?.examDate || 0);
      return bDate - aDate;
    });

    return list;
  }, [cases, query]);

  const toggle = (key) => setExpanded(s => ({ ...s, [key]: !s[key] }));

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Patients</h1>
          <div className="text-sm text-gray-600">Total patients: {patients.length}</div>
        </div>

        <div className="mb-4">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patients or medical ID..."
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({length:3}).map((_,i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="p-6 bg-white rounded shadow text-center">No patients found.</div>
        ) : (
          <div className="space-y-3">
            {patients.map(p => (
              <div key={p.key} className="bg-white rounded shadow overflow-hidden">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-gray-500">Medical ID: {p.medicalId || '-'}</div>
                    <div className="text-sm text-gray-400">Cases: {p.cases.length} — Last: {formatDate(p.cases[0]?.updatedAt || p.cases[0]?.examDate)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggle(p.key)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                    >
                      {expanded[p.key] ? 'Hide cases' : 'Show cases'}
                    </button>
                    <button
                      onClick={() => window.location.href = `/patient/${p.medicalId || p.cases[0].caseId}`}
                      className="px-3 py-1 bg-white border rounded text-sm"
                    >
                      View profile
                    </button>
                  </div>
                </div>

                {expanded[p.key] && (
                  <div className="border-t">
                    {p.cases.map(c => (
                      <div key={c.caseId} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{c.patientName || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">Case #{c.caseId} • {formatDate(c.updatedAt || c.examDate)}</div>
                          <div className="text-sm text-gray-400">{(c.clinicalNotes || '').slice(0, 120)}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => window.location.href = `/analysis/${c.caseId}`} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Analyze</button>
                          <button onClick={() => window.location.href = `/results/${c.caseId}`} className="px-2 py-1 bg-white border rounded text-sm">Results</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PatientsList;