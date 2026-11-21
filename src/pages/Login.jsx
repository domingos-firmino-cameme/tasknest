import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

export default function Login() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    document.title = "Sign in | Tasknest"
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)

    if (!supabase) {
      setFeedback({
        type: "error",
        message: "Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable login.",
      })
      return
    }

    const formData = new FormData(event.currentTarget)
    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.get("email"),
        password: formData.get("password"),
      })

      if (error) throw error
      navigate("/dashboard", { replace: true })
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Invalid email or password.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-[#202522] dark:bg-[#101311] dark:text-[#f1f3f1]">
      <section className="relative w-full max-w-[440px]">
        <div className="rounded-2xl border border-[#edf0ed] bg-white p-7 shadow-[0_8px_24px_-16px_rgba(27,56,37,0.18)] dark:border-[#2b312d] dark:bg-[#171b18] dark:shadow-[0_8px_24px_-16px_rgba(0,0,0,0.7)] sm:p-9">
          <div className="mb-7 text-center">
            <h1 className="text-[28px] font-semibold tracking-[-0.055em] text-[#202522] dark:text-[#f1f3f1]">
              Sign in
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#737b75] dark:text-[#a3ada6]">
              Sign in to your account to continue.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#303833] dark:text-[#d4dbd6]" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="h-11 rounded-lg border-[#e3e8e4] text-sm placeholder:text-[#a1a8a3] focus-visible:border-[#3ecf8e] focus-visible:ring-[#3ecf8e]/20 dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1] dark:placeholder:text-[#87918a]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#303833] dark:text-[#d4dbd6]" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="h-11 rounded-lg border-[#e3e8e4] text-sm placeholder:text-[#a1a8a3] focus-visible:border-[#3ecf8e] focus-visible:ring-[#3ecf8e]/20 dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1] dark:placeholder:text-[#87918a]"
              />
            </div>

            {feedback && (
              <p
                aria-live="polite"
                className="rounded-lg bg-[#fff1f0] px-3.5 py-3 text-sm leading-5 text-[#b42318] dark:bg-[#321d1c] dark:text-[#ffb4ad]"
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-xs text-[#737b75] dark:text-[#a3ada6]">
              Don&apos;t have an account?{" "}
              <Link className="font-medium text-[#16803c] hover:underline dark:text-[#8bd4a8]" to="/signup">
                Create one
              </Link>
            </p>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#edf0ed] dark:bg-[#2b312d]" />
            <span className="text-xs text-[#9aa19c] dark:text-[#89938c]">simple and secure</span>
            <div className="h-px flex-1 bg-[#edf0ed] dark:bg-[#2b312d]" />
          </div>

          <p className="text-center text-xs leading-5 text-[#8a928c] dark:text-[#89938c]">
            Protected by Supabase authentication
          </p>
        </div>
      </section>
    </main>
  )
}
