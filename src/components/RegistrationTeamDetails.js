import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../utils/apiConfig';

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const RegistrationTeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await axios.get(`${buildApiUrl(API_ENDPOINTS.REGISTRATION_DETAILS)}/${id}`);
        setRegistration(res.data);
      } catch (err) {
        console.error('Registration fetch error:', err, 'ID:', id);
        setRegistration(null);
      }
      setLoading(false);
    }
    fetchDetails();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!registration) return <div className="p-8 text-center text-red-500">Registration not found for ID: {id}</div>;

  return (
    <section className="mt-10 mb-16 w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-teal-100">
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between px-8 pt-8 pb-4 border-b border-gray-100 relative">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Registration Details</h2>
            <p className="text-sm text-gray-500">{registration.lead_id?.client_name || 'N/A'}</p>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <button
              onClick={() => setTab('overview')}
              className={`pb-2 px-1 font-medium transition border-b-2 ${tab === 'overview' ? 'text-teal-600 border-teal-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab('documents')}
              className={`pb-2 px-1 font-medium transition border-b-2 ${tab === 'documents' ? 'text-teal-600 border-teal-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
            >
              Documents
            </button>
          </div>
          <button
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        {/* Content Area */}
        <div className="p-8">
          {(!tab || tab === 'overview') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Client Card, Contact, Assigned */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl shadow p-6 text-white">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                      {registration.lead_id?.client_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA'}
                    </div>
                    <h2 className="text-xl font-bold mb-2">{registration.lead_id?.client_name || 'N/A'}</h2>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20">{registration.costStructure || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">{registration.quote_id?.noOfKWs || 'N/A'}</div>
                      <div className="text-xs text-teal-100 uppercase">Plant (kW)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">₹{registration.advancePaid?.toLocaleString('en-IN') || 'N/A'}</div>
                      <div className="text-xs text-teal-100 uppercase">Advance</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Phone</p>
                        <p className="text-sm font-medium text-gray-800">{registration.phoneNumber || registration.lead_id?.phone_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-800 break-all">{registration.emailId || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Installation Site</p>
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{registration.lead_id?.location || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {registration.assignedTo && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Assigned To
                    </h3>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-teal-700">
                          {registration.assignedTo.name?.charAt(0) || 'R'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{registration.assignedTo.name}</p>
                        <p className="text-sm text-gray-600">{registration.assignedTo.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Column - Registration Info, Quote, Documents */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Registration Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Cost Structure</p>
                      <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${registration.costStructure === 'LOAN' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                        {registration.costStructure || 'N/A'}
                      </span>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <p className="text-xs text-green-600 font-semibold uppercase mb-1">Advance Paid</p>
                      <p className="text-2xl font-bold text-green-700">₹{registration.advancePaid?.toLocaleString('en-IN') || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Created At</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(registration.createdAt)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(registration.updatedAt)}</p>
                    </div>
                    <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Registration ID</p>
                      <p className="text-xs font-mono text-gray-900 break-all">{registration._id || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {/* Quote Information */}
                {registration.quote_id && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Quote Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Amount</p>
                        <p className="text-lg font-bold text-gray-900">₹{registration.quote_id.amount?.toLocaleString('en-IN') || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Plant Capacity</p>
                        <p className="text-lg font-bold text-gray-900">{registration.quote_id.noOfKWs || 'N/A'} kW</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === 'documents' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents
              </h3>
              {registration.documents?.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {registration.documents.map((doc, docIndex) => (
                    <a
                      key={docIndex}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center w-32 p-3 bg-gray-50 rounded-lg shadow hover:bg-gray-100 transition"
                    >
                      <svg className="w-8 h-8 text-teal-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs text-gray-700 font-medium text-center break-all">{doc.documentType}</span>
                      <span className="text-xs text-gray-400 mt-1">Download</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No documents uploaded for this registration.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RegistrationTeamDetails;
