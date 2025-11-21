import { getCases, removeCase } from './dataStore';

/**
 * Migrate local session cases to backend with progress callback.
 * - api: the api adapter (src/services/api.js)
 * - options:
 *    - removeAfterUpload: boolean (default false) - remove local case after successful upload
 * - onProgress: (info) => void where info = { index, total, uploaded, failed, localCaseId, error }
 *
 * Returns an object { uploaded: [{localCaseId, remote}], failed: [{localCaseId, error}] }
 */
export async function migrateLocalToApi(api, options = {}, onProgress) {
  if (!api || !api.cases || typeof api.cases.create !== 'function') {
    throw new Error('API adapter not available or missing cases.create');
  }
  const local = getCases();
  const total = local.length;
  const results = { uploaded: [], failed: [] };
  let uploadedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < local.length; i++) {
    const c = local[i];
    try {
      const fd = new FormData();
      fd.append('patientName', c.patientName || '');
      fd.append('age', c.age || '');
      fd.append('gender', c.gender || '');
      fd.append('medicalId', c.medicalId || '');
      fd.append('clinicalNotes', c.clinicalNotes || '');
      fd.append('examDate', c.examDate || '');
      // Note: original video File isn't available from objectURL; cannot re-upload video here.
      const res = await api.cases.create(fd);
      results.uploaded.push({ localCaseId: c.caseId, remote: res });
      uploadedCount++;
      if (options.removeAfterUpload) {
        try { removeCase(c.caseId); } catch {}
      }
      if (typeof onProgress === 'function') {
        onProgress({
          index: i + 1,
          total,
          uploaded: uploadedCount,
          failed: failedCount,
          localCaseId: c.caseId,
          remote: res
        });
      }
    } catch (err) {
      failedCount++;
      results.failed.push({ localCaseId: c.caseId, error: err.message || String(err) });
      if (typeof onProgress === 'function') {
        onProgress({
          index: i + 1,
          total,
          uploaded: uploadedCount,
          failed: failedCount,
          localCaseId: c.caseId,
          error: err.message || String(err)
        });
      }
    }
  }

  return results;
}