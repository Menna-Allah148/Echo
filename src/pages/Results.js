// src/pages/Results.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Heart, CheckCircle, AlertCircle, FileText, TrendingUp, Activity } from 'lucide-react';
import api from '../services/api';

const Results = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [caseId]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try remote API first (if available)
      if (api && api.analysis && typeof api.analysis.getResults === 'function') {
        const data = await api.analysis.getResults(caseId);
        setResults(data.results || data);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Remote API failed; fall back to local demo data
      // eslint-disable-next-line no-console
      console.warn('Remote API not available or failed:', err);
    }

    // Fallback: check sessionStorage for localResults or localCases created by the upload fallback
    try {
      const localResults = JSON.parse(sessionStorage.getItem('localResults') || '{}');
      if (localResults && localResults[caseId]) {
        setResults(localResults[caseId]);
        setLoading(false);
        return;
      }

      const localCases = JSON.parse(sessionStorage.getItem('localCases') || '{}');
      if (localCases && localCases[caseId]) {
        const c = localCases[caseId];
        // Build a simple mock result compatible with the UI
        const ef = c.ejectionFraction || Math.round(45 + Math.random() * 15);
        const edv = Math.round(100 + Math.random() * 60);
        const esv = Math.round(edv * (1 - ef / 100));
        const wallMotion = { anterior: 'normal', inferior: 'normal', lateral: 'normal', septal: 'normal' };
        const mock = {
          ef,
          edv,
          esv,
          wallMotion,
          confidence: Math.round(75 + Math.random() * 20),
          videoUrl: c.videoUrl || null,
          segmentedVideoUrl: null
        };
        setResults(mock);
        setLoading(false);
        return;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to read local storage for results:', err);
    }

    setError('Case not found. If you are testing frontend only, upload a case to create a demo result.');
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            <AlertCircle className="w-6 h-6 mb-2" />
            <p className="font-semibold mb-2">Error Loading Results</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchResults}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!results) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-700">
            <AlertCircle className="w-6 h-6 mb-2" />
            <p>No results found for this case.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // guard against undefined/null results and missing fields from mock/remote responses
  const {
    ef = 0,
    edv = 0,
    esv = 0,
    wallMotion = {},
    confidence = 0,
    videoUrl = null,
    segmentedVideoUrl = null
  } = results || {};

  // Determine EF status
  const getEFStatus = (efValue) => {
    if (efValue >= 50) return { label: 'Normal', color: 'bg-green-100 text-green-700' };
    if (efValue >= 40) return { label: 'Mild Dysfunction', color: 'bg-orange-100 text-orange-700' };
    if (efValue >= 30) return { label: 'Moderate Dysfunction', color: 'bg-red-100 text-red-700' };
    return { label: 'Severe Dysfunction', color: 'bg-red-200 text-red-800' };
  };

  const efStatus = getEFStatus(ef);

  const handleOpenReport = () => {
    // Build report payload (prefer full results object)
    const report = {
      caseId,
      patientName: results.patientName || results.name || 'Unknown',
      medicalId: results.medicalId || results.medicalId || '-',
      ef,
      edv,
      esv,
      wallMotion,
      confidence,
      videoUrl,
      segmentedVideoUrl,
      conclusions: results.conclusions || results.summary || 'No conclusions provided.',
      generatedAt: new Date().toISOString()
    };

    // persist to sessionStorage under 'reports'
    try {
      const key = 'reports';
      const existing = JSON.parse(sessionStorage.getItem(key) || '{}');
      existing[caseId] = report;
      sessionStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      // ignore storage errors
      // eslint-disable-next-line no-console
      console.warn('Failed to save report locally', err);
    }

    navigate(`/report/${caseId}`);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Analysis Results</h1>
          <p className="text-gray-600">Case ID: #{caseId}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Ejection Fraction */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <p className="text-gray-600 font-medium">Ejection Fraction (EF)</p>
            </div>
            <p className="text-5xl font-bold text-orange-500 mb-3">{ef}%</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${efStatus.color}`}>
              {efStatus.label}
            </span>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm text-gray-600">
              <p>EDV: <span className="font-semibold text-gray-800">{edv} mL</span></p>
              <p>ESV: <span className="font-semibold text-gray-800">{esv} mL</span></p>
            </div>
          </div>

          {/* Wall Motion */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-indigo-600" />
              <p className="text-gray-600 font-medium">Wall Motion Analysis</p>
            </div>
            <div className="space-y-3 mt-4">
              {Object.entries(wallMotion).map(([region, status]) => (
                <WallMotionRow key={region} region={region} status={status} />
              ))}
            </div>
          </div>

          {/* AI Confidence */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              <p className="text-gray-600 font-medium">AI Confidence</p>
            </div>
            <p className="text-5xl font-bold text-indigo-600 mb-3">{confidence}%</p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {confidence >= 90 ? 'High confidence analysis' : 
                 confidence >= 70 ? 'Good confidence analysis' : 
                 'Moderate confidence - review recommended'}
              </p>
            </div>
          </div>
        </div>

        {/* Video Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Original Video */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Original Video
            </h3>
            <div className="bg-gray-900 aspect-video rounded-lg flex items-center justify-center">
              {videoUrl ? (
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center text-gray-500">
                  <Heart className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Video not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Segmented Video */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Segmented View
            </h3>
            <div className="bg-gray-900 aspect-video rounded-lg flex items-center justify-center">
              {segmentedVideoUrl ? (
                <video 
                  src={segmentedVideoUrl} 
                  controls 
                  className="w-full h-full rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center text-gray-500">
                  <Activity className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Segmented video not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleOpenReport}
            className="flex-1 bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            View / Download Report
          </button>
        </div>
      </div>
    </Layout>
  );
};

const WallMotionRow = ({ region, status }) => {
  const statusStr = String(status || 'normal').toLowerCase();
  const isNormal = statusStr === 'normal';
  const regionName = String(region || '').charAt(0).toUpperCase() + String(region || '').slice(1);
  
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{regionName}</span>
      <div className="flex items-center gap-2">
        {isNormal ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-700 font-medium">Normal</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700 font-medium capitalize">{statusStr}</span>
          </>
        )}
      </div>
    </div>
  );
};
export default Results;
