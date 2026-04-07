import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import { getCachedDashboardData, setCachedDashboardData, clearDashboardCache } from '../utils/cacheManager';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../utils/apiConfig';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Verify role is 4 (Child Admin) or 5 (Super Admin)
    if (parsedUser.role !== 4 && parsedUser.role !== 5) {
      localStorage.clear();
      navigate('/');
      return;
    }

    setUser(parsedUser);
    loadDashboardData(token);
  }, [navigate]);

  const loadDashboardData = async (token) => {
    // Check if we have cached data
    const cachedData = getCachedDashboardData();

    if (cachedData) {
      // Use cached data
      setLeads(cachedData.leads || []);
      setQuotes(cachedData.quotes || []);
      setReminders(cachedData.reminders || []);
      setRegistrations(cachedData.registrations || []);
      setTeamMembers(cachedData.teamMembers || []);
      setLoading(false);
      return;
    }

    // Fetch fresh data
    await fetchAllData(token);
  };

  const fetchAllData = async (token) => {
    try {
      const [leadsRes, quotesRes, remindersRes, registrationsRes, teamRes] = await Promise.all([
        axios.get(buildApiUrl(API_ENDPOINTS.LEADS_ALL), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(buildApiUrl(API_ENDPOINTS.QUOTES_ALL), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(buildApiUrl(API_ENDPOINTS.LEADS_UPCOMING_REMINDERS), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(buildApiUrl(API_ENDPOINTS.REGISTRATIONS_PENDING), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(buildApiUrl(API_ENDPOINTS.USERS_BY_ROLE), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const leadsData = leadsRes.data.leads || [];
      const quotesData = quotesRes.data.quotes || [];
      const remindersData = remindersRes.data.leads || [];
      const regData = registrationsRes.data;
      const registrationsData = Array.isArray(regData) ? regData : (regData.registrations || []);
      const teamMembersData = teamRes.data.users || [];

      setLeads(leadsData);
      setQuotes(quotesData);
      setReminders(remindersData);
      setRegistrations(registrationsData);
      setTeamMembers(teamMembersData);

      // Cache the data
      const dataToCache = {
        leads: leadsData,
        quotes: quotesData,
        reminders: remindersData,
        registrations: registrationsData,
        teamMembers: teamMembersData
      };
      setCachedDashboardData(dataToCache);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-green-100 text-green-700',
      'WARM': 'bg-yellow-100 text-yellow-700',
      'HOT': 'bg-red-100 text-red-700',
      'CLOSED': 'bg-gray-200 text-gray-700',
      'PENDING': 'bg-blue-100 text-blue-700',
      'APPROVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
      'MODIFY': 'bg-orange-100 text-orange-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  // Calculate statistics
  const stats = {
    totalLeads: leads.length,
    openLeads: leads.filter(l => l.status === 'OPEN').length,
    warmLeads: leads.filter(l => l.status === 'WARM').length,
    hotLeads: leads.filter(l => l.status === 'HOT').length,
    totalQuotes: quotes.length,
    pendingQuotes: quotes.filter(q => q.status === 'PENDING').length,
    approvedQuotes: quotes.filter(q => q.status === 'APPROVED').length,
    rejectedQuotes: quotes.filter(q => q.status === 'REJECTED').length,
    modifyQuotes: quotes.filter(q => q.status === 'MODIFY').length,
    totalReminders: reminders.length,
    totalRegistrations: registrations.length,
    totalTeamMembers: teamMembers.length,
    activeTeamMembers: teamMembers.filter(t => t.isActive).length
  };

  // Lead stages distribution
  const stageDistribution = leads.reduce((acc, lead) => {
    acc[lead.currentStage] = (acc[lead.currentStage] || 0) + 1;
    return acc;
  }, {});

  // Recent quotes (last 5)
  const recentQuotes = [...quotes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Recent leads (last 5)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        activeMenu="Dashboard" 
        quotesCount={stats.pendingQuotes}
        leadsCount={stats.openLeads}
        remindersCount={stats.totalReminders}
      />
      
      {loading ? (
        <div className="flex-1 ml-64 p-8 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 ml-64 p-8 bg-gray-50">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.name || 'Admin'}! Here's your business overview.</p>
          </div>
          <button
            onClick={() => {
              clearDashboardCache();
              setLoading(true);
              const token = localStorage.getItem('token');
              fetchAllData(token);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-medium"
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Top Stats Grid - 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {/* Total Leads */}
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-100 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Leads</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
          </div>

          {/* Pending Quotes */}
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-teal-50 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingQuotes}</p>
          </div>

          {/* Reminders */}
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-100 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Reminders</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReminders}</p>
          </div>

          {/* Registrations */}
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-100 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Registrations</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRegistrations}</p>
          </div>

          {/* Approved Quotes */}
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-100 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Approved</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.approvedQuotes}</p>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-100 p-2.5 rounded-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Team</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeTeamMembers}</p>
          </div>
        </div>

        {/* Lead & Quote Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lead Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Lead Status Distribution
            </h2>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Open Leads</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.openLeads}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${stats.totalLeads > 0 ? (stats.openLeads / stats.totalLeads) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Warm Leads</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.warmLeads}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-yellow-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${stats.totalLeads > 0 ? (stats.warmLeads / stats.totalLeads) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Hot Leads</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.hotLeads}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-red-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${stats.totalLeads > 0 ? (stats.hotLeads / stats.totalLeads) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Quote Status Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingQuotes}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-medium">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedQuotes}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-medium">Modify</p>
                <p className="text-2xl font-bold text-gray-900">{stats.modifyQuotes}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-medium">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedQuotes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Stage Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Quotes */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Quotes
              </h2>
              <button 
                onClick={() => navigate('/quotes')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition"
              >
                View All →
              </button>
            </div>
            <div className="space-y-2">
              {recentQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400 text-sm">No quotes yet</p>
                </div>
              ) : (
                recentQuotes.map((quote) => (
                  <div 
                    key={quote._id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer group"
                    onClick={() => navigate(`/quotes/${quote._id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 group-hover:text-teal-600 transition">{quote.lead_id?.client_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{quote.lead_id?.location || 'N/A'}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-semibold text-gray-900">₹{quote.amount?.toLocaleString('en-IN') || '0'}</p>
                      <p className="text-xs text-gray-400">{formatDate(quote.createdAt)}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lead Stage Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Pipeline Stages
            </h2>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {Object.keys(stageDistribution).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              ) : (
                Object.entries(stageDistribution).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 flex-1 font-medium">{stage.replace(/_/g, ' ')}</p>
                    <span className="bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Leads Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Recent Leads
              </h2>
              <button 
                onClick={() => navigate('/leads')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-400 text-sm">No leads yet</p>
                    </td>
                  </tr>
                ) : (
                  recentLeads.map((lead) => (
                    <tr 
                      key={lead._id} 
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{lead.client_name}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{lead.location}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{lead.phone_number}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-500">{formatDate(lead.createdAt)}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
