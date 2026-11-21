import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowRight,
  Check,
  Camera,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { supabase } from "@/lib/supabase"

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    description: "A calm place to organize your work.",
    features: ["3 active projects", "Personal project boards", "Project progress overview"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 12,
    description: "For people who want to get more done.",
    features: ["Unlimited projects", "Advanced reports", "Automations and integrations"],
  },
  {
    id: "team",
    name: "Team",
    price: 29,
    description: "A shared workspace for teams of up to 10.",
    features: ["Everything in Pro", "Team roles and shared boards", "Priority support"],
  },
]

const projectStatuses = {
  planning: { label: "Planned", className: "bg-[#f1f2f0] text-[#59615b] dark:bg-[#252a26] dark:text-[#c2cbc4]" },
  in_progress: { label: "In progress", className: "bg-[#eef1ef] text-[#59615b] dark:bg-[#252a26] dark:text-[#c2cbc4]" },
  completed: { label: "Completed", className: "bg-[#edf5ef] text-[#526b58] dark:bg-[#1d2a20] dark:text-[#b8d5bf]" },
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function getGreeting(date) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function getLocalDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="gap-4 border-[#eceeeb] bg-white p-5 shadow-[0_6px_20px_-18px_rgba(27,56,37,0.2)] dark:border-[#2b312d] dark:bg-[#171b18]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#737b75] dark:text-[#a3ada6]">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#f4f5f3] text-[#59615b] dark:bg-[#252a26] dark:text-[#c2cbc4]">
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <span className="text-[27px] font-semibold leading-none tracking-[-0.05em]">{value}</span>
    </Card>
  )
}

