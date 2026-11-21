import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading...
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
