// ...existing code...
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/images/logo.png';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../utils/apiConfig';

const RegistrationTeamDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [selectedRegistrationTab, setSelectedRegistrationTab] = useState('overview');

  // Handler to update status in local state
  const handleStatusChange = (absoluteIndex, newStatus) => {
    setRegistrations(prevRegs => {
      const updated = [...prevRegs];
      if (updated[absoluteIndex]) {
        updated[absoluteIndex] = {
          ...updated[absoluteIndex],
          status: newStatus
        };
      }
      return updated;
    });
  };

  // Update status via PATCH API
  const handleUpdateStatus = async (item, absoluteIndex) => {
    setRegistrations(prevRegs => {
      const updated = [...prevRegs];
      if (updated[absoluteIndex]) updated[absoluteIndex]._updatingStatus = true;
      return updated;
    });
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${buildApiUrl(API_ENDPOINTS.REGISTRATIONS_UPDATE_TIMELINE)}/${item.lead_id?._id || item.lead_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegistrations(prevRegs => {
        const updated = [...prevRegs];
        if (updated[absoluteIndex]) {
          updated[absoluteIndex]._updatingStatus = false;
        }
        return updated;
      });
    } catch (err) {
      setRegistrations(prevRegs => {
        const updated = [...prevRegs];
        if (updated[absoluteIndex]) updated[absoluteIndex]._updatingStatus = false;
        return updated;
      });
      alert('Failed to update status.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Verify role is 3 (Registration Team)
    if (parsedUser.role !== 3) {
      localStorage.clear();
      navigate('/');
      return;
    }

    setUser(parsedUser);
    fetchAssignedRegistrations(parsedUser.id || parsedUser._id, token);
  }, [navigate]);

  const fetchAssignedRegistrations = async (userId, token) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${buildApiUrl(API_ENDPOINTS.REGISTRATIONS_STAFF_ACTIVE)}/${userId}/active`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        }
      );
      
      console.log('Assigned registrations response:', response.data);
      const data = response.data.data || [];
      setRegistrations(data);
      
      // Calculate stats
      const activeCount = data.filter(reg => 
        reg.lead_id?.currentStage === 'SECOND_LEVEL_REGISTRATION' && 
        reg.lead_id?.timeline?.some(t => t.title === 'SECOND_LEVEL_REGISTRATION' && t.state === 'ACTIVE')
      ).length;
      
      const completedCount = data.filter(reg => 
        reg.lead_id?.timeline?.some(t => t.title === 'SECOND_LEVEL_REGISTRATION' && t.state === 'COMPLETED')
      ).length;
      
      setStats({
        total: data.length,
        active: activeCount,
        completed: completedCount
      });
    } catch (error) {
      console.error('Error fetching assigned registrations:', error);
      setRegistrations([]);
    } finally {
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

  // Helper to determine registration progress for table
  const getRegistrationProgress = (item) => {
    // If timeline exists, check SECOND_LEVEL_REGISTRATION state
    const timeline = item.lead_id?.timeline || [];
    const stage = timeline.find(t => t.title === 'SECOND_LEVEL_REGISTRATION');
    if (!stage) return 'pending';
    if (stage.state === 'COMPLETED') return 'completed';
    if (stage.state === 'ACTIVE') return 'active';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Filter registrations based on search query
  const filteredRegistrations = registrations.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const clientName = item.lead_id?.client_name || '';
    const email = item.registration?.emailId || '';
    const phone = item.registration?.phoneNumber || item.lead_id?.phone_number || '';
    const location = item.lead_id?.location || '';
    
    return (
      clientName.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      phone.includes(searchQuery) ||
      location.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRegistrations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-teal-700 shadow-sm">
        <div className="py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Auxray Energy" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-white">Registration Team Portal</h1>
              <p className="text-teal-100">Welcome back, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-right">
              <div>
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-teal-200">{user.email}</p>
              </div>
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{user.name?.charAt(0)?.toUpperCase()}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-teal-100 hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="px-4">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">My Assigned Registrations</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your assigned registration processes</p>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Assigned</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Now</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search registrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    const userData = localStorage.getItem('user');
                    if (token && userData) {
                      const parsedUser = JSON.parse(userData);
                      fetchAssignedRegistrations(parsedUser.id || parsedUser._id, token);
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-base sm:text-lg mb-1">No registrations found</p>
                <p className="text-gray-400 text-xs sm:text-sm">Try adjusting your search or check back later</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Assigned Team Member
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Plant Capacity (kW)
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Cost Structure
                        </th>
                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Assigned Date
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Update Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((item, index) => (
                        <tr key={item.registration?._id || index} className="hover:bg-gray-50 transition">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-medium text-gray-900">{item.lead_id?.client_name || 'N/A'}</span>
                              <span className="text-xs text-gray-500 mt-1">{item.emailId || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-600">{item.assignedTo?.name || 'N/A'}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-600">{item.phoneNumber || item.lead_id?.phone_number || 'N/A'}</div>
                          </td>
                          <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-600">{item.quote_id?.noOfKWs || 'N/A'} kW</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">₹{item.quote_id?.amount?.toLocaleString('en-IN') || 'N/A'}</div>
                          </td>
                          <td className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              item.costStructure === 'LOAN' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.costStructure || 'N/A'}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-600">{formatDate(item.assignedDate || item.createdAt)}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {getRegistrationProgress(item) === 'completed' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Completed
                              </span>
                            )}
                            {getRegistrationProgress(item) === 'active' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                In Progress
                              </span>
                            )}
                            {getRegistrationProgress(item) === 'pending' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <button 
                              onClick={() => setSelectedRegistration(item)}
                              className="text-teal-600 hover:underline font-semibold"
                            >
                              View
                            </button>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <button
                              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1 rounded shadow disabled:opacity-60"
                              disabled={item._updatingStatus}
                              onClick={() => handleUpdateStatus(item, indexOfFirstItem + index)}
                            >
                              {item._updatingStatus ? 'Updating...' : 'Update Status'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {/* Registration Details Modal Dialog */}
            {selectedRegistration && (
              <>
                {/* Modal Backdrop */}
                <div
                  className="fixed inset-0 bg-black bg-opacity-40 z-40"
                  onClick={() => setSelectedRegistration(null)}
                  aria-label="Close details dialog"
                />
                {/* Modal Content */}
                <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-0">
                  <div className="relative bg-white rounded-2xl shadow-2xl border border-teal-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
                    {/* Header with Tabs */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between px-8 pt-8 pb-4 border-b border-gray-100 relative">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Registration Details</h2>
                        <p className="text-sm text-gray-500">{selectedRegistration.lead_id?.client_name || 'N/A'}</p>
                      </div>
                      <div className="flex gap-6 mt-4 md:mt-0">
                        <button
                          onClick={() => setSelectedRegistrationTab('overview')}
                          className={`pb-2 px-1 font-medium transition border-b-2 ${selectedRegistrationTab === 'overview' ? 'text-teal-600 border-teal-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        >
                          Overview
                        </button>
                        <button
                          onClick={() => setSelectedRegistrationTab('documents')}
                          className={`pb-2 px-1 font-medium transition border-b-2 ${selectedRegistrationTab === 'documents' ? 'text-teal-600 border-teal-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        >
                          Documents
                        </button>
                      </div>
                      <button
                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                        onClick={() => setSelectedRegistration(null)}
                        aria-label="Close"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Content Area */}
                    <div className="p-8">
                      {(!selectedRegistrationTab || selectedRegistrationTab === 'overview') && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Left Column - Client Card, Contact, Assigned */}
                          <div className="lg:col-span-1 space-y-6">
                            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl shadow p-6 text-white">
                              <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                                  {selectedRegistration.lead_id?.client_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA'}
                                </div>
                                <h2 className="text-xl font-bold mb-2">{selectedRegistration.lead_id?.client_name || 'N/A'}</h2>
                                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20">{selectedRegistration.costStructure || 'N/A'}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                                <div className="text-center">
                                  <div className="text-2xl font-bold mb-1">{selectedRegistration.quote_id?.noOfKWs || 'N/A'}</div>
                                  <div className="text-xs text-teal-100 uppercase">Plant (kW)</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold mb-1">₹{selectedRegistration.advancePaid?.toLocaleString('en-IN') || 'N/A'}</div>
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
                                    <p className="text-sm font-medium text-gray-800">{selectedRegistration.phoneNumber || selectedRegistration.lead_id?.phone_number || 'N/A'}</p>
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
                                    <p className="text-sm font-medium text-gray-800 break-all">{selectedRegistration.emailId || 'N/A'}</p>
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
                                    <p className="text-sm font-medium text-gray-800 leading-relaxed">{selectedRegistration.lead_id?.location || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
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
                                    {selectedRegistration.assignedTo?.name?.charAt(0) || 'R'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{selectedRegistration.assignedTo?.name || 'Registration Team'}</p>
                                  <p className="text-sm text-gray-600">{selectedRegistration.assignedTo?.email || ''}</p>
                                </div>
                              </div>
                            </div>
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
                                  <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${selectedRegistration.costStructure === 'LOAN' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                                    {selectedRegistration.costStructure || 'N/A'}
                                  </span>
                                </div>
                                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                  <p className="text-xs text-green-600 font-semibold uppercase mb-1">Advance Paid</p>
                                  <p className="text-2xl font-bold text-green-700">₹{selectedRegistration.advancePaid?.toLocaleString('en-IN') || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Created At</p>
                                  <p className="text-sm font-medium text-gray-900">{formatDate(selectedRegistration.createdAt)}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Last Updated</p>
                                  <p className="text-sm font-medium text-gray-900">{formatDate(selectedRegistration.updatedAt)}</p>
                                </div>
                                <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Registration ID</p>
                                  <p className="text-xs font-mono text-gray-900 break-all">{selectedRegistration._id || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                            {/* Quote Information */}
                            {selectedRegistration.quote_id && (
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
                                    <p className="text-lg font-bold text-gray-900">₹{selectedRegistration.quote_id.amount?.toLocaleString('en-IN') || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Plant Capacity</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedRegistration.quote_id.noOfKWs || 'N/A'} kW</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedRegistrationTab === 'documents' && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Documents
                          </h3>
                          {selectedRegistration.documents?.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                              {selectedRegistration.documents.map((doc, docIndex) => (
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
                </div>
              </>
            )}
          </div>{/* end px-4 */}
        </div>{/* end main */}
      </main>
    </div>
  );
};

export default RegistrationTeamDashboard;
