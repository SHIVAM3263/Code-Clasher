import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Arena from './pages/Arena'
import Battle from './pages/Battle'
import Problems from './pages/Problems'
import ProblemDetail from './pages/ProblemDetail'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)', fontSize: 18, animation: 'pulse-glow 1.5s infinite' }}>
        INITIALIZING...
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const location = useLocation()
  // Hide navbar during active battles so players can't navigate away
  const inBattle = location.pathname.startsWith('/battle/')

  return (
    <>
      {!inBattle && <Navbar />}
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/arena"             element={<ProtectedRoute><Arena /></ProtectedRoute>} />
        <Route path="/battle/:roomCode"  element={<ProtectedRoute><Battle /></ProtectedRoute>} />
        <Route path="/problems"          element={<ProtectedRoute><Problems /></ProtectedRoute>} />
        <Route path="/problems/:slug"    element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
        <Route path="/leaderboard"       element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/profile/:id?"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