function ProjectCard({ project, onStatusChange, onDelete, busy }) {
  const status = projectStatuses[project.status] || projectStatuses.planning

  return (
    <Card className="gap-4 border-[#eceeeb] bg-white p-5 shadow-[0_6px_24px_-20px_rgba(27,56,37,0.2)] dark:border-[#2b312d] dark:bg-[#171b18]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{project.name}</h3>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#737b75] dark:text-[#a3ada6]">
              {project.description}
            </p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-[#eff1ef] pt-3 text-xs text-[#737b75] dark:border-[#2b312d] dark:text-[#a3ada6]">
        <span>
          {project.due_date
            ? `Due ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${project.due_date}T00:00:00Z`))}`
            : `Created ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(project.created_at))}`}
        </span>
        <div className="flex items-center gap-1">
          {project.status !== "completed" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onStatusChange(project, "completed")}
              className="h-8 px-2 text-xs text-[#16803c] hover:bg-[#edf8f0] dark:text-[#9bd9ad] dark:hover:bg-[#192a20]"
            >
              <Check aria-hidden="true" />
              Complete
            </Button>
          )}
          {project.status === "completed" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onStatusChange(project, "in_progress")}
              className="h-8 px-2 text-xs text-[#16803c] hover:bg-[#edf8f0] dark:text-[#9bd9ad] dark:hover:bg-[#192a20]"
            >
              Reopen
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={busy}
            aria-label={`Delete ${project.name}`}
            onClick={() => onDelete(project)}
            className="size-8 text-[#16803c] hover:bg-[#edf8f0] hover:text-[#176b36] dark:text-[#9bd9ad] dark:hover:bg-[#192a20]"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(Boolean(user))
  const [projectsError, setProjectsError] = useState("")
  const [projectsRefresh, setProjectsRefresh] = useState(0)
  const [projectBusy, setProjectBusy] = useState("")
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectDueDate, setProjectDueDate] = useState("")
  const [projectStatus, setProjectStatus] = useState("planning")
  const [subscription, setSubscription] = useState(null)
  const [billingBusy, setBillingBusy] = useState("")
  const [notice, setNotice] = useState(null)
  const [logoutError, setLogoutError] = useState("")
  const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || "")
  const [profileBusy, setProfileBusy] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "")
  const [avatarBusy, setAvatarBusy] = useState(false)
  const avatarInputRef = useRef(null)
  const [now, setNow] = useState(() => new Date())
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => window.localStorage.getItem("tasknest-email-notifications") !== "false"
  )

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
  const email = user?.email || ""
  const firstName = fullName.split(" ")[0]
  const currentPlan = subscription?.plan_id || "starter"
  const currentPlanName = plans.find((plan) => plan.id === currentPlan)?.name || "Starter"
  const initials = getInitials(fullName || "U")
  const projectCounts = useMemo(() => ({
    total: projects.length,
    inProgress: projects.filter((project) => project.status === "in_progress").length,
    completed: projects.filter((project) => project.status === "completed").length,
    planned: projects.filter((project) => project.status === "planning").length,
  }), [projects])

  useEffect(() => {
    document.title = "Dashboard | Tasknest"
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setProfileName(user?.user_metadata?.full_name || "")
    setAvatarUrl(user?.user_metadata?.avatar_url || "")
  }, [user?.id, user?.user_metadata?.full_name, user?.user_metadata?.avatar_url])

  useEffect(() => {
    let active = true

    async function loadProjects() {
      if (!user || !supabase) {
        setProjects([])
        setProjectsError("")
        setProjectsLoading(false)
        return
      }

      setProjectsLoading(true)
      setProjectsError("")
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, description, status, due_date, created_at")
          .order("created_at", { ascending: false })

        if (error) throw error
        if (active) setProjects(data || [])
      } catch (error) {
        if (active) {
          setProjects([])
          setProjectsError(
            error instanceof Error
              ? `Unable to load projects: ${error.message}`
              : "We couldn't load your projects. Check your connection and try again."
          )
        }
      } finally {
        if (active) setProjectsLoading(false)
      }
    }

    loadProjects()
    return () => { active = false }
  }, [user?.id, projectsRefresh])

  useEffect(() => {
    let active = true

    async function loadSubscription() {
      if (!user || !supabase) {
        setSubscription(null)
        return
      }

      const { data, error } = await supabase
        .from("billing_subscriptions")
        .select("stripe_subscription_id, plan_id, status, current_period_end")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!active) return
      if (error) {
        setNotice({ type: "error", message: "We couldn't load your billing status." })
        return
      }
      setSubscription(data)
    }

    loadSubscription()
    return () => { active = false }
  }, [user?.id])

  useEffect(() => {
    const billingStatus = searchParams.get("billing")
    if (billingStatus === "success") {
      setNotice({ type: "success", message: "Checkout completed. Your plan will update when Stripe confirms the subscription." })
    } else if (billingStatus === "cancelled") {
      setNotice({ type: "info", message: "Checkout was cancelled. No payment was made." })
    }
  }, [searchParams])

  useEffect(() => {
    window.localStorage.setItem("tasknest-email-notifications", String(notificationsEnabled))
  }, [notificationsEnabled])

  async function handleSignOut() {
    setLogoutError("")
    try {
      await signOut()
      navigate("/login", { replace: true })
    } catch {
      setLogoutError("We couldn't sign you out. Please try again.")
    }
  }

  async function handleCreateProject(event) {
    event.preventDefault()
    setNotice(null)

    if (!user || !supabase) {
      setNotice({ type: "error", message: "Sign in to create and save projects to your account." })
      return
    }

    const name = projectName.trim()
    if (!name) {
      setNotice({ type: "error", message: "Enter a project name." })
      return
    }

    setProjectBusy("create")
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          owner_id: user.id,
          name,
          description: projectDescription.trim() || null,
          due_date: projectDueDate || null,
          status: projectStatus,
        })
        .select("id, name, description, status, due_date, created_at")
        .single()

      if (error) throw error
      setProjects((currentProjects) => [data, ...currentProjects])
      setProjectsError("")
      setProjectName("")
      setProjectDescription("")
      setProjectDueDate("")
      setProjectStatus("planning")
      setShowProjectForm(false)
      setActiveTab("projects")
      setNotice({ type: "success", message: "Project created." })
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to create the project. Please try again.",
      })
    } finally {
      setProjectBusy("")
    }
  }

  async function handleProjectStatusChange(project, status) {
    if (!supabase || !user) return
    setNotice(null)
    setProjectBusy(project.id)
    try {
      const { data, error } = await supabase
        .from("projects")
        .update({ status })
        .eq("id", project.id)
        .select("id, name, description, status, due_date, created_at")
        .single()

      if (error) throw error
      setProjects((currentProjects) => currentProjects.map((item) => item.id === data.id ? data : item))
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update the project.",
      })
    } finally {
      setProjectBusy("")
    }
  }

  async function handleDeleteProject(project) {
    if (!supabase || !user) return
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return

    setNotice(null)
    setProjectBusy(project.id)
    try {
      const { error } = await supabase.from("projects").delete().eq("id", project.id)
      if (error) throw error
      setProjects((currentProjects) => currentProjects.filter((item) => item.id !== project.id))
      setNotice({ type: "success", message: "Project deleted." })
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete the project.",
      })
    } finally {
      setProjectBusy("")
    }
  }

  function handleCancelProject() {
    setShowProjectForm(false)
    setProjectName("")
    setProjectDescription("")
    setProjectDueDate("")
    setProjectStatus("planning")
  }

  async function handlePurchase(planId) {
    setNotice(null)
    if (!user || !supabase) {
      setNotice({ type: "error", message: "Sign in to start a Stripe test checkout." })
      return
    }
    if (subscription) {
      await handleManageBilling()
      return
    }

    setBillingBusy(planId)
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { planId },
      })
      if (error) throw error
      const checkoutUrl = new URL(data?.url)
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
        throw new Error("Stripe returned an unexpected checkout URL.")
      }
      window.location.assign(checkoutUrl.href)
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to start checkout. Please try again.",
      })
      setBillingBusy("")
    }
  }

  async function handleManageBilling() {
    setNotice(null)
    if (!user || !supabase) return

    setBillingBusy("portal")
    try {
      const { data, error } = await supabase.functions.invoke("create-billing-portal-session")
      if (error) throw error
      const portalUrl = new URL(data?.url)
      if (portalUrl.protocol !== "https:" || portalUrl.hostname !== "billing.stripe.com") {
        throw new Error("Stripe returned an unexpected billing portal URL.")
      }
      window.location.assign(portalUrl.href)
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to open billing settings.",
      })
      setBillingBusy("")
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault()
    setNotice(null)
    if (!supabase || !user) {
      setNotice({ type: "error", message: "Sign in to save profile changes." })
      return
    }

    const trimmedName = profileName.trim()
    if (!trimmedName) {
      setNotice({ type: "error", message: "Please enter your name." })
      return
    }

    setProfileBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: trimmedName } })
      if (error) throw error
      setNotice({ type: "success", message: "Your profile has been updated." })
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update your profile.",
      })
    } finally {
      setProfileBusy(false)
    }
  }

  async function handleAvatarUpload(event) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ""
    if (!file) return

    if (!user || !supabase) {
      setNotice({ type: "error", message: "Sign in to add a profile photo." })
      return
    }

    if (file.size >= 10 * 1024 * 1024) {
      setNotice({ type: "error", message: "Choose an image smaller than 10 MB." })
      return
    }

    const extensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    }
    const extension = extensions[file.type]
    if (!extension) {
      setNotice({ type: "error", message: "Choose a PNG, JPEG, WebP, or GIF image." })
      return
    }

    setNotice(null)
    setAvatarBusy(true)
    const avatarPath = `${user.id}/${crypto.randomUUID()}.${extension}`
    const storage = supabase.storage.from("avatars")

    try {
      const { data: uploadedFile, error: uploadError } = await storage.upload(avatarPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data } = storage.getPublicUrl(uploadedFile.path)
      const { error: profileError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl },
      })

      if (profileError) {
        const { error: cleanupError } = await storage.remove([uploadedFile.path])
        if (cleanupError) {
          throw new Error(`${profileError.message} The uploaded image could not be removed.`)
        }
        throw profileError
      }

      setAvatarUrl(data.publicUrl)
      setNotice({ type: "success", message: "Profile photo updated." })
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to upload your profile photo.",
      })
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handlePasswordReset() {
    setNotice(null)
    if (!supabase || !user?.email) {
      setNotice({ type: "error", message: "Sign in with an email account to request a password reset." })
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setNotice({ type: "success", message: `Password reset instructions were sent to ${user.email}.` })
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to send password reset instructions.",
      })
    }
  }

  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(now),
    [now]
  )

  return (
    <main className="min-h-screen bg-white text-[#202522] dark:bg-[#101311] dark:text-[#f1f3f1]">
      <header className="border-b border-[#eceeeb] bg-white dark:border-[#2b312d] dark:bg-[#151916]">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="size-8" />
            <div>
              <p className="text-sm font-semibold tracking-[-0.03em]">Tasknest</p>
              <p className="text-[11px] text-[#8a928c] dark:text-[#89938c]">Project workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              aria-label="Choose a profile photo"
              onChange={handleAvatarUpload}
            />
            <>
              {user && (
                <div className="hidden text-right sm:block">
                  <p className="max-w-48 truncate text-sm font-medium">{fullName}</p>
                  <p className="max-w-48 truncate text-xs text-[#8a928c] dark:text-[#89938c]">{email}</p>
                </div>
              )}
              <button
                type="button"
                aria-label="Upload profile photo"
                title="Upload profile photo"
                disabled={avatarBusy}
                onClick={() => avatarInputRef.current?.click()}
                className="relative rounded-full disabled:cursor-wait disabled:opacity-60"
              >
                <Avatar>
                  <AvatarImage src={avatarUrl} alt={fullName || "Profile"} />
                  <AvatarFallback className="bg-[#f0f1ef] text-xs font-medium text-[#59615b] dark:bg-[#262c28] dark:text-[#c2cbc4]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-white bg-[#3ecf8e] text-[#073b24] dark:border-[#151916]">
                  <Camera className="size-3" />
                </span>
              </button>
              {user && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Sign out"
                  onClick={handleSignOut}
                  className="text-[#16803c] hover:bg-[#edf8f0] hover:text-[#073b24] dark:text-[#9bd9ad] dark:hover:bg-[#192a20]"
                >
                  <LogOut aria-hidden="true" />
                </Button>
              )}
            </>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-9 flex flex-col items-center gap-4 text-center">
          <div className="max-w-3xl">
            <p className="text-sm text-[#737b75] dark:text-[#a3ada6]">{formattedDate}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              {firstName ? `${getGreeting(now)}, ${firstName}` : getGreeting(now)}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#737b75] dark:text-[#a3ada6]">
              {projects.length
                ? "Here’s what’s happening across your projects."
                : "Create a project to get your workspace started."}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowProjectForm(true)
              setActiveTab("projects")
            }}
            className="h-10 rounded-lg bg-[#3ecf8e] px-4 text-sm font-semibold text-[#073b24] shadow-sm transition-colors hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30"
          >
            <Plus aria-hidden="true" />
            Create a project
          </Button>
        </div>

        {logoutError && (
          <p className="mb-4 rounded-lg bg-[#fff1f0] px-4 py-3 text-sm text-[#b42318] dark:bg-[#321d1c] dark:text-[#ffb4ad]" role="alert">
            {logoutError}
          </p>
        )}
        {notice && (
          <div
            aria-live="polite"
            className={`mb-4 flex items-start justify-between gap-4 rounded-lg px-4 py-3 text-sm ${
              notice.type === "error"
                ? "bg-[#fff1f0] text-[#b42318] dark:bg-[#321d1c] dark:text-[#ffb4ad]"
                : notice.type === "success"
                  ? "bg-[#edf5ef] text-[#425c48] dark:bg-[#1d2a20] dark:text-[#b8d5bf]"
                  : "bg-[#f0f2f0] text-[#505852] dark:bg-[#242a26] dark:text-[#d4dbd6]"
            }`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            <span>{notice.message}</span>
            <button type="button" className="shrink-0 text-[#16803c] underline underline-offset-2 hover:text-[#073b24] dark:text-[#9bd9ad]" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-5 overflow-x-auto rounded-none border-b border-[#e8ebe8] p-0 dark:border-[#2b312d]"
          >
            <TabsTrigger value="overview" className="h-11 flex-none gap-2 rounded-none px-1 text-[#737b75] after:bottom-[-1px] after:bg-[#9da69f] data-active:text-[#202522] dark:text-[#a3ada6] dark:data-active:text-[#f1f3f1]">
              <LayoutDashboard aria-hidden="true" /> Overview
            </TabsTrigger>
            <TabsTrigger value="projects" className="h-11 flex-none gap-2 rounded-none px-1 text-[#737b75] after:bottom-[-1px] after:bg-[#9da69f] data-active:text-[#202522] dark:text-[#a3ada6] dark:data-active:text-[#f1f3f1]">
              <FolderKanban aria-hidden="true" /> Projects
            </TabsTrigger>
            <TabsTrigger value="settings" className="h-11 flex-none gap-2 rounded-none px-1 text-[#737b75] after:bottom-[-1px] after:bg-[#9da69f] data-active:text-[#202522] dark:text-[#a3ada6] dark:data-active:text-[#f1f3f1]">
              <Settings aria-hidden="true" /> Settings
            </TabsTrigger>
            <TabsTrigger value="plans" className="h-11 flex-none gap-2 rounded-none px-1 text-[#737b75] after:bottom-[-1px] after:bg-[#9da69f] data-active:text-[#202522] dark:text-[#a3ada6] dark:data-active:text-[#f1f3f1]">
              <CreditCard aria-hidden="true" /> Plans & billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={FolderKanban} label="Total projects" value={projectsLoading || projectsError ? "—" : projectCounts.total} />
              <StatCard icon={LayoutDashboard} label="In progress" value={projectsLoading || projectsError ? "—" : projectCounts.inProgress} />
              <StatCard icon={Check} label="Completed" value={projectsLoading || projectsError ? "—" : projectCounts.completed} />
              <StatCard icon={LayoutDashboard} label="Planned" value={projectsLoading || projectsError ? "—" : projectCounts.planned} />
            </div>

            <Card className="gap-0 border-[#eceeeb] bg-white py-0 shadow-[0_6px_24px_-20px_rgba(27,56,37,0.2)] dark:border-[#2b312d] dark:bg-[#171b18]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#eceeeb] px-5 py-4 dark:border-[#2b312d]">
                <div>
                  <CardTitle className="text-sm font-semibold">Projects</CardTitle>
                  <CardDescription className="mt-1">Projects you have created</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab("projects")} className="dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]">
                  View all <ArrowRight aria-hidden="true" />
                </Button>
              </CardHeader>
              <CardContent className="p-5">
                {projectsLoading ? (
                  <p className="py-5 text-center text-sm text-[#737b75] dark:text-[#a3ada6]">Loading projects...</p>
                ) : projectsError ? (
                  <div className="flex flex-col items-center py-9 text-center">
                    <p className="text-sm text-[#737b75] dark:text-[#a3ada6]" role="alert">{projectsError}</p>
                    <Button type="button" variant="outline" onClick={() => setProjectsRefresh((current) => current + 1)} className="mt-3 border-[#b8e4c8] bg-[#f0fbf4] text-[#176b36] hover:bg-[#e1f7eb] dark:border-[#285f44] dark:bg-[#192a20] dark:text-[#9bd9ad] dark:hover:bg-[#213a2b]">
                      Retry
                    </Button>
                  </div>
                ) : projects.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.slice(0, 3).map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onStatusChange={handleProjectStatusChange}
                        onDelete={handleDeleteProject}
                        busy={projectBusy === project.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-9 text-center">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#f2f3f1] text-[#59615b] dark:bg-[#252a26] dark:text-[#c2cbc4]">
                      <FolderKanban aria-hidden="true" className="size-5" />
                    </span>
                    <h2 className="mt-4 text-sm font-semibold">No projects yet</h2>
                    <p className="mt-1 max-w-sm text-sm leading-5 text-[#737b75] dark:text-[#a3ada6]">
                      Create your first project to start organizing your work.
                    </p>
                    <Button type="button" onClick={() => { setShowProjectForm(true); setActiveTab("projects") }} className="mt-4 bg-[#3ecf8e] text-[#073b24] hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30">
                      <Plus aria-hidden="true" /> Create a project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-0 space-y-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">Projects</h2>
                <p className="mt-1 text-sm text-[#737b75] dark:text-[#a3ada6]">
                  {projects.length} {projects.length === 1 ? "project" : "projects"}
                </p>
              </div>
              {!showProjectForm && (
                <Button type="button" onClick={() => setShowProjectForm(true)} className="h-9 w-fit bg-[#3ecf8e] text-[#073b24] hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30">
                  <Plus aria-hidden="true" /> New project
                </Button>
              )}
            </div>

            {showProjectForm && (
              <Card className="gap-0 border-[#eceeeb] bg-white py-0 shadow-[0_6px_24px_-20px_rgba(27,56,37,0.2)] dark:border-[#2b312d] dark:bg-[#171b18]">
                <CardHeader className="border-b border-[#eff1ef] px-5 py-4 dark:border-[#2b312d]">
                  <CardTitle className="text-sm font-semibold">Create a project</CardTitle>
                  <CardDescription>Add a name and optional details for your project.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreateProject}>
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="projectName" className="text-xs font-medium text-[#59615b] dark:text-[#c2cbc4]">
                        Project name
                      </label>
                      <Input
                        id="projectName"
                        autoFocus
                        maxLength={100}
                        required
                        value={projectName}
                        onChange={(event) => setProjectName(event.target.value)}
                        placeholder="Enter a project name"
                        className="h-10 border-[#e3e8e4] dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="projectDescription" className="text-xs font-medium text-[#59615b] dark:text-[#c2cbc4]">
                        Description <span className="font-normal text-[#8a928c]">(optional)</span>
                      </label>
                      <textarea
                        id="projectDescription"
                        maxLength={1000}
                        value={projectDescription}
                        onChange={(event) => setProjectDescription(event.target.value)}
                        placeholder="What is this project about?"
                        rows={3}
                        className="w-full resize-y rounded-lg border border-[#e3e8e4] bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#a1a8a3] focus-visible:border-[#929a94] focus-visible:ring-2 focus-visible:ring-[#929a94]/20 dark:border-[#343c36] dark:text-[#f1f3f1] dark:placeholder:text-[#87918a]"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2 sm:max-w-xs">
                      <label htmlFor="projectDueDate" className="text-xs font-medium text-[#59615b] dark:text-[#c2cbc4]">
                        Due date <span className="font-normal text-[#8a928c]">(optional)</span>
                      </label>
                      <Input
                        id="projectDueDate"
                        type="date"
                        min={getLocalDateInputValue(new Date())}
                        value={projectDueDate}
                        onChange={(event) => setProjectDueDate(event.target.value)}
                        className="h-10 border-[#e3e8e4] dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2 sm:max-w-xs">
                      <label htmlFor="projectStatus" className="text-xs font-medium text-[#59615b] dark:text-[#c2cbc4]">
                        Status
                      </label>
                      <select
                        id="projectStatus"
                        value={projectStatus}
                        onChange={(event) => setProjectStatus(event.target.value)}
                        className="h-10 w-full rounded-lg border border-[#e3e8e4] bg-white px-3 text-sm text-[#202522] outline-none focus-visible:border-[#929a94] focus-visible:ring-2 focus-visible:ring-[#929a94]/20 dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]"
                      >
                        <option value="planning">Planned</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                      <Button type="button" variant="outline" disabled={projectBusy === "create"} onClick={handleCancelProject} className="border-[#b8e4c8] bg-[#f0fbf4] text-[#176b36] hover:bg-[#e1f7eb] dark:border-[#285f44] dark:bg-[#192a20] dark:text-[#9bd9ad] dark:hover:bg-[#213a2b]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={projectBusy === "create"} className="bg-[#3ecf8e] text-[#073b24] hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30">
                        {projectBusy === "create" ? "Creating..." : "Create project"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {projectsLoading ? (
              <p className="py-12 text-center text-sm text-[#737b75] dark:text-[#a3ada6]">Loading projects...</p>
            ) : projectsError ? (
              <Card className="border-[#eceeeb] bg-white py-0 shadow-none dark:border-[#2b312d] dark:bg-[#171b18]">
                <CardContent className="flex flex-col items-center px-5 py-12 text-center">
                  <p className="text-sm text-[#737b75] dark:text-[#a3ada6]" role="alert">{projectsError}</p>
                  <Button type="button" variant="outline" onClick={() => setProjectsRefresh((current) => current + 1)} className="mt-3 border-[#b8e4c8] bg-[#f0fbf4] text-[#176b36] hover:bg-[#e1f7eb] dark:border-[#285f44] dark:bg-[#192a20] dark:text-[#9bd9ad] dark:hover:bg-[#213a2b]">
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : projects.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onStatusChange={handleProjectStatusChange}
                    onDelete={handleDeleteProject}
                    busy={projectBusy === project.id}
                  />
                ))}
              </div>
            ) : !showProjectForm ? (
              <Card className="border-[#eceeeb] bg-white py-0 shadow-none dark:border-[#2b312d] dark:bg-[#171b18]">
                <CardContent className="flex flex-col items-center px-5 py-12 text-center">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[#f2f3f1] text-[#59615b] dark:bg-[#252a26] dark:text-[#c2cbc4]">
                    <FolderKanban aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">Your projects will appear here</h3>
                  <p className="mt-1 max-w-sm text-sm text-[#737b75] dark:text-[#a3ada6]">
                    Create a project to start organizing your work.
                  </p>
                  <Button type="button" onClick={() => setShowProjectForm(true)} className="mt-4 bg-[#3ecf8e] text-[#073b24] hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30">
                    <Plus aria-hidden="true" /> Create a project
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="mb-5">
              <h2 className="text-xl font-semibold tracking-[-0.04em]">Settings</h2>
              <p className="mt-1 text-sm text-[#737b75] dark:text-[#a3ada6]">Manage your profile and preferences.</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
              <Card className="gap-0 border-[#eceeeb] bg-white py-0 shadow-[0_6px_24px_-20px_rgba(27,56,37,0.2)] dark:border-[#2b312d] dark:bg-[#171b18]">
                <CardHeader className="border-b border-[#eff1ef] px-5 py-4 dark:border-[#2b312d]">
                  <CardTitle className="text-sm font-semibold">Personal information</CardTitle>
                  <CardDescription>Update the name shown on your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-5">
                  {user && (
                    <>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Upload profile photo"
                        disabled={avatarBusy}
                        onClick={() => avatarInputRef.current?.click()}
                        className="rounded-full disabled:cursor-wait disabled:opacity-60"
                      >
                        <Avatar size="lg">
                          <AvatarImage src={avatarUrl} alt={fullName} />
                          <AvatarFallback className="bg-[#f0f1ef] font-medium text-[#59615b] dark:bg-[#262c28] dark:text-[#c2cbc4]">{initials}</AvatarFallback>
                        </Avatar>
                      </button>
                      <Button type="button" variant="outline" disabled={avatarBusy} onClick={() => avatarInputRef.current?.click()} className="h-9 text-xs dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]">
                        <Camera aria-hidden="true" />
                        {avatarBusy ? "Uploading..." : "Change photo"}
                      </Button>
                      <div>
                        <p className="text-sm font-medium">{fullName}</p>
                        <p className="mt-0.5 text-xs text-[#8a928c] dark:text-[#89938c]">{email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#8a928c] dark:text-[#89938c]">
                      PNG, JPEG, WebP, or GIF. Must be smaller than 10 MB.
                    </p>
                    </>
                  )}
                  <form className="space-y-4" onSubmit={handleSaveProfile}>
                    <div className="space-y-2">
                      <label htmlFor="displayName" className="text-xs font-medium text-[#59615b] dark:text-[#c2cbc4]">Display name</label>
                      <Input id="displayName" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Your name" className="h-10 border-[#e3e8e4] dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="accountEmail" className="text-xs font-medium text-[#59615b] dark:text-[#c2cbc4]">Email address</label>
                      <Input id="accountEmail" value={email} readOnly placeholder="Sign in to view your email" className="h-10 border-[#e3e8e4] bg-[#f7f8f7] dark:border-[#343c36] dark:bg-[#202521] dark:text-[#a3ada6]" />
                    </div>
                    <Button type="submit" disabled={profileBusy} className="bg-[#3ecf8e] text-[#073b24] hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30">
                      {profileBusy ? "Saving..." : "Save profile"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-5">
                <Card className="gap-0 border-[#eceeeb] bg-white py-0 shadow-[0_6px_24px_-20px_rgba(27,56,37,0.2)] dark:border-[#2b312d] dark:bg-[#171b18]">
                  <CardHeader className="border-b border-[#eff1ef] px-5 py-4 dark:border-[#2b312d]">
                    <CardTitle className="text-sm font-semibold">Preferences</CardTitle>
                    <CardDescription>Make Tasknest work for you.</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y divide-[#eff1ef] px-5 dark:divide-[#2b312d]">
                    <div className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3">
                        {theme === "light" ? <Moon aria-hidden="true" className="size-4 text-[#737b75]" /> : <Sun aria-hidden="true" className="size-4 text-[#a3ada6]" />}
                        <div>
                          <p className="text-sm font-medium">Appearance</p>
                          <p className="mt-0.5 text-xs text-[#8a928c] dark:text-[#89938c]">{theme === "light" ? "Light theme" : "Dark theme"}</p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} aria-pressed={theme === "dark"} className="h-9 shrink-0 dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]">
                        {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
                        {theme === "light" ? "Dark" : "Light"}
                      </Button>
                    </div>
                    <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3">
                        <Settings aria-hidden="true" className="size-4 text-[#737b75] dark:text-[#a3ada6]" />
                        <div>
                          <p className="text-sm font-medium">Email reminders</p>
                          <p className="mt-0.5 text-xs text-[#8a928c] dark:text-[#89938c]">Saved in this browser.</p>
                        </div>
                      </div>
                      <input type="checkbox" checked={notificationsEnabled} onChange={(event) => setNotificationsEnabled(event.target.checked)} className="size-4 accent-[#59615b]" aria-label="Enable email reminders" />
                    </label>
                  </CardContent>
                </Card>

                <Card className="gap-0 border-[#eceeeb] bg-white py-0 shadow-[0_6px_24px_-20px_rgba(27,56,37,0.2)] dark:border-[#2b312d] dark:bg-[#171b18]">
                  <CardHeader className="border-b border-[#eff1ef] px-5 py-4 dark:border-[#2b312d]">
                    <CardTitle className="text-sm font-semibold">Security and billing</CardTitle>
                    <CardDescription>Manage account access and subscription.</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y divide-[#eff1ef] px-5 dark:divide-[#2b312d]">
                    <div className="flex items-center justify-between gap-3 py-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck aria-hidden="true" className="size-4 text-[#737b75] dark:text-[#a3ada6]" />
                        <div>
                          <p className="text-sm font-medium">Password</p>
                          <p className="mt-0.5 text-xs text-[#8a928c] dark:text-[#89938c]">Managed securely by Supabase.</p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" disabled={!user} onClick={handlePasswordReset} className="h-9 shrink-0 text-xs dark:border-[#343c36] dark:bg-[#1d221f] dark:text-[#f1f3f1]">
                        Reset
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-4">
                      <div className="flex items-center gap-3">
                        <CreditCard aria-hidden="true" className="size-4 text-[#737b75] dark:text-[#a3ada6]" />
                        <div>
                          <p className="text-sm font-medium">Subscription</p>
                          <p className="mt-0.5 text-xs text-[#8a928c] dark:text-[#89938c]">{currentPlanName} plan</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveTab("plans")} className="text-xs font-medium text-[#59615b] hover:underline dark:text-[#c2cbc4]">Manage</button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="mt-0">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">Plans that scale with your work</h2>
                <p className="mt-1 text-sm text-[#737b75] dark:text-[#a3ada6]">Simple monthly pricing. Upgrade or cancel at any time.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f0f1ef] px-3 py-1.5 text-xs font-medium text-[#59615b] dark:bg-[#252a26] dark:text-[#c2cbc4]">
                <span className="size-1.5 rounded-full bg-[#8b948d]" />
                Stripe test mode
              </span>
            </div>

            {subscription && (
              <Card className="mb-5 gap-0 border-[#e8ebe8] bg-[#f6f7f5] py-0 shadow-none dark:border-[#2b312d] dark:bg-[#171b18]">
                <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-semibold">Your {currentPlanName} subscription is {subscription.status}</p>
                    <p className="mt-1 text-xs text-[#737b75] dark:text-[#a3ada6]">
                      {subscription.current_period_end
                        ? `Current billing period ends ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(subscription.current_period_end))}.`
                        : "Manage your subscription and payment method in Stripe."}
                    </p>
                  </div>
                  <Button type="button" variant="outline" disabled={billingBusy === "portal"} onClick={handleManageBilling} className="shrink-0 border-[#b8e4c8] bg-[#f0fbf4] text-[#176b36] hover:bg-[#e1f7eb] dark:border-[#285f44] dark:bg-[#192a20] dark:text-[#9bd9ad] dark:hover:bg-[#213a2b]">
                    <CreditCard aria-hidden="true" />
                    {billingBusy === "portal" ? "Opening..." : "Manage subscription"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = currentPlan === plan.id
                const isPaid = plan.id !== "starter"
                return (
                  <Card key={plan.id} className={`flex flex-col gap-5 border-[#e8ebe8] bg-white p-5 shadow-[0_6px_24px_-20px_rgba(27,56,37,0.2)] dark:border-[#2b312d] dark:bg-[#171b18] ${plan.id === "pro" ? "ring-1 ring-[#d9dedb]" : ""}`}>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold">{plan.name}</h3>
                        {isCurrent && <span className="rounded-full bg-[#f0f1ef] px-2.5 py-1 text-[11px] font-medium text-[#59615b] dark:bg-[#252a26] dark:text-[#c2cbc4]">Current plan</span>}
                      </div>
                      <p className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-semibold tracking-[-0.06em]">${plan.price}</span>
                        <span className="text-sm text-[#8a928c] dark:text-[#89938c]">/ month</span>
                      </p>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-[#737b75] dark:text-[#a3ada6]">{plan.description}</p>
                    </div>
                    <ul className="flex-1 space-y-3 border-t border-[#eff1ef] pt-4 text-sm text-[#59615b] dark:border-[#2b312d] dark:text-[#c2cbc4]">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#7b857d]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      disabled={!isPaid || isCurrent || Boolean(billingBusy)}
                      variant={isCurrent ? "outline" : "default"}
                      onClick={() => isPaid && handlePurchase(plan.id)}
                      className={isCurrent
                        ? "w-full border-[#b8e4c8] bg-[#f0fbf4] text-[#176b36] hover:bg-[#e1f7eb] dark:border-[#285f44] dark:bg-[#192a20] dark:text-[#9bd9ad] dark:hover:bg-[#213a2b]"
                        : "w-full bg-[#3ecf8e] text-[#073b24] hover:bg-[#32bd80] focus-visible:ring-[#3ecf8e]/30"}
                    >
                      {isCurrent
                        ? "Current plan"
                        : billingBusy === plan.id
                          ? "Connecting to Stripe..."
                          : isPaid
                            ? subscription
                              ? "Manage in Stripe"
                              : `Choose ${plan.name}`
                            : "Included"}
                    </Button>
                  </Card>
                )
              })}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-[#e8ebe8] bg-white p-4 text-xs leading-5 text-[#737b75] dark:border-[#2b312d] dark:bg-[#171b18] dark:text-[#a3ada6]">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                Test environment only. Checkout uses Stripe test mode and does not charge real money. You must be signed in to test checkout. Billing changes are managed securely through Stripe.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
