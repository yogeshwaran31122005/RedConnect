import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from './api/auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'

function ProtectedRoute({ children }) {
  const location = useLocation()
  return isLoggedIn() ? children : <Navigate to="/" state={{ from: location }} replace />
}

function PublicRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/home" replace /> : children
}

function App() {
  // HashRouter (/#/register) instead of BrowserRouter: static hosts like
  // Render serve index.html only at / - deep links such as /register return
  // 404 "Not Found" unless a /* -> /index.html rewrite rule is configured
  // on the server. Hash routing needs no server config: refresh and direct
  // open of /#/register always work.
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App