import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"

export default function ResetPassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    document.title = "Reset password | Tasknest"
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)

    if (!user || !supabase) {
      setFeedback({ type: "error", message: "This password reset link is invalid or has expired." })
      return
    }

    const formData = new FormData(event.currentTarget)
    const password = formData.get("password")
    const confirmPassword = formData.get("confirmPassword")
    if (password !== confirmPassword) {
      setFeedback({ type: "error", message: "The passwords do not match." })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      navigate("/dashboard", { replace: true })
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update your password.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-[#202522] dark:bg-[#101311] dark:text-[#f1f3f1]">
      <section className="w-full max-w-[440px] rounded-2xl border border-[#edf0ed] bg-white p-7 shadow-[0_8px_24px_-16px_rgba(27,56,37,0.18)] dark:border-[#2b312d] dark:bg-[#171b18] sm:p-9">
        <div className="mb-7 text-center">
          <h1 className="text-[28px] font-semibold tracking-[-0.055em]">Set a new password</h1>
          <p className="mt-2 text-sm leading-6 text-[#737b75] dark:text-[#a3ada6]">
            Choose a new password for your Tasknest account.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-sm text-[#737b75] dark:text-[#a3ada6]">Checking your reset link...</p>
        ) : user ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#303833] dark:text-[#d4dbd6]" htmlFor="password">
                New password
              </label>
              <Input
                autoComplete="new-password"
                className="h-11 rounded-lg border-[#e3e8e4] text-sm dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]"
                id="password"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#303833] dark:text-[#d4dbd6]" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <Input
                autoComplete="new-password"
                className="h-11 rounded-lg border-[#e3e8e4] text-sm dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]"
                id="confirmPassword"
                minLength={8}
                name="confirmPassword"
                required
                type="password"
              />
            </div>
            {feedback && (
              <p
                aria-live="polite"
                className="rounded-lg bg-[#fff1f0] px-3.5 py-3 text-sm text-[#b42318] dark:bg-[#321d1c] dark:text-[#ffb4ad]"
                role="alert"
              >
                {feedback.message}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-lg bg-[#3ecf8e] text-sm font-semibold text-[#073b24] shadow-sm transition-colors hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30"
            >
              {isSubmitting ? "Updating password..." : "Update password"}
            </Button>
          </form>
        ) : (
          <p className="text-center text-sm leading-6 text-[#737b75] dark:text-[#a3ada6]">
            This reset link is invalid or has expired.{" "}
            <Link className="font-medium underline underline-offset-2" to="/login">
              Return to sign in
            </Link>
            .
          </p>
        )}
      </section>
    </main>
  )
}
