import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import { getCachedTeamMembersData, setCachedTeamMembersData, clearTeamMembersCache } from '../utils/cacheManager';
import { buildApiUrl, API_ENDPOINTS } from '../utils/apiConfig';

const TeamMembers = () => {
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL PERSONALLS');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobileNumber: '',
    role: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const navigate = useNavigate();

  const departments = ['ALL PERSONALLS', 'SALES EXECUTIVE', 'LEAD MANAGER', 'INSTALLATION MANAGER', 'REGISTRATION STAFF', 'CHILD ADMIN', 'SUPER ADMIN'];

  // Role mapping
  const getRoleName = (role) => {
    const roleMap = {
      0: 'SALES EXECUTIVE',
      1: 'LEAD MANAGER',
      2: 'INSTALLATION MANAGER',
      3: 'REGISTRATION STAFF',
      4: 'CHILD ADMIN',
      5: 'SUPER ADMIN'
    };
    return roleMap[role] || 'UNKNOWN';
  };

  const getRoleNumber = (roleName) => {
    const roleMap = {
      'SALES EXECUTIVE': 0,
      'LEAD MANAGER': 1,
      'INSTALLATION MANAGER': 2,
      'REGISTRATION STAFF': 3,
      'CHILD ADMIN': 4,
      'SUPER ADMIN': 5
    };
    return roleMap[roleName];
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(userData));
    loadTeamMembers(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadTeamMembers = (token) => {
    // Check if we have cached data
    const cachedData = getCachedTeamMembersData();

    if (cachedData) {
      setTeamMembers(cachedData);
      setLoading(false);
      return;
    }

    // Fetch fresh data
    fetchTeamMembers(token);
  };

  const fetchTeamMembers = async (token) => {
    try {
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.USERS_BY_ROLE),
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const formattedMembers = response.data.users.map(member => ({
        id: member._id,
        name: member.name,
        email: member.email,
        department: getRoleName(member.role),
        mobile: member.mobileNumber || 'N/A',
        role: member.role,
        isActive: member.isActive,
        lastLoginAt: member.lastLoginAt
      }));
      
      setTeamMembers(formattedMembers);
      setCachedTeamMembersData(formattedMembers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');

    try {
      await axios.post(
        buildApiUrl(API_ENDPOINTS.CREATE_USER),
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          mobileNumber: formData.mobileNumber,
          role: getRoleNumber(formData.role)
        },
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Team member created successfully!');
      
      // Clear cache and refresh team members list
      clearTeamMembersCache();
      fetchTeamMembers(token);
      
      // Reset form and close modal after a short delay
      setTimeout(() => {
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          mobileNumber: '',
          role: ''
        });
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      mobileNumber: '',
      role: ''
    });
    setError('');
    setSuccess('');
  };

  const handleDeleteMember = (member) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    setDeleting(true);
    const token = localStorage.getItem('token');

    try {
      await axios.delete(
        `${buildApiUrl(API_ENDPOINTS.USER_DELETE)}/${memberToDelete.id}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Clear cache and refresh team members list
      clearTeamMembersCache();
      fetchTeamMembers(token);
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert(error.response?.data?.message || 'Failed to delete team member. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '', // Don't populate password for security
      mobileNumber: member.mobile || '',
      role: getRoleNumber(member.department).toString()
    });
    setShowEditModal(true);
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const token = localStorage.getItem('token');

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        role: parseInt(formData.role),
        isActive: true
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await axios.put(
        `${buildApiUrl('/api/users')}/${editingMember.id}`,
        updateData,
        {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Team member updated successfully!');
      setTimeout(() => {
        handleModalClose();
        clearTeamMembersCache();
        fetchTeamMembers(token);
      }, 1500);
    } catch (error) {
      console.error('Error updating team member:', error);
      setError(error.response?.data?.message || 'Failed to update team member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMemberToDelete(null);
  };

  if (!user) return null;

  const filteredMembers = teamMembers.filter(member => {
    const matchesFilter = activeFilter === 'ALL PERSONALLS' || member.department === activeFilter;
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeMenu="TeamMembers" />
      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">TeamMembers</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search database"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Member
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 mb-6">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveFilter(dept)}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition duration-200 ${
                  activeFilter === dept
                    ? 'bg-teal-700 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Team Members Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading team members...</div>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No team members found.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-teal-700 rounded-lg flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-4 py-1.5 rounded-full border border-teal-200">
                        {member.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-800 font-medium">{member.mobile}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleEditClick(member)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteMember(member)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Edit Member Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                <h2 className="text-2xl font-bold text-white">Edit Team Member</h2>
                <p className="text-blue-100 text-sm mt-1">Update team member information</p>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEditMember} className="p-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                    {success}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter email"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password (leave empty to keep current)</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter new password (optional)"
                    />
                  </div>

                  {/* Mobile Number Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                    <input
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>

                  {/* Department Select */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="0">Sales Executive</option>
                      <option value="1">Lead Manager</option>
                      <option value="2">Installation Manager</option>
                      <option value="3">Registration Staff</option>
                      <option value="4">Child Admin</option>
                      <option value="5">Super Admin</option>
                    </select>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              {/* Modal Header */}
              <div className="bg-teal-800 px-6 py-5 relative">
                <h3 className="text-2xl font-bold text-white mb-1">Add Team Member</h3>
                <p className="text-xs text-teal-200 uppercase tracking-wider font-medium">Member Configuration</p>
                <button
                  onClick={handleModalClose}
                  className="absolute top-4 right-4 text-white hover:bg-teal-700 rounded-full p-2 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                    <p className="text-sm">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleAddMember} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                      placeholder="email@company.com"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                      placeholder="Enter password"
                      required
                    />
                  </div>

                  {/* Department and Mobile Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Department */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Department</label>
                      <select 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800 bg-white appearance-none cursor-pointer"
                        required
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1.25rem'
                        }}
                      >
                        <option value="">Select</option>
                        <option value="SALES EXECUTIVE">Sales Executive</option>
                        <option value="LEAD MANAGER">Lead Manager</option>
                        <option value="INSTALLATION MANAGER">Installation Manager</option>
                        <option value="REGISTRATION STAFF">Registration Staff</option>
                        <option value="CHILD ADMIN">Child Admin</option>
                        <option value="SUPER ADMIN">Super Admin</option>
                      </select>
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                        placeholder="9876543210"
                        required
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition duration-200 disabled:opacity-50"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'ADDING...' : 'ADD MEMBER'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && memberToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Modal Header */}
              <div className="bg-red-600 px-6 py-5 relative">
                <h3 className="text-2xl font-bold text-white mb-1">Confirm Delete</h3>
                <p className="text-xs text-red-100 uppercase tracking-wider font-medium">This action cannot be undone</p>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Delete Team Member</h4>
                    <p className="text-gray-600 mb-3">
                      Are you sure you want to delete <span className="font-semibold text-gray-800">{memberToDelete.name}</span>?
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Email:</span> {memberToDelete.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {memberToDelete.department}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    disabled={deleting}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Delete Member'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeamMembers;
