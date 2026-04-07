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

function App() {
  return (
    <Router>
      <Routes>
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
      </Routes>
    </Router>
  );
}

export default App;
