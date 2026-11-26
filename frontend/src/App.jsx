import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import CampaignListing from './pages/CampaignListing';
import CampaignDetails from './pages/CampaignDetails';
import Login from './pages/Login';
import Register from './pages/Register';

// Creator Pages
import CreatorDashboard from './pages/CreatorDashboard';
import CreateCampaign from './pages/CreateCampaign';

// Donor Pages
import DonorDashboard from './pages/DonorDashboard';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import CampaignReview from './pages/CampaignReview';
import AIRiskAnalysis from './pages/AIRiskAnalysis';
import SettlementManagement from './pages/SettlementManagement';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/campaigns" element={<CampaignListing />} />
              <Route path="/campaigns/:id" element={<CampaignDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Creator Protected Routes */}
              <Route
                path="/creator/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['creator']}>
                    <CreatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/create"
                element={
                  <ProtectedRoute allowedRoles={['creator', 'admin']}>
                    <CreateCampaign />
                  </ProtectedRoute>
                }
              />

              {/* Donor Protected Routes */}
              <Route
                path="/donor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['donor']}>
                    <DonorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/campaigns"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CampaignReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ai-risk"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AIRiskAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settlements"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SettlementManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
