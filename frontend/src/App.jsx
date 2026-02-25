import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HostDashboard from './pages/HostDashboard';
import TeamDashboard from './pages/TeamDashboard';
import AuroraBackground from './components/AuroraBackground';

function App() {
  return (
    <AuroraBackground>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/team/:teamId" element={<TeamDashboard />} />
      </Routes>
    </AuroraBackground>
  );
}

export default App;
