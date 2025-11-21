// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadCase from './pages/UploadCase';
import Analysis from './pages/Analysis';
import Results from './pages/Results';
import Report from './pages/Report';
import PatientsList from './pages/PatientsList';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <PrivateRoute>
                <UploadCase />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/analysis/:caseId" 
            element={
              <PrivateRoute>
                <Analysis />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/results/:caseId" 
            element={
              <PrivateRoute>
                <Results />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/report/:caseId" 
            element={
              <PrivateRoute>
                <Report />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/patients" 
            element={
              <PrivateRoute>
                <PatientsList />
              </PrivateRoute>
            } 
          />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;