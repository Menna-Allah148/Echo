// src/pages/Analysis.js

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Activity, CheckCircle, Clock, Loader } from 'lucide-react';
import api from '../services/api';

const Analysis = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // make steps stable so useEffect doesn't restart every render
  const steps = useMemo(() => [
    { id: 0, text: 'Processing video frames', time: 2000 },
    { id: 1, text: 'Segmenting cardiac chambers', time: 3000 },
    { id: 2, text: 'Calculating ejection fraction', time: 2500 },
    { id: 3, text: 'Detecting wall motion abnormalities', time: 2000 },
    { id: 4, text: 'Generating clinical report', time: 1500 }
  ], []);

  useEffect(() => {
    let mounted = true;
    const totalTime = steps.reduce((acc, step) => acc + step.time, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const newProgress = Math.min((elapsed / totalTime) * 100, 100);
      if (mounted) setProgress(newProgress);

      let accumulatedTime = 0;
      let foundIndex = steps.length - 1;
      for (let i = 0; i < steps.length; i++) {
        accumulatedTime += steps[i].time;
        if (elapsed < accumulatedTime) {
          foundIndex = i;
          break;
        }
      }
      if (mounted) setCurrentStep(foundIndex);

      if (elapsed >= totalTime) {
        clearInterval(interval);
        if (mounted) {
          setProgress(100);
          setCurrentStep(steps.length - 1);
        }

        // Try to call backend if present; otherwise navigate anyway.
        (async () => {
          let remoteSucceeded = false;
          try {
            if (api && api.analysis && typeof api.analysis.getResults === 'function') {
              const remoteResult = await api.analysis.getResults(caseId);
              // store remote result for Results page to pick up (optional)
              try {
                const key = 'localResults';
                const existing = JSON.parse(sessionStorage.getItem(key) || '{}');
                existing[caseId] = remoteResult || { caseId, remote: true };
                sessionStorage.setItem(key, JSON.stringify(existing));
              } catch {}
              remoteSucceeded = true;
            }
          } catch (err) {
            // backend not available or failed — will fall back to local mock
            // eslint-disable-next-line no-console
            console.warn('api.analysis.getResults failed or no backend:', err);
          } finally {
            if (!remoteSucceeded) {
              // Build a demo/mock result so the UI shows something when no API exists.
              try {
                const localCases = JSON.parse(sessionStorage.getItem('localCases') || '{}');
                const caseData = localCases[caseId] || {};
                const mockResult = {
                  caseId,
                  ejectionFraction: caseData.ejectionFraction || Math.round(50 + Math.random() * 15),
                  conclusions: caseData.clinicalNotes
                    ? `Demo analysis based on provided notes: ${caseData.clinicalNotes.slice(0, 120)}`
                    : 'Demo analysis: no significant abnormality detected.',
                  videoUrl: caseData.videoUrl || null,
                  local: true,
                  createdAt: new Date().toISOString()
                };

                const key = 'localResults';
                const existing = JSON.parse(sessionStorage.getItem(key) || '{}');
                existing[caseId] = mockResult;
                sessionStorage.setItem(key, JSON.stringify(existing));
              } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('Failed to write mock result to sessionStorage:', err);
              }
            }

            if (mounted) {
              // small delay so progress UI reaches 100% smoothly
              setTimeout(() => navigate(`/results/${caseId}`), 500);
            }
          }
        })();
      }
    }, 100);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [caseId, navigate, steps]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-center mb-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-16 h-16 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Analyzing Echocardiography...
            </h2>
            <p className="text-gray-600">
              Please wait while our AI processes the video
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {steps.map((step, index) => (
              <ProgressStep
                key={step.id}
                text={step.text}
                completed={currentStep > index}
                active={currentStep === index}
              />
            ))}
          </div>

          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{Math.round(progress)}% Complete</span>
              <span className="text-gray-600">
                {currentStep + 1} of {steps.length} steps
              </span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Case ID:</span> #{caseId}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ProgressStep = ({ text, completed, active }) => {
  return (
    <div className="flex items-center gap-3">
      {completed ? (
        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
      ) : active ? (
        <div className="w-6 h-6 flex-shrink-0">
          <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <Clock className="w-6 h-6 text-gray-300 flex-shrink-0" />
      )}
      <span
        className={`text-sm ${
          completed
            ? 'text-gray-800 font-medium'
            : active
            ? 'text-indigo-600 font-medium'
            : 'text-gray-400'
        }`}
      >
        {text}
      </span>
    </div>
  );
};

export default Analysis;