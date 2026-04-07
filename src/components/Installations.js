import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { clearInstallationsCache } from '../utils/cacheManager';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../utils/apiConfig';

function Installations() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedInstallation, setSelectedInstallation] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(user);
      // Allow roles 3 (Registration Team), 4 (Child Admin), and 5 (Super Admin)
      if (parsedUser.role !== 3 && parsedUser.role !== 4 && parsedUser.role !== 5) {
        navigate('/');
        return;
      }
    } catch (error) {
      navigate('/');
      return;
    }
    
    loadInstallations();
  }, [navigate]);

  const loadInstallations = () => {
    const cachedData = localStorage.getItem('installations');
    
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      setInstallations(parsed.data || []);
    }
    
    fetchInstallations();
  };

  const fetchInstallations = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.LEADS_INSTALLATIONS),
        {
          headers: getAuthHeaders(token)
        }
      );
      
      setInstallations(response.data.data || []);
      localStorage.setItem('installations', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching installations:', error);
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        console.error('API Error Status:', error.response.status);
      }
      setInstallations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatStage = (stage) => {
    return stage ? stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  };

  const formatAmount = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStageColor = (stage) => {
    switch(stage?.toLowerCase()) {
      case 'completed':
      case 'installation_completed':
        return 'bg-green-100 text-green-700';
      case 'active':
      case 'in_progress':
      case 'installation_in_progress':
      case 'installation_approval':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
      case 'installation_pending':
      case 'logistics_preparation':
        return 'bg-yellow-100 text-yellow-700';
      case 'installation_started':
        return 'bg-indigo-100 text-indigo-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredInstallations = installations.filter(installation => {
    const matchesSearch = 
      installation.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      installation.phone_number?.includes(searchQuery) ||
      installation.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || installation.currentStage === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedInstallations = [...filteredInstallations].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'amount_high':
        return (b.plantCapacity || 0) - (a.plantCapacity || 0);
      case 'amount_low':
        return (a.plantCapacity || 0) - (b.plantCapacity || 0);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const totalPages = Math.ceil(sortedInstallations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const indexOfFirstItem = startIndex;
  const indexOfLastItem = startIndex + itemsPerPage;
  const currentItems = sortedInstallations.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, sortBy]);

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRefresh = async () => {
    clearInstallationsCache();
    setRefreshing(true);
    try {
      await fetchInstallations();
    } finally {
      setRefreshing(false);
    }
  };

  const refreshQuote = async () => {
    if (!selectedInstallation) return;
    setRefreshingQuote(true);
    try {
      await fetchQuoteForInstallation(selectedInstallation._id);
    } finally {
      setRefreshingQuote(false);
    }
  };

  const viewDetails = (installation) => {
    setSelectedInstallation(installation);
    setShowDetails(true);
    setSelectedTab('overview'); // Reset to overview tab
    fetchQuoteForInstallation(installation._id);
  };

  const fetchQuoteForInstallation = async (leadId) => {
    setQuoteData(null);
    setQuoteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.QUOTES_ALL),
        { headers: getAuthHeaders(token) }
      );
      const quotes = response.data.quotes || [];
      const matched = quotes.find(q => {
        const qLeadId = typeof q.lead_id === 'object' ? q.lead_id._id : q.lead_id;
        return qLeadId === leadId;
      });
      setQuoteData(matched || null);
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setQuoteLoading(false);
    }
  };

  const goBackToList = () => {
    setShowDetails(false);
    setSelectedInstallation(null);
  };

  const [approving, setApproving] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [closingLead, setClosingLead] = useState(false);
  const [showCloseLeadModal, setShowCloseLeadModal] = useState(false);
  const [closeLeadNote, setCloseLeadNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingQuote, setRefreshingQuote] = useState(false);

  const approveInstallation = async () => {
    if (!selectedInstallation) return;
    setApproving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        buildApiUrl(`${API_ENDPOINTS.REGISTRATIONS_UPDATE_TIMELINE}/${selectedInstallation._id}`),
        { note: approveNote },
        { headers: getAuthHeaders(token) }
      );
      setShowApproveModal(false);
      setApproveNote('');
      await fetchInstallations();
    } catch (error) {
      console.error('Error approving installation:', error);
    } finally {
      setApproving(false);
    }
  };

  const closeLeadInstallation = async () => {
    if (!selectedInstallation) return;
    setClosingLead(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        buildApiUrl(`${API_ENDPOINTS.REGISTRATIONS_UPDATE_TIMELINE}/${selectedInstallation._id}`),
        { note: closeLeadNote },
        { headers: getAuthHeaders(token) }
      );
      setShowCloseLeadModal(false);
      setCloseLeadNote('');
      await fetchInstallations();
    } catch (error) {
      console.error('Error closing lead:', error);
    } finally {
      setClosingLead(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-2 sm:px-3 py-1 rounded text-sm ${
            i === currentPage ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-2 sm:px-3 py-1 rounded text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-2 sm:px-3 py-1 rounded text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-1 rounded text-sm bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">›</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeMenu="Installations" />
      <main className="flex-1 ml-64 overflow-auto">
        {selectedInstallation ? (
          // Installation Details Full Page
          <div className="min-h-screen bg-gray-50">
            {/* Header with Navigation */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Installations</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-900 font-medium">{selectedInstallation?.client_name || 'Installation Details'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {selectedInstallation?.currentStage === 'INSTALLATION_APPROVAL' && (
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve Installation
                    </button>
                  )}
                  <button
                    onClick={goBackToList}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to List
                  </button>
                </div>
              </div>
            </div>

            {/* Installation Details Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {/* Title */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Installation Details</h1>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setSelectedTab('overview')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === 'overview'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setSelectedTab('timeline')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === 'timeline'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Timeline
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {selectedTab === 'overview' ? (
                <div className="space-y-6">

                  {/* Hero Card */}
                  <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl shadow-md p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                      {selectedInstallation.client_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NA'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-white truncate">{selectedInstallation.client_name || 'N/A'}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-teal-100 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {selectedInstallation.phone_number || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1 text-teal-100 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedInstallation.location || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                        {formatStage(selectedInstallation.currentStage) || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plant Capacity</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedInstallation.plantCapacity || '—'}<span className="text-sm font-normal text-gray-500 ml-1">kW</span></p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Units</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedInstallation.avgUnits || '—'}<span className="text-sm font-normal text-gray-500 ml-1">units</span></p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contracted Load</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedInstallation.contractedLoad || '—'}<span className="text-sm font-normal text-gray-500 ml-1">kW</span></p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-2">
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Content Req.</p>
                      <p className="text-xl font-bold text-gray-900">{selectedInstallation.content_requirement || '—'}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Customer Information */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800">Customer Information</h3>
                      </div>
                      <div className="divide-y divide-gray-50">
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Name</span>
                          <span className="text-sm font-semibold text-gray-900 text-right">{selectedInstallation.client_name || 'N/A'}</span>
                        </div>
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Phone</span>
                          <span className="text-sm text-gray-900 text-right font-mono">{selectedInstallation.phone_number || 'N/A'}</span>
                        </div>
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Location</span>
                          <span className="text-sm text-gray-900 text-right">{selectedInstallation.location || 'N/A'}</span>
                        </div>
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Referred By</span>
                          <span className="text-sm text-gray-900 text-right capitalize">{selectedInstallation.referred_by || <span className="text-gray-400 italic">Not specified</span>}</span>
                        </div>
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">Status</span>
                          <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStageColor(selectedInstallation.status)}`}>
                            {selectedInstallation.status || 'N/A'}
                          </span>
                        </div>
                        {/* Close Lead Button for completed installations */}
                        {selectedInstallation?.currentStage === 'installation_completed' && (
                          <div className="px-5 py-3">
                            <button
                              onClick={() => setShowCloseLeadModal(true)}
                              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M12 4v12m8-8H4" />
                              </svg>
                              Close Lead
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Installation & Meta Information */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800">Installation Details</h3>
                      </div>
                      <div className="divide-y divide-gray-50">
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 pt-0.5">Current Stage</span>
                          <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStageColor(selectedInstallation.currentStage)}`}>
                            {formatStage(selectedInstallation.currentStage) || 'N/A'}
                          </span>
                        </div>
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 pt-0.5">Created By</span>
                          <div className="flex items-center gap-2 text-right">
                            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                              {selectedInstallation.created_by?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{selectedInstallation.created_by?.name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 pt-0.5">Created On</span>
                          <span className="text-sm text-gray-900">{formatDate(selectedInstallation.createdAt)}</span>
                        </div>
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 pt-0.5">Last Updated</span>
                          <span className="text-sm text-gray-900">{formatDate(selectedInstallation.updatedAt)}</span>
                        </div>
                        <div className="px-5 py-3 flex items-start justify-between gap-4">
                          <span className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 pt-0.5">Lead ID</span>
                          <span className="text-xs font-mono text-gray-500 break-all text-right">{selectedInstallation._id || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedInstallation.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-800 mb-1">Notes</h4>
                          <p className="text-sm text-amber-900 leading-relaxed">{selectedInstallation.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products from Quote */}
                  <div className="bg-white rounded-xl border-2 border-teal-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-gradient-to-r from-teal-50 to-teal-100/60 border-b border-teal-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-teal-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-teal-900">Quoted Products</h3>
                        <button
                          onClick={refreshQuote}
                          disabled={refreshingQuote}
                          className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-teal-600 bg-white/70 border border-teal-300 rounded hover:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                        >
                          <svg className={`w-3 h-3 mr-1 ${refreshingQuote ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {refreshingQuote ? 'Sync' : 'Sync'}
                        </button>
                      </div>
                      {quoteData && (
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            quoteData.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            quoteData.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{quoteData.status}</span>
                          <span className="text-xs text-teal-700 font-medium">Total: <span className="font-bold">₹{quoteData.amount?.toLocaleString('en-IN') || '—'}</span></span>
                          {quoteData.discount > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{quoteData.discount}% off</span>
                          )}
                        </div>
                      )}
                    </div>

                    {quoteLoading ? (
                      <div className="flex items-center justify-center py-10 gap-3">
                        <svg className="w-5 h-5 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span className="text-sm text-gray-500">Loading products...</span>
                      </div>
                    ) : !quoteData || !quoteData.products?.length ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-sm text-gray-400">No products found for this installation</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {/* Table header */}
                        <div className="grid grid-cols-12 px-5 py-2 bg-gray-50">
                          <span className="col-span-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</span>
                          <span className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</span>
                          <span className="col-span-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</span>
                          <span className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost</span>
                        </div>
                        {quoteData.products.map((item, idx) => (
                          <div key={item._id || idx} className="grid grid-cols-12 px-5 py-3.5 hover:bg-teal-50/40 transition-colors items-center">
                            <div className="col-span-5 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{item.product_id?.product_name || 'N/A'}</span>
                            </div>
                            <div className="col-span-3">
                              <span className="inline-flex px-2 py-0.5 text-xs rounded-md bg-blue-50 text-blue-700 font-medium">{item.product_id?.category || 'N/A'}</span>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-sm font-bold text-gray-700">{item.count}</span>
                            </div>
                            <div className="col-span-2 text-right">
                              <span className="text-sm font-semibold text-gray-900">{item.product_id?.cost || '—'}</span>
                              {item.discount > 0 && (
                                <div className="text-xs text-green-600 font-medium">{item.discount}% off</div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Footer summary */}
                        <div className="px-5 py-3 bg-teal-50 flex items-center justify-between">
                          <span className="text-xs text-teal-700 font-medium">{quoteData.products.length} product{quoteData.products.length !== 1 ? 's' : ''} · {quoteData.noOfKWs} kW · {quoteData.phase?.replace('_', ' ')} · {quoteData.typeOfRoof} roof</span>
                          <span className="text-sm font-bold text-teal-800">₹{quoteData.amount?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Installation Timeline</h3>
                  <div className="space-y-6">
                    {selectedInstallation.timeline && selectedInstallation.timeline.length > 0 ? (
                      selectedInstallation.timeline.map((stage, index) => (
                        <div key={stage._id || index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              stage.state === 'COMPLETED' ? 'bg-green-500' :
                              stage.state === 'ACTIVE' ? 'bg-blue-500' :
                              'bg-gray-300'
                            }`}>
                              {stage.state === 'COMPLETED' ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : stage.state === 'ACTIVE' ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                              )}
                            </div>
                            {index < selectedInstallation.timeline.length - 1 && (
                              <div className={`w-0.5 h-16 mt-2 ${
                                stage.state === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                            )}
                          </div>
                          
                          <div className="flex-1 pb-8">
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{formatStage(stage.title)}</h4>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(stage.state)}`}>
                                  {stage.state}
                                </span>
                              </div>
                              {stage.note && (
                                <p className="text-sm text-gray-700 mb-2">{stage.note}</p>
                              )}
                              <div className="text-xs text-gray-500">
                                <p>{formatDate(stage.updatedAt)}</p>
                                {stage.updatedBy?.name && <p>Updated by: {stage.updatedBy.name}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No timeline data available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Installations List View
          <div className="p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Installations</h1>
                <p className="text-gray-500 mt-1">Manage and track all installation projects</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Filters</h3>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
                >
                  <svg className={`w-3 h-3 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Syncing' : 'Sync'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Search</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by client, phone, location..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">All Status</option>
                    <option value="INSTALLATION_APPROVAL">Installation Approval</option>
                    <option value="LOGISTICS_PREPARATION">Logistics Preparation</option>
                    <option value="INSTALLATION_STARTED">Installation Started</option>
                    <option value="INSTALLATION_COMPLETED">Installation Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="newest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_high">Highest Value</option>
                    <option value="amount_low">Lowest Value</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Items per page</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{sortedInstallations.length}</span> of <span className="font-medium">{installations.length}</span> installations
              </p>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading installations...</p>
              </div>
            ) : sortedInstallations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No installations found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'No installations available.'}
                </p>
              </div>
            ) : (
              // Content wrapper
              <>
                {/* Enhanced Desktop Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CLIENT</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CONTACT</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AVG UNITS</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CAPACITY</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CONTENT REQ.</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">STATUS</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((installation) => (
                          <tr key={installation._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">
                                  {installation.client_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA'}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{installation.client_name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{installation.location || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm text-gray-900">
                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {installation.phone_number || installation.phone || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900">{installation.avgUnits || 'N/A'} units</div>
                              <div className="text-xs text-gray-500">Contracted: {installation.contractedLoad || 'N/A'} kW</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{installation.plantCapacity || 'N/A'} kW</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{installation.content_requirement || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStageColor(installation.currentStage)}`}>
                                {formatStage(installation.currentStage)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(installation.createdAt || installation.created_at)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => viewDetails(installation)}
                                className="text-teal-600 hover:text-teal-700 font-medium text-sm inline-flex items-center"
                              >
                                View
                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Approve Installation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !approving && setShowApproveModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Approve Installation</h3>
                <p className="text-sm text-gray-500">{selectedInstallation?.client_name}</p>
              </div>
            </div>

            {/* Note Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                rows={3}
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Add a note for this approval..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowApproveModal(false); setApproveNote(''); }}
                disabled={approving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={approveInstallation}
                disabled={approving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {approving ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Approving...
                  </>
                ) : (
                  'Confirm Approval'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-sm text-gray-500">{selectedInstallation?.client_name}</p>
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
}

export default Installations;