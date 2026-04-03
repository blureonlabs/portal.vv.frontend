import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { apiPut } from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'w-10 h-10 text-base',
  md: 'w-16 h-16 text-xl',
  lg: 'w-20 h-20 text-2xl',
}

export function AvatarUpload({ size = 'md' }: AvatarUploadProps) {
  const { user, setUser } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sizeClass = SIZE_CLASSES[size]
  const initials = user?.full_name?.charAt(0).toUpperCase() ?? '?'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setError(null)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const storagePath = `avatars/${user.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('fms-files')
        .upload(storagePath, file, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data: urlData } = supabase.storage
        .from('fms-files')
        .getPublicUrl(storagePath)

      const publicUrl = urlData.publicUrl

      await apiPut<{ avatar_url: string }>('/auth/me/avatar', { avatar_url: publicUrl })

      setUser({ ...user, avatar_url: publicUrl })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative group inline-block">
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer relative`}
        onClick={() => !uploading && inputRef.current?.click()}
        title="Click to change avatar"
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/20 flex items-center justify-center shadow-md ring-2 ring-white/10">
            <span className="text-white font-bold">{initials}</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {uploading ? (
            <svg
              className="w-5 h-5 text-white animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <span className="material-symbols-rounded text-white text-[18px]">photo_camera</span>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {error && (
        <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-xs text-red-400 whitespace-nowrap bg-black/80 px-2 py-1 rounded">
          {error}
        </p>
      )}
    </div>
  )
}
