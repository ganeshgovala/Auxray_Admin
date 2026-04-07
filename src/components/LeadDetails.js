/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import { buildApiUrl, API_ENDPOINTS } from '../utils/apiConfig';

const LeadDetails = () => {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [closingLead, setClosingLead] = useState(false);
  const [showCloseLeadModal, setShowCloseLeadModal] = useState(false);
  const [closeLeadNote, setCloseLeadNote] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
    } else {
      fetchLeadDetails();
    }
  }, [navigate, leadId]);

  const fetchLeadDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(buildApiUrl(API_ENDPOINTS.LEADS_ALL), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const foundLead = response.data.leads.find(l => l._id === leadId);
      setLead(foundLead);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      setLoading(false);
    }
  };

  const closeLeadInstallation = async () => {
    if (!lead) return;
    setClosingLead(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        buildApiUrl(`${API_ENDPOINTS.REGISTRATIONS_UPDATE_TIMELINE}/${lead._id}`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCloseLeadModal(false);
      setCloseLeadNote('');
      await fetchLeadDetails(); // Refresh the lead details
    } catch (error) {
      console.error('Error closing lead:', error);
    } finally {
      setClosingLead(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CLOSED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'WARM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatStageName = (stage) => {
    return stage.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  const getTimelineStages = () => {
    const allStages = [
      { key: 'LEAD_CREATED', title: 'Lead Created', icon: 'rocket' },
      { key: 'CUSTOMER_CONFIRMATION_WAITING', title: 'Customer Confirmation', icon: 'clock' },
      { key: 'QUOTE_CREATION', title: 'Quote Created', icon: 'document' },
      { key: 'QUOTE_DECISION', title: 'Quote Decision', icon: 'clipboard' },
      { key: 'REGISTRATION_PROCESS', title: 'Registration Process', icon: 'pencil' },
      { key: 'FIRST_LEVEL_REGISTRATION', title: '1st Level Registration', icon: 'check-circle' },
      { key: 'SECOND_LEVEL_REGISTRATION', title: '2nd Level Registration', icon: 'check-circle' },
      { key: 'INSTALLATION_APPROVAL', title: 'Installation Approval', icon: 'shield-check' },
      { key: 'LOGISTICS_PREPARATION', title: 'Logistics Preparation', icon: 'truck' },
      { key: 'INSTALLATION_STARTED', title: 'Installation Started', icon: 'cog' },
      { key: 'INSTALLATION_COMPLETED', title: 'Installation Completed', icon: 'badge-check' },
    ];

    return allStages.map(stage => {
      const timelineData = lead.timeline?.find(t => t.title === stage.key);
      return {
        ...stage,
        state: timelineData ? timelineData.state : 'PENDING',
        date: timelineData?.completedAt || null
      };
    });
  };

  const getStageIcon = (iconName, isActive, isCompleted) => {
    const color = isCompleted ? 'text-white' : isActive ? 'text-white' : 'text-gray-400';
    
    const icons = {
      'rocket': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
      'clock': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      'document': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      'clipboard': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
      'pencil': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />,
      'check-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      'shield-check': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
      'truck': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />,
      'cog': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
      'badge-check': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    };
    
    return <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{icons[iconName]}</svg>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Lead not found</p>
          <button
            onClick={() => navigate('/leads')}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Return to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeMenu="Leads" />
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header with Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <button onClick={() => navigate('/leads')} className="hover:text-teal-600 transition">Leads</button>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-800 font-medium">{lead.client_name}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Lead Details</h1>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Leads
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
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 px-1 font-medium transition border-b-2 ${
                activeTab === 'timeline'
                  ? 'text-teal-600 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 px-1 font-medium transition border-b-2 ${
                activeTab === 'activity'
                  ? 'text-teal-600 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Activity Log
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Lead Info */}
              <div className="lg:col-span-1 space-y-6">
                {/* Client Card */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                      {lead.client_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{lead.client_name}</h2>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                      {lead.status} PRIORITY
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">{lead.plantCapacity}</div>
                      <div className="text-xs text-teal-100 uppercase">Plant (kW)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">{lead.contractedLoad}</div>
                      <div className="text-xs text-teal-100 uppercase">Load (kW)</div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                        <p className="text-sm font-medium text-gray-800">{lead.phone_number}</p>
                      </div>
                      <a href={`tel:${lead.phone_number}`} className="text-teal-600 hover:text-teal-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Installation Site</p>
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{lead.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Technical Specifications
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <div>
                        <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Plant Capacity</p>
                        <p className="text-2xl font-bold text-purple-700">{lead.plantCapacity} kW</p>
                      </div>
                      <svg className="w-10 h-10 text-purple-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                      <div>
                        <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Contracted Load</p>
                        <p className="text-2xl font-bold text-orange-700">{lead.contractedLoad} kW</p>
                      </div>
                      <svg className="w-10 h-10 text-orange-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <div>
                        <p className="text-xs text-green-600 font-semibold uppercase mb-1">Average Units</p>
                        <p className="text-2xl font-bold text-green-700">{lead.avgUnits}</p>
                      </div>
                      <svg className="w-10 h-10 text-green-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Notes Card */}
                {lead.notes && (
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm p-6 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <h3 className="font-bold text-lg">Notes</h3>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed italic bg-white/10 p-4 rounded-lg backdrop-blur-sm">"{lead.notes}"</p>
                  </div>
                )}
              </div>

              {/* Right Column - Overview Stats */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Overview */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Lead Status Overview
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="border-l-4 border-teal-600 pl-4">
                        <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Current Status</p>
                        <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      
                      <div className="border-l-4 border-purple-600 pl-4">
                        <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Current Stage</p>
                        <p className="text-lg font-bold text-gray-800">{formatStageName(lead.currentStage)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-600 pl-4">
                        <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Created By</p>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {lead.created_by.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{lead.created_by.name}</p>
                        </div>
                      </div>
                      
                      <div className="border-l-4 border-orange-600 pl-4">
                        <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Created On</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Date(lead.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Close Lead Button for completed installations */}
                  {lead.currentStage === 'INSTALLATION_COMPLETED' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setShowCloseLeadModal(true)}
                        className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M12 4v12m8-8H4" />
                        </svg>
                        Close Lead
                      </button>
                    </div>
                  )}
                </div>

                {/* Current Stage Details */}
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl shadow-sm p-6 border-2 border-teal-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Current Progress</h3>
                      <p className="text-sm text-gray-600">Lead is currently in {formatStageName(lead.currentStage)} stage</p>
                    </div>
                    <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                      <span className="text-sm font-bold text-teal-600">
                        {Math.round((lead.timeline?.filter(t => t.state === 'COMPLETED').length || 0) / (lead.timeline?.length || 1) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-600 to-teal-400 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((lead.timeline?.filter(t => t.state === 'COMPLETED').length || 0) / (lead.timeline?.length || 1) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Quick Timeline Preview */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Quick Timeline</h3>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center gap-1"
                    >
                      View Full Timeline
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getTimelineStages().slice(0, 8).map((stage, index) => (
                      <div key={index} className="text-center">
                        <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                          stage.state === 'COMPLETED' ? 'bg-teal-600' :
                          stage.state === 'ACTIVE' ? 'bg-teal-600 ring-4 ring-teal-200' :
                          'bg-gray-200'
                        }`}>
                          {getStageIcon(stage.icon, stage.state === 'ACTIVE', stage.state === 'COMPLETED')}
                        </div>
                        <p className="text-xs font-medium text-gray-600 line-clamp-2">{stage.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Complete Timeline
                </h3>

                <div className="space-y-1">
                  {getTimelineStages().map((stage, index) => {
                    const isCompleted = stage.state === 'COMPLETED';
                    const isActive = stage.state === 'ACTIVE';
                    const isLast = index === getTimelineStages().length - 1;

                    return (
                      <div key={index} className="flex items-start gap-6 pb-8">
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                            isCompleted ? 'bg-teal-600 scale-110' :
                            isActive ? 'bg-teal-600 ring-4 ring-teal-200 scale-110' :
                            'bg-gray-200 scale-100'
                          }`}>
                            {getStageIcon(stage.icon, isActive, isCompleted)}
                          </div>
                          {!isLast && (
                            <div className={`w-1 h-20 my-2 ${isCompleted ? 'bg-teal-600' : 'bg-gray-300'}`}></div>
                          )}
                        </div>
                        <div className="flex-1 pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`text-lg font-bold ${
                              isCompleted || isActive ? 'text-gray-800' : 'text-gray-400'
                            }`}>
                              {stage.title}
                            </h4>
                            {isCompleted && stage.date && (
                              <span className="text-sm text-gray-500">
                                {new Date(stage.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isCompleted ? 'bg-green-100 text-green-700' :
                              isActive ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Activity Log
                </h3>

                <div className="space-y-4">
                  {lead.timeline?.filter(t => t.state === 'COMPLETED').reverse().map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{formatStageName(activity.title)}</p>
                        <p className="text-sm text-gray-500">
                          Completed on {new Date(activity.completedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(!lead.timeline || lead.timeline.filter(t => t.state === 'COMPLETED').length === 0) && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-gray-500">No activity recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Close Lead Modal */}
      {showCloseLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !closingLead && setShowCloseLeadModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M12 4v12m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Close Lead</h3>
                <p className="text-sm text-gray-500">{lead?.client_name}</p>
              </div>
            </div>

            {/* Note Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                rows={3}
                value={closeLeadNote}
                onChange={(e) => setCloseLeadNote(e.target.value)}
                placeholder="Add a note for closing this lead..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCloseLeadModal(false); setCloseLeadNote(''); }}
                disabled={closingLead}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={closeLeadInstallation}
                disabled={closingLead}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {closingLead ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Closing Lead...
                  </>
                ) : (
                  'Close Lead'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;
