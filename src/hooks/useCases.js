import { useEffect, useMemo, useState, useCallback } from 'react';
import * as ds from '../utils/dataStore';
import api from '../services/api';

const USE_API = (process.env.REACT_APP_USE_API === 'true');

export default function useCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // load initial list
  useEffect(() => {
    let unsub;
    async function init() {
      setLoading(true);
      try {
        if (USE_API && api && api.cases && typeof api.cases.list === 'function') {
          const data = await api.cases.list();
          setCases(data || []);
        } else {
          setCases(ds.getCases());
          unsub = ds.subscribe(list => setCases(list));
        }
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load cases');
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => { if (unsub) unsub(); };
  }, []);

  // create case (upload/file already handled elsewhere)
  const createCase = useCallback(async (caseObj) => {
    if (USE_API && api && api.cases && typeof api.cases.create === 'function') {
      const created = await api.cases.create(caseObj);
      return created;
    } else {
      return ds.saveCase(caseObj);
    }
  }, []);

  const removeCase = useCallback(async (caseId) => {
    if (USE_API && api && api.cases && typeof api.cases.delete === 'function') {
      await api.cases.delete(caseId);
      // optimistically refresh
      const updated = await api.cases.list();
      setCases(updated || []);
    } else {
      ds.removeCase(caseId);
      setCases(ds.getCases());
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (USE_API && api && api.cases && typeof api.cases.list === 'function') {
        const data = await api.cases.list();
        setCases(data || []);
      } else {
        setCases(ds.getCases());
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to refresh cases');
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    cases, loading, error, createCase, removeCase, refresh
  }), [cases, loading, error, createCase, removeCase, refresh]);
}