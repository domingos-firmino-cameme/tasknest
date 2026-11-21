import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import Login from "@/pages/Login"
import Signup from "@/pages/Signup"
import Dashboard from "@/pages/Dashboard"
import ResetPassword from "@/pages/ResetPassword"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"

export default function App() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading && !(import.meta.env.DEV && pathname === "/dashboard")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading...
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={import.meta.env.DEV
          ? <Dashboard />
          : (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}