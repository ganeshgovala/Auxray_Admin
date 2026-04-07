import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import { getCachedInstallationsData, setCachedInstallationsData } from '../utils/cacheManager';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../utils/apiConfig';

function Installations() {
  const navigate = useNavigate();
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInstallation, setSelectedInstallation] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(user);
    if (parsedUser.role !== 4 && parsedUser.role !== 5) {
      navigate('/');
      return;
    }

    loadInstallations();
  }, [navigate]);

  const loadInstallations = () => {
    // Check if we have cached data
    const cachedData = getCachedInstallationsData();

    if (cachedData) {
      setInstallations(cachedData);
      setLoading(false);
      return;
    }

    // Fetch fresh data
    fetchInstallations();
  };

  const fetchInstallations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${buildApiUrl(API_ENDPOINTS.LEADS_INSTALLATIONS)}?status=active`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        }
      );
      
      const data = response.data;
      const installationsArray = data.data || [];
      setInstallations(installationsArray);
      setCachedInstallationsData(installationsArray);
    } catch (error) {
      console.error('Error fetching installations:', error);
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
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatStage = (stage) => {
    if (!stage) return 'N/A';
    return stage.replace(/_/g, ' ').toUpperCase();
  };

  const getStageColor = (stage) => {
    switch(stage?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredInstallations = installations.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const clientName = item.client_name || '';
    const phone = item.phone_number || '';
    const location = item.location || '';
    const stage = formatStage(item.currentStage);
    
    return (
      clientName.toLowerCase().includes(searchLower) ||
      phone.includes(searchQuery) ||
      location.toLowerCase().includes(searchLower) ||
      stage.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInstallations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInstallations.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const viewDetails = (installation) => {
    setSelectedInstallation(installation);
    setSelectedTab('overview');
    setShowDetails(true);
  };

  const goBackToList = () => {
    setSelectedInstallation(null);
    setShowDetails(false);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded ${
            currentPage === i
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-1 rounded text-sm bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">‹</span>
        </button>
        {pages}
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeMenu="Installations" />
      
      <div className="flex-1 ml-0 lg:ml-64">
        {showDetails && selectedInstallation ? (
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
                  <span className="text-gray-900 font-medium">{selectedInstallation.client_name}</span>
                </div>
                <button
                  onClick={goBackToList}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Installations
                </button>
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
              {selectedTab === 'overview' && (
                <div className="space-y-6">
                  {/* Client Information Card */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                        <p className="text-gray-900">{selectedInstallation.client_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <p className="text-gray-900">{selectedInstallation.phone_number || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <p className="text-gray-900">{selectedInstallation.location || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Stage</label>
                        <p className="text-gray-900">{formatStage(selectedInstallation.currentStage)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created On</label>
                        <p className="text-gray-900">{formatDate(selectedInstallation.createdAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                        <p className="text-gray-900">{formatDate(selectedInstallation.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'timeline' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Installation Timeline</h3>
                  <div className="space-y-6">
                    {selectedInstallation.timeline && selectedInstallation.timeline.length > 0 ? (
                      selectedInstallation.timeline.map((stage, index) => (
                        <div key={stage._id || index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              stage.status === 'completed' 
                                ? 'bg-green-100 text-green-600' 
                                : stage.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            </div>
                            {index < selectedInstallation.timeline.length - 1 && (
                              <div className="w-px h-8 bg-gray-300 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex items-center mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 mr-2">{stage.state}</h4>
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
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Mobile Header */}
            <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">Installations</h2>
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Header */}
            <div className="mb-6 lg:mb-8 hidden lg:block">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Installations</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage installation processes and track progress</p>
            </div>

            {/* Search and Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search installations..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  >
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12 sm:py-20">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-teal-600"></div>
                </div>
              ) : currentItems.length === 0 ? (
                <div className="text-center py-12 sm:py-20 px-4">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500 text-base sm:text-lg mb-1">No installations found</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Try adjusting your search</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Client Info
                          </th>
                          <th className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Plant Details
                          </th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Current Stage
                          </th>
                          <th className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Created By
                          </th>
                          <th className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Created Date
                          </th>
                          <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentItems.map((installation) => (
                          <tr key={installation._id} className="hover:bg-gray-50 transition">
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">{installation.client_name}</p>
                                <p className="text-xs sm:text-sm text-gray-600">{installation.phone_number}</p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{installation.location}</p>
                              </div>
                            </td>
                            <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm">
                                <p className="font-medium text-gray-900">{installation.plant_capacity || 'N/A'} kW</p>
                                <p className="text-xs text-gray-500">{installation.average_units || 'N/A'} units</p>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="flex flex-col items-start gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  installation.currentStage !== 'Pending' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {formatStage(installation.currentStage)}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Status: {installation.status}</p>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm">
                                <p className="font-medium text-gray-900">{installation.created_by?.name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{installation.created_by?.email || ''}</p>
                              </div>
                            </td>
                            <td className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                              {formatDate(installation.createdAt)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <button
                                onClick={() => viewDetails(installation)}
                                className="text-teal-600 hover:text-teal-800 font-medium text-xs sm:text-sm flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="hidden sm:inline">View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs sm:text-sm text-gray-600">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInstallations.length)} of {filteredInstallations.length} results
                      </div>
                      <div className="flex items-center gap-2">
                        {renderPagination()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Installations;