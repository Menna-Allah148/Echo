import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Patient(){
  const { id } = useParams();
  const [tab, setTab] = useState('overview');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Patient #{id}</h2>

      <div className="flex gap-4 border-b pb-2 mb-6">
        <button onClick={()=>setTab('overview')} className={`px-3 pb-2 ${tab==='overview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}>Overview</button>
        <button onClick={()=>setTab('echo')} className={`px-3 pb-2 ${tab==='echo' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}>Echo</button>
        <button onClick={()=>setTab('ecg')} className={`px-3 pb-2 ${tab==='ecg' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}>ECG</button>
        <button onClick={()=>setTab('reports')} className={`px-3 pb-2 ${tab==='reports' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}>Reports</button>
        <button onClick={()=>setTab('upload')} className={`px-3 pb-2 ${tab==='upload' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}>Upload</button>
      </div>

      <div className="bg-white p-4 rounded border">
        {tab === 'overview' && <div>Overview content (vitals, last EF, notes)</div>}
        {tab === 'echo' && <div>Echo viewer & segmentation overlay</div>}
        {tab === 'ecg' && <div>ECG waveform + metrics</div>}
        {tab === 'reports' && <div>List of reports with Download buttons</div>}
        {tab === 'upload' && <div>Upload new Echo / ECG form</div>}
      </div>
      <div className="bg-red-500 text-white p-4 mb-4">Test Box</div>

    </div>
  );
}
