import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';

function Sidebar({ activeMenu, quotesCount = 0, leadsCount = 0, remindersCount = 0 }) {
  const navigate = useNavigate();

  const handleNavigation = (menu) => {
    switch(menu) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'TeamMembers':
        navigate('/team-members');
        break;
      case 'Inventory':
        navigate('/inventory');
        break;
      case 'Leads':
        navigate('/leads');
        break;
      case 'Quotes':
        navigate('/quotes');
        break;
      case 'Reminders':
        navigate('/reminders');
        break;
      case 'Registrations':
        navigate('/registrations');
        break;
      case 'Installations':
        navigate('/installations');
        break;
      case 'Profile':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="hidden lg:flex w-64 bg-gradient-to-b from-teal-700 to-teal-900 text-white flex-col fixed h-screen z-40">
      {/* Logo */}
      <div className="p-6 flex items-center justify-center">
        <img src={logo} alt="Auxray Admin" className="h-12 w-auto mb-4 mt-4" />
      </div>
      
      {/* Main Menu */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="text-xs text-teal-300 font-semibold mb-3 px-3">MAIN MENU</p>
        <div className="space-y-1">
          <button 
            onClick={() => handleNavigation('Dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              activeMenu === 'Dashboard' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => handleNavigation('TeamMembers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              activeMenu === 'TeamMembers' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium">Team Members</span>
          </button>
          <button 
            onClick={() => handleNavigation('Inventory')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              activeMenu === 'Inventory' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-sm font-medium">Inventory</span>
          </button>
        </div>

        {/* Pipeline Section */}
        <p className="text-xs text-teal-300 font-semibold mb-3 px-3 mt-8">PIPELINE</p>
        <div className="space-y-1">
          <button 
            onClick={() => handleNavigation('Leads')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
              activeMenu === 'Leads' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Leads Created</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeMenu === 'Leads' ? 'bg-teal-100' : 'bg-teal-700'
            }`}>{leadsCount}</span>
          </button>
          <button 
            onClick={() => handleNavigation('Quotes')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
              activeMenu === 'Quotes' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm">Quote Requests</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeMenu === 'Quotes' ? 'bg-teal-100' : 'bg-teal-700'
            }`}>{quotesCount}</span>
          </button>
          <button 
            onClick={() => handleNavigation('Registrations')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
              activeMenu === 'Registrations' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Registrations</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeMenu === 'Registrations' ? 'bg-teal-100' : 'bg-teal-700'
            }`}>0</span>
          </button>
          <button 
            onClick={() => handleNavigation('Installations')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
              activeMenu === 'Installations' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm">Installations</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeMenu === 'Installations' ? 'bg-teal-100' : 'bg-teal-700'
            }`}>0</span>
          </button>
          <button 
            onClick={() => handleNavigation('Reminders')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
              activeMenu === 'Reminders' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm">Reminders</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeMenu === 'Reminders' ? 'bg-teal-100' : 'bg-teal-700'
            }`}>{remindersCount}</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-teal-600">
        <button 
          onClick={() => handleNavigation('Profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition mb-2 ${
            activeMenu === 'Profile' ? 'bg-white text-teal-800' : 'text-white hover:bg-teal-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm">Profile</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-red-600 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
