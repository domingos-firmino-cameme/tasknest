import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

export default function Signup() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    document.title = "Create account | Tasknest"
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setFeedback(null)

    if (!supabase) {
      setFeedback({
        type: "error",
        message: "Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable signup.",
      })
      return
    }

    const formData = new FormData(form)
    const fullName = formData.get("fullName")
    const email = formData.get("email")
    const password = formData.get("password")

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (error) throw error

      setFeedback({
        type: "success",
        message: data.session
          ? "Account created successfully. Welcome!"
          : `We sent a confirmation link to ${email}.`,
      })
      form.reset()
      if (data.session) {
        navigate("/dashboard", { replace: true })
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "We couldn't create your account. Please try again.",
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
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#737b75] dark:text-[#a3ada6]">
              Organize your workspace in one place.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#303833] dark:text-[#d4dbd6]" htmlFor="fullName">
                Full name
              </label>
              <div className="relative">
                <UserRound aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-[#929a94]" />
                <Input
                  autoComplete="name"
                  className="h-11 rounded-lg border-[#e3e8e4] pl-10 text-sm placeholder:text-[#a1a8a3] focus-visible:border-[#3ecf8e] focus-visible:ring-[#3ecf8e]/20 dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1] dark:placeholder:text-[#87918a]"
                  id="fullName"
                  name="fullName"
                  placeholder="What should we call you?"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#303833] dark:text-[#d4dbd6]" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-[#929a94]" />
                <Input
                  autoComplete="email"
                  className="h-11 rounded-lg border-[#e3e8e4] pl-10 text-sm placeholder:text-[#a1a8a3] focus-visible:border-[#3ecf8e] focus-visible:ring-[#3ecf8e]/20 dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1] dark:placeholder:text-[#87918a]"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#303833] dark:text-[#d4dbd6]" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-[#929a94]" />
                <Input
                  autoComplete="new-password"
                  className="h-11 rounded-lg border-[#e3e8e4] px-10 text-sm placeholder:text-[#a1a8a3] focus-visible:border-[#3ecf8e] focus-visible:ring-[#3ecf8e]/20 dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1] dark:placeholder:text-[#87918a]"
                  id="password"
                  minLength={8}
                  name="password"
                  placeholder="At least 8 characters"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#16803c] transition-colors hover:text-[#073b24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#16803c] dark:text-[#9bd9ad] dark:hover:text-[#3ecf8e]"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword
                    ? <EyeOff aria-hidden="true" className="size-[17px]" />
                    : <Eye aria-hidden="true" className="size-[17px]" />}
                </button>
              </div>
              <p className="text-xs text-[#8a928c] dark:text-[#89938c]">Use at least 8 characters.</p>
            </div>

            {feedback && (
              <p
                aria-live="polite"
                className={`rounded-lg px-3.5 py-3 text-sm leading-5 ${
                  feedback.type === "success"
                    ? "bg-[#edf8f0] text-[#176b36] dark:bg-[#192a20] dark:text-[#9bd9ad]"
                    : "bg-[#fff1f0] text-[#b42318] dark:bg-[#321d1c] dark:text-[#ffb4ad]"
                }`}
                role={feedback.type === "error" ? "alert" : "status"}
              >
                {feedback.message}
              </p>
            )}

            <Button
              className="h-11 w-full rounded-lg bg-[#3ecf8e] text-sm font-semibold text-[#073b24] shadow-sm transition-colors hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                "Creating your account..."
              ) : (
                <>
                  Create account
                  <ArrowRight aria-hidden="true" className="ml-1 size-4" />
                </>
              )}
            </Button>

            <label className="flex items-start gap-2.5 text-xs leading-5 text-[#737b75] dark:text-[#a3ada6]" htmlFor="privacyAgreement">
              <input
                id="privacyAgreement"
                name="privacyAgreement"
                type="checkbox"
                required
                className="mt-0.5 size-4 shrink-0 accent-[#16803c]"
              />
              <span>
                I have read and agree to the{" "}
                <a className="font-medium text-[#303833] underline underline-offset-2 dark:text-[#d4dbd6]" href="/terms">
                  Terms of Use
                </a>{" "}
                and{" "}
                <a className="font-medium text-[#303833] underline underline-offset-2 dark:text-[#d4dbd6]" href="/privacy">
                  Privacy Policy
                </a>.
              </span>
            </label>

            <p className="text-center text-xs text-[#737b75] dark:text-[#a3ada6]">
              Already have an account?{" "}
              <Link className="font-medium text-[#16803c] hover:underline dark:text-[#8bd4a8]" to="/login">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
