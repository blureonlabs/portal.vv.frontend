import { useAuthStore } from '../store/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
      <p className="text-muted mt-1">
        Welcome back, {user?.full_name}
      </p>
    </div>
  )
}
