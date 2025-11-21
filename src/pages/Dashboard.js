// src/pages/Dashboard.js

import React, { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import useCases from '../hooks/useCases';
import api from '../services/api';
import { migrateLocalToApi } from '../utils/migrateLocalToApi';

// small local date formatter (YYYY-MM-DD)
const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().slice(0, 10);
};

const PAGE_SIZE = 8;

const Dashboard = () => {
  const { cases, loading, error, refresh } = useCases();
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [view, setView] = useState('cards');
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const canSync = process.env.REACT_APP_USE_API === 'true';

  const filtered = useMemo(() => {
    let list = (cases || []).slice();
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c => (c.patientName || '').toLowerCase().includes(q) || (c.medicalId || '').toLowerCase().includes(q));
    }
    if (genderFilter) list = list.filter(c => (c.gender || '').toLowerCase() === genderFilter);
    list.sort((a, b) => {
      if (sortBy === 'patientName') return (a.patientName || '').localeCompare(b.patientName || '');
      return new Date(b[sortBy] || b.updatedAt || 0) - new Date(a[sortBy] || a.updatedAt || 0);
    });
    return list;
  }, [cases, query, genderFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const handleSync = async () => {
    if (!canSync) return;
    setSyncing(true);
    try {
      const report = await migrateLocalToApi(api);
      // simple feedback; you can show a toast instead
      alert(`Sync complete. Uploaded: ${report.uploaded.length}, Failed: ${report.failed.length}`);
      refresh();
    } catch (err) {
      alert('Sync failed: ' + (err.message || err));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button onClick={refresh} className="px-3 py-2 bg-white border rounded shadow-sm">Refresh</button>
            {canSync && (
              <button onClick={handleSync} disabled={syncing} className="px-3 py-2 bg-indigo-600 text-white rounded shadow-sm">
                {syncing ? 'Syncing…' : 'Sync local → backend'}
              </button>
            )}
            <div className="bg-white border rounded px-2 py-1 text-sm text-gray-600">Total: {cases?.length || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search name or medical ID..."
              className="col-span-2 px-3 py-2 border rounded"
            />
            <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded">
              <option value="">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <div className="flex items-center gap-2">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border rounded">
                <option value="updatedAt">Newest</option>
                <option value="patientName">Name</option>
                <option value="examDate">Exam Date</option>
              </select>
              <div className="ml-2 flex gap-1">
                <button onClick={() => setView('cards')} className={`px-2 py-1 rounded ${view==='cards'?'bg-indigo-600 text-white':'bg-gray-100'}`}>Cards</button>
                <button onClick={() => setView('table')} className={`px-2 py-1 rounded ${view==='table'?'bg-indigo-600 text-white':'bg-gray-100'}`}>Table</button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({length:4}).map((_,i) => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 bg-white rounded shadow text-center">No cases found. Try uploading a patient case.</div>
        ) : view === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map(c => (
              <div key={c.caseId} className="p-4 bg-white rounded-lg shadow flex flex-col justify-between">
                <div>
                  <div className="text-lg font-semibold">{c.patientName || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">ID: {c.medicalId || '-'}</div>
                  <div className="text-sm text-gray-500 mt-2">Date: {formatDate(c.examDate)}</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <div>#{c.caseId}</div>
                  <div className="flex gap-2">
                    <button onClick={() => window.location.href = `/analysis/${c.caseId}`} className="px-2 py-1 bg-indigo-600 text-white rounded">Analyze</button>
                    <button onClick={() => window.location.href = `/results/${c.caseId}`} className="px-2 py-1 bg-white border rounded">Results</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded shadow overflow-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Patient</th>
                  <th className="p-3 text-left">Medical ID</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Case</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(c => (
                  <tr key={c.caseId} className="border-t">
                    <td className="p-3">{c.patientName}</td>
                    <td className="p-3">{c.medicalId}</td>
                    <td className="p-3">{c.examDate || c.updatedAt?.slice(0,10)}</td>
                    <td className="p-3">#{c.caseId}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => window.location.href = `/analysis/${c.caseId}`} className="px-2 py-1 bg-indigo-600 text-white rounded">Analyze</button>
                        <button onClick={() => window.location.href = `/results/${c.caseId}`} className="px-2 py-1 bg-white border rounded">Results</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex justify-center items-center gap-3">
          <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
          <div>{page} / {totalPages}</div>
          <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;