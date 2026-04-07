/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import { buildApiUrl, API_ENDPOINTS } from '../utils/apiConfig';

const RegistrationDetails = () => {
  const navigate = useNavigate();
  const { registrationId } = useParams();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
    } else {
      fetchRegistrationDetails();
    }
  }, [navigate, registrationId]);

  const fetchRegistrationDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.REGISTRATIONS_PENDING),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        }
      );
      const foundRegistration = response.data.data?.find(r => r.registration?._id === registrationId);
      console.log('Registration Details:', foundRegistration);
      setRegistration(foundRegistration);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching registration details:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (url, filename) => {
    if (!url) return;
    
    try {
      // Fetch the file as a blob
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'document';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab if download fails
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Registration not found</p>
          <button
            onClick={() => navigate('/registrations')}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Return to Registrations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeMenu="Registrations" />
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header with Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <button onClick={() => navigate('/registrations')} className="hover:text-teal-600 transition">Registrations</button>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-800 font-medium">{registration.lead?.client_name || 'Registration Details'}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Registration Details</h1>
            </div>
            <button
              onClick={() => navigate('/registrations')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Registrations
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-6 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 font-medium transition border-b-2 ${
                activeTab === 'overview'
                  ? 'text-teal-600 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 px-1 font-medium transition border-b-2 ${
                activeTab === 'documents'
                  ? 'text-teal-600 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Documents
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Client Card */}
              <div className="lg:col-span-1 space-y-6">
                {/* Client Card */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                      {registration.lead?.client_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA'}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{registration.lead?.client_name || 'N/A'}</h2>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                      {registration.registration?.costStructure || 'N/A'}
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">{registration.lead?.plantCapacity || 'N/A'}</div>
                      <div className="text-xs text-teal-100 uppercase">Plant (kW)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">₹{registration.registration?.advancePaid?.toLocaleString('en-IN') || 'N/A'}</div>
                      <div className="text-xs text-teal-100 uppercase">Advance</div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
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
                        <p className="text-sm font-medium text-gray-800">{registration.registration?.phoneNumber || registration.lead?.phone_number || 'N/A'}</p>
                      </div>
                      <a href={`tel:${registration.registration?.phoneNumber}`} className="text-teal-600 hover:text-teal-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-800 break-all">{registration.registration?.emailId || 'N/A'}</p>
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
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{registration.lead?.location || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Team */}
                {registration.registration?.assignedTo && (
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
                          {registration.registration.assignedTo.name?.charAt(0) || 'R'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{registration.registration.assignedTo.name}</p>
                        <p className="text-sm text-gray-600">{registration.registration.assignedTo.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Registration Information */}
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
                      <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                        registration.registration?.costStructure === 'LOAN' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
                      }`}>
                        {registration.registration?.costStructure || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <p className="text-xs text-green-600 font-semibold uppercase mb-1">Advance Paid</p>
                      <p className="text-2xl font-bold text-green-700">
                        ₹{registration.registration?.advancePaid?.toLocaleString('en-IN') || 'N/A'}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Created At</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(registration.registration?.createdAt)}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(registration.registration?.updatedAt)}</p>
                    </div>

                    <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Registration ID</p>
                      <p className="text-xs font-mono text-gray-900 break-all">{registration.registration?._id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Quote Information */}
                {registration.quote && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Quote Information
                    </h3>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                      <div className="text-center">
                        <p className="text-sm text-green-700 font-semibold mb-2">Total Quote Amount</p>
                        <p className="text-5xl font-bold text-green-800 mb-4">
                          ₹{registration.quote.amount?.toLocaleString('en-IN') || 'N/A'}
                        </p>
                        {registration.quote.status && (
                          <span className="inline-block px-4 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                            Status: {registration.quote.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {registration.quote._id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Quote ID</p>
                        <p className="text-xs font-mono text-gray-900 break-all">{registration.quote._id}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Specifications */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Technical Specifications
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Plant Capacity</p>
                          <p className="text-2xl font-bold text-purple-700">{registration.lead?.plantCapacity || 'N/A'} kW</p>
                        </div>
                        <svg className="w-8 h-8 text-purple-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Contracted Load</p>
                          <p className="text-2xl font-bold text-orange-700">{registration.lead?.contractedLoad || 'N/A'} kW</p>
                        </div>
                        <svg className="w-8 h-8 text-orange-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 font-semibold uppercase mb-1">Average Units</p>
                          <p className="text-2xl font-bold text-green-700">{registration.lead?.avgUnits || 'N/A'}</p>
                        </div>
                        <svg className="w-8 h-8 text-green-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Lead Info */}
                {(registration.lead?.notes || registration.lead?.referred_by || registration.lead?.content_requirement) && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Additional Information
                    </h3>
                    
                    <div className="space-y-4">
                      {registration.lead?.content_requirement && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-600 font-semibold uppercase mb-2">Content Requirement</p>
                          <p className="text-sm text-gray-800">{registration.lead.content_requirement}</p>
                        </div>
                      )}
                      
                      {registration.lead?.referred_by && (
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-xs text-purple-600 font-semibold uppercase mb-2">Referred By</p>
                          <p className="text-sm text-gray-800">{registration.lead.referred_by}</p>
                        </div>
                      )}
                      
                      {registration.lead?.notes && (
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <p className="text-xs text-yellow-600 font-semibold uppercase mb-2">Notes</p>
                          <p className="text-sm text-gray-800">{registration.lead.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Documents
              </h3>
              
              {registration.registration?.documents && registration.registration.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {registration.registration.documents.map((doc, index) => {
                    const getFileExtension = (url) => {
                      if (!url) return '';
                      const urlLower = url.toLowerCase();
                      if (urlLower.includes('.pdf')) return 'pdf';
                      if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)/)) return 'image';
                      if (urlLower.match(/\.(doc|docx)/)) return 'word';
                      if (urlLower.match(/\.(xls|xlsx)/)) return 'excel';
                      return 'file';
                    };

                    const fileType = getFileExtension(doc.url || doc.fileUrl || '');
                    const isImage = fileType === 'image';
                    
                    const getThumbnailIcon = (type) => {
                      switch(type) {
                        case 'pdf':
                          return (
                            <div className="w-full h-32 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center rounded-t-lg">
                              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                                <text x="9" y="17" fontSize="7" fill="white" fontWeight="bold">PDF</text>
                              </svg>
                            </div>
                          );
                        case 'word':
                          return (
                            <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center rounded-t-lg">
                              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                              </svg>
                            </div>
                          );
                        case 'excel':
                          return (
                            <div className="w-full h-32 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center rounded-t-lg">
                              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
                              </svg>
                            </div>
                          );
                        default:
                          return (
                            <div className="w-full h-32 bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center rounded-t-lg">
                              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          );
                      }
                    };

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-white group">
                        {/* Thumbnail */}
                        {isImage && (doc.url || doc.fileUrl) ? (
                          <div className="w-full h-32 bg-gray-100 overflow-hidden">
                            <img 
                              src={doc.url || doc.fileUrl} 
                              alt={doc.name || doc.type || `Document ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = getThumbnailIcon('file').props.children;
                              }}
                            />
                          </div>
                        ) : (
                          getThumbnailIcon(fileType)
                        )}
                        
                        {/* Document Info */}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-1 truncate" title={doc.name || doc.type || `Document ${index + 1}`}>
                            {doc.name || doc.type || `Document ${index + 1}`}
                          </h4>
                          <div className="flex items-center gap-2 mb-3">
                            {doc.type && (
                              <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full font-medium">
                                {doc.type}
                              </span>
                            )}
                            {fileType && (
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium uppercase">
                                {fileType}
                              </span>
                            )}
                          </div>
                          
                          {doc.uploadedAt && (
                            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(doc.uploadedAt)}
                            </p>
                          )}
                          
                          {/* Action Buttons */}
                          {(doc.url || doc.fileUrl) && (
                            <div className="flex gap-2">
                              <a
                                href={doc.url || doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </a>
                              <button
                                onClick={() => handleDownload(doc.url || doc.fileUrl, doc.name || doc.type || `Document_${index + 1}`)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No documents available</p>
                  <p className="text-sm text-gray-400 mt-2">Documents will appear here when uploaded</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RegistrationDetails;
