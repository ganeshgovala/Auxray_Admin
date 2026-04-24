import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Profile from './components/Profile';
import TeamMembers from './components/TeamMembers';
import Reminders from './components/Reminders';
import LeadsCreated from './components/LeadsCreated';
import LeadDetails from './components/LeadDetails';
import QuoteRequests from './components/QuoteRequests';
import QuoteDetails from './components/QuoteDetails';
import Registrations from './components/Registrations';
import RegistrationDetails from './components/RegistrationDetails';
import Installations from './components/Installations';
import RegistrationTeamDashboard from './components/RegistrationTeamDashboard';
import RegistrationTeamDetails from './components/RegistrationTeamDetails';

const SHOW_ACCESS_BLOCK_PAGE = true;

function AccessBlockedPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 20% 15%, #fef3c7 0%, transparent 40%), radial-gradient(circle at 80% 20%, #e0f2fe 0%, transparent 38%), linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif"
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          borderRadius: '24px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 24px 60px rgba(2, 6, 23, 0.12)',
          padding: '40px 32px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            margin: '0 auto 18px',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fee2e2 0%, #ffedd5 100%)',
            border: '1px solid #fecaca'
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M17 10V7a5 5 0 0 0-10 0v3"
              stroke="#b91c1c"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="4"
              y="10"
              width="16"
              height="10"
              rx="2"
              stroke="#b91c1c"
              strokeWidth="1.8"
            />
            <circle cx="12" cy="15" r="1" fill="#b91c1c" />
          </svg>
        </div>

        <h1
          style={{
            margin: '0 0 12px',
            color: '#0f172a',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.02em'
          }}
        >
          Access Restricted
        </h1>

        <p
          style={{
            margin: '0 auto',
            color: '#334155',
            fontSize: '17px',
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: '640px',
            lineHeight: 1.7
          }}
        >
          You dont have access to this website - Please contact administrator to get the access
        </p>
      </div>
    </div>
  );
}

function LegacyAppRoutes() {
  return (
    <>
      <Route path="/" element={<Login />} />
      <Route path="/registration-team" element={<RegistrationTeamDashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/registration-team/registration/:id" element={<RegistrationTeamDetails />} />
      <Route path="/leads" element={<LeadsCreated />} />
      <Route path="/leads/:leadId" element={<LeadDetails />} />
      <Route path="/quotes" element={<QuoteRequests />} />
      <Route path="/quotes/:quoteId" element={<QuoteDetails />} />
      <Route path="/registrations" element={<Registrations />} />
      <Route path="/registrations/:registrationId" element={<RegistrationDetails />} />
      <Route path="/installations" element={<Installations />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/team-members" element={<TeamMembers />} />
      <Route path="/reminders" element={<Reminders />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {SHOW_ACCESS_BLOCK_PAGE ? (
          <Route path="*" element={<AccessBlockedPage />} />
        ) : (
          <LegacyAppRoutes />
        )}
      </Routes>
    </Router>
  );
}

export default App;
