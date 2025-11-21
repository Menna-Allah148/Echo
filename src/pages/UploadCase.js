// src/pages/UploadCase.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Upload, User, Calendar, FileVideo, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { saveCase as saveLocalCase } from '../utils/dataStore';

const UploadCase = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    medicalId: '',
    clinicalNotes: '',
    examDate: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, video: 'Please upload a valid video file (MP4, AVI, MOV)' }));
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, video: 'File size must be less than 500MB' }));
      return;
    }

    setVideoFile(file);
    setErrors(prev => ({ ...prev, video: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patientName.trim()) newErrors.patientName = 'Patient name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.medicalId.trim()) newErrors.medicalId = 'Medical ID is required';
    if (!videoFile) newErrors.video = 'Please upload an echocardiography video';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('patientName', formData.patientName);
      payload.append('age', formData.age);
      payload.append('gender', formData.gender);
      payload.append('medicalId', formData.medicalId);
      payload.append('clinicalNotes', formData.clinicalNotes || '');
      payload.append('examDate', formData.examDate || '');
      payload.append('video', videoFile);

      // Prefer real backend if configured
      if (process.env.REACT_APP_USE_API === 'true' && api && api.cases && typeof api.cases.create === 'function') {
        try {
          const res = await api.cases.create(payload);
          // expect { caseId } or similar
          const remoteId = res && (res.caseId || res.id || res._id);
          if (remoteId) {
            navigate(`/analysis/${remoteId}`);
            return;
          }
          // if server responded ok but no case id, fall through to local save
        } catch (err) {
          console.warn('Remote upload failed, falling back to local store:', err);
          // continue to local fallback
        }
      }

      // Fallback: save local demo case
      const videoUrl = URL.createObjectURL(videoFile);
      const mockCase = {
        patientName: formData.patientName,
        age: formData.age,
        gender: formData.gender,
        medicalId: formData.medicalId,
        clinicalNotes: formData.clinicalNotes || '',
        examDate: formData.examDate || '',
        videoUrl,
        local: true
      };
      const saved = saveLocalCase(mockCase);
      setErrors(prev => ({ ...prev, submit: 'No backend detected — case saved locally for demo.' }));
      navigate(`/analysis/${saved.caseId}`);
      return;
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message || 'Failed to upload case' }));
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Upload New Case</h1>
          <p className="text-gray-600">Add patient information and echocardiography video</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Patient Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-800">Patient Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name *
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.patientName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                  placeholder="Enter patient full name"
                />
                {errors.patientName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.patientName}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.age ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                  placeholder="Enter age"
                  min="1"
                  max="120"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.age}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.gender ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.gender}
                  </p>
                )}
              </div>

              {/* Medical ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical ID *
                </label>
                <input
                  type="text"
                  name="medicalId"
                  value={formData.medicalId}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.medicalId ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none`}
                  placeholder="Enter medical ID"
                />
                {errors.medicalId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.medicalId}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Examination Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="examDate"
                    value={formData.examDate}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinical Notes
                </label>
                <textarea
                  name="clinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Enter any relevant clinical notes or patient history..."
                />
              </div>
            </div>
          </div>

          {/* Video Upload */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <FileVideo className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-800">Echocardiography Video</h2>
            </div>

            {!videoFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : errors.video
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
              >
                <input
                  type="file"
                  id="video-upload"
                  accept="video/mp4,video/avi,video/quicktime,video/mov"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${errors.video ? 'text-red-400' : 'text-gray-400'}`} />
                  <p className="text-gray-700 mb-2 font-medium">
                    Drag & drop Echo video or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported formats: MP4, AVI, MOV (Max: 500MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500 p-3 rounded-full">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{videoFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {errors.video && (
              <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.video}
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Start Analysis
                </>
              )}
            </button>
          </div>

          {errors.submit && (
            <p className="mt-4 text-sm text-red-600">
              {errors.submit}
            </p>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default UploadCase;