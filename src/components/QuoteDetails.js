/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import { clearDashboardCache, clearQuotesCache } from '../utils/cacheManager';
import { buildApiUrl, API_ENDPOINTS } from '../utils/apiConfig';

const QuoteDetails = () => {
  const navigate = useNavigate();
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [modifyNotes, setModifyNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
    } else {
      fetchQuoteDetails();
    }
  }, [navigate, quoteId]);

  const fetchQuoteDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(buildApiUrl(API_ENDPOINTS.QUOTES_ALL), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const foundQuote = response.data.quotes.find(q => q._id === quoteId);
      setQuote(foundQuote);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quote details:', error);
      setLoading(false);
    }
  };

  const handleQuoteAction = async () => {
    if (actionType === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (actionType === 'modify' && !modifyNotes.trim()) {
      alert('Please provide modification notes');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = `${buildApiUrl('/api/quotes')}/${quoteId}`;
      
      const payload = {
        status: actionType === 'approve' ? 'APPROVED' : actionType === 'reject' ? 'REJECTED' : 'MODIFY'
      };

      if (actionType === 'reject') {
        payload.rejection_reason = rejectionReason;
      }

      if (actionType === 'modify') {
        payload.rejection_reason = modifyNotes; // API uses rejection_reason field for both
      }

      await axios.patch(endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Clear dashboard and quotes cache since quote data has changed
      clearDashboardCache();
      clearQuotesCache();

      alert(`Quote ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'sent for modification'} successfully!`);
      setShowActionModal(false);
      fetchQuoteDetails();
    } catch (error) {
      console.error(`Error ${actionType === 'approve' ? 'approving' : actionType === 'reject' ? 'rejecting' : 'modifying'} quote:`, error);
      alert(`Failed to ${actionType} quote. Please try again.`);
    } finally {
      setProcessing(false);
      setRejectionReason('');
      setModifyNotes('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MODIFY':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'PENDING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const parseCost = (costString) => {
    if (!costString) return 0;
    // Remove ₹ symbol and any commas, then parse as number
    return parseFloat(costString.replace(/[₹,]/g, '').trim()) || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Quote not found</p>
          <button
            onClick={() => navigate('/quotes')}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Return to Quotes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeMenu="Quotes" />
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header with Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <button onClick={() => navigate('/quotes')} className="hover:text-teal-600 transition">Quotes</button>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-800 font-medium">{quote.lead_id?.client_name || 'Quote Details'}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Quote Details</h1>
            </div>
            <div className="flex items-center gap-3">
              {(quote.status === 'PENDING' || quote.status === 'MODIFY') && (
                <>
                  <button
                    onClick={() => {
                      setActionType('approve');
                      setShowActionModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setActionType('modify');
                      setShowActionModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modify
                  </button>
                  <button
                    onClick={() => {
                      setActionType('reject');
                      setShowActionModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/quotes')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
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
              onClick={() => setActiveTab('products')}
              className={`pb-3 px-1 font-medium transition border-b-2 ${
                activeTab === 'products'
                  ? 'text-teal-600 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={`pb-3 px-1 font-medium transition border-b-2 ${
                activeTab === 'specifications'
                  ? 'text-teal-600 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Specifications
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-1 space-y-6">
                {/* Client Card */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                      {quote.lead_id?.client_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA'}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{quote.lead_id?.client_name || 'N/A'}</h2>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                      Quote #{quote._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-center pt-6 border-t border-white/20">
                    <div className="text-sm text-teal-100 mb-2">Total Amount</div>
                    <div className="text-4xl font-bold">{formatAmount(quote.amount)}</div>
                    {quote.discount > 0 && (
                      <div className="text-sm text-teal-100 mt-2">Discount: {quote.discount}%</div>
                    )}
                  </div>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Quote Status
                  </h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-teal-600 pl-4">
                      <p className="text-sm text-gray-500 font-semibold uppercase mb-2">Current Status</p>
                      <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </div>
                    <div className="border-l-4 border-blue-600 pl-4">
                      <p className="text-sm text-gray-500 font-semibold uppercase mb-1">Created On</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(quote.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client Information
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
                        <p className="text-sm font-medium text-gray-800">{quote.lead_id?.phone_number || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Location</p>
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{quote.lead_id?.location || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason */}
                {quote.rejection_reason && (
                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm p-6 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="font-bold text-lg">Rejection Reason</h3>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed bg-white/10 p-4 rounded-lg backdrop-blur-sm">{quote.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Power and System Details */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    System Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                      <div className="text-xs text-purple-600 font-semibold uppercase mb-2">Power Capacity</div>
                      <div className="text-3xl font-bold text-purple-700">{quote.noOfKWs} kW</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="text-xs text-blue-600 font-semibold uppercase mb-2">Number of Floors</div>
                      <div className="text-3xl font-bold text-blue-700">{quote.noOfFloors}</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                      <div className="text-xs text-green-600 font-semibold uppercase mb-2">Products</div>
                      <div className="text-3xl font-bold text-green-700">{quote.products.length}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div className="text-xs text-gray-500 uppercase mb-1">Phase</div>
                      <div className="text-sm font-bold text-gray-800">{quote.phase?.replace('_', ' ') || 'N/A'}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <div className="text-xs text-gray-500 uppercase mb-1">Roof Type</div>
                      <div className="text-sm font-bold text-gray-800 capitalize">{quote.typeOfRoof?.toLowerCase() || 'N/A'}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      <div className="text-xs text-gray-500 uppercase mb-1">Panel Type</div>
                      <div className="text-sm font-bold text-gray-800 capitalize">{quote.panelsType?.replace('_', ' ').toLowerCase() || 'N/A'}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="text-xs text-gray-500 uppercase mb-1">Structure Type</div>
                      <div className="text-sm font-bold text-gray-800 capitalize">{quote.structureType?.toLowerCase() || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Financial Details
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Base Amount</p>
                        <p className="text-2xl font-bold text-gray-800">{formatAmount(quote.amount)}</p>
                      </div>
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    
                    {quote.discount > 0 && (
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div>
                          <p className="text-sm text-green-600 mb-1">Discount Applied</p>
                          <p className="text-2xl font-bold text-green-700">{quote.discount}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600 mb-1">You Save</p>
                          <p className="text-xl font-bold text-green-700">{formatAmount(quote.amount * quote.discount / 100)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg text-white">
                      <div>
                        <p className="text-sm text-teal-100 mb-1">Final Amount</p>
                        <p className="text-3xl font-bold">{formatAmount(quote.amount - (quote.amount * quote.discount / 100))}</p>
                      </div>
                      <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  Products in Quote
                </h3>

                <div className="space-y-4">
                  {quote.products.map((product, index) => (
                    <div key={index} className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                      <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800 mb-2">{product.product_id?.product_name || 'Product Name'}</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Category</p>
                            <p className="text-sm font-semibold text-gray-800">{product.product_id?.category || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Quantity</p>
                            <p className="text-sm font-semibold text-gray-800">{product.count || 0} units</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Price Per Unit</p>
                            <p className="text-sm font-semibold text-gray-800">{product.product_id?.cost || '₹0'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase mb-1">Total</p>
                        <p className="text-2xl font-bold text-teal-600">{formatAmount(parseCost(product.product_id?.cost) * (product.count || 0))}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-700">Total Products</div>
                    <div className="text-3xl font-bold text-gray-800">{quote.products.length} items</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Technical Specifications
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-purple-600 font-semibold uppercase">Power Capacity</p>
                        <p className="text-2xl font-bold text-purple-700">{quote.noOfKWs} kW</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-semibold uppercase">Number of Floors</p>
                        <p className="text-2xl font-bold text-blue-700">{quote.noOfFloors}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-orange-600 font-semibold uppercase">Phase</p>
                        <p className="text-xl font-bold text-orange-700">{quote.phase?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 font-semibold uppercase">Roof Type</p>
                        <p className="text-xl font-bold text-green-700 capitalize">{quote.typeOfRoof?.toLowerCase() || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border-2 border-pink-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-pink-600 font-semibold uppercase">Panel Type</p>
                        <p className="text-xl font-bold text-pink-700 capitalize">{quote.panelsType?.replace('_', ' ').toLowerCase() || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border-2 border-indigo-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-indigo-600 font-semibold uppercase">Structure Type</p>
                        <p className="text-xl font-bold text-indigo-700 capitalize">{quote.structureType?.toLowerCase() || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 capitalize">{actionType} Quote</h3>
            
            {actionType === 'approve' && (
              <p className="text-gray-600 mb-6">Are you sure you want to approve this quote?</p>
            )}

            {actionType === 'modify' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Modification Notes</label>
                <textarea
                  value={modifyNotes}
                  onChange={(e) => setModifyNotes(e.target.value)}
                  placeholder="Enter notes for modifications..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  rows="4"
                ></textarea>
              </div>
            )}

            {actionType === 'reject' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="4"
                  required
                ></textarea>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setRejectionReason('');
                  setModifyNotes('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQuoteAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium disabled:opacity-50 ${
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'modify' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? 'Processing...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteDetails;
