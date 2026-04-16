import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAuth, RequireRole, RequireGodMode } from './components/RouteGuards'
import useAuthStore from './store/authStore'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import AthleteDashboard from './pages/AthleteDashboard'
import VideoUpload from './pages/VideoUpload'
import AthleteProfile from './pages/AthleteProfile'
import SubmissionDetail from './pages/SubmissionDetail'
import CoachApply from './pages/CoachApply'
import CoachDashboard from './pages/CoachDashboard'
import CoachExplore from './pages/CoachExplore'
import CoachProfile from './pages/CoachProfile'
import AdminDashboard from './pages/AdminDashboard'
import AdminApplications from './pages/AdminApplications'
import AdminTeam from './pages/AdminTeam'
import GodModePanel from './pages/GodModePanel'
import AdminLogin from './pages/AdminLogin'

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Router>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/coach/apply" element={
              <RequireAuth>
                <CoachApply />
              </RequireAuth>
            } />

            {/* Athlete */}
            <Route path="/athlete/dashboard" element={
              <RequireRole role={['athlete']}>
                <AthleteDashboard />
              </RequireRole>
            } />
            <Route path="/athlete/upload" element={
              <RequireRole role={['athlete']}>
                <VideoUpload />
              </RequireRole>
            } />
            <Route path="/athlete/submission/:id" element={
              <RequireRole role={['athlete', 'coach', 'admin', 'founder']}>
                <SubmissionDetail />
              </RequireRole>
            } />
            <Route path="/athlete/:id" element={<AthleteProfile />} />

            {/* Coach */}
            <Route path="/coach/dashboard" element={
              <RequireRole role={['coach', 'admin', 'founder']}>
                <CoachDashboard />
              </RequireRole>
            } />
            <Route path="/coach/explore" element={
              <RequireRole role={['coach', 'admin', 'founder']}>
                <CoachExplore />
              </RequireRole>
            } />
            <Route path="/coach/:id" element={<CoachProfile />} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={
              <RequireRole role={['admin', 'founder', 'reviewer']}>
                <AdminDashboard />
              </RequireRole>
            } />
            <Route path="/admin/applications" element={
              <RequireRole role={['admin', 'founder', 'reviewer']}>
                <AdminApplications />
              </RequireRole>
            } />
            <Route path="/admin/team" element={
              <RequireRole role={['admin', 'founder']}>
                <AdminTeam />
              </RequireRole>
            } />

            {/* God Mode */}
            <Route path="/god-mode" element={
              <RequireGodMode>
                <GodModePanel />
              </RequireGodMode>
            } />
          </Route>
        </Routes>
      </Router>
    </>
  )
}
