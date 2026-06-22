'use client'

import { useState, useRef } from 'react'

interface Props {
  onUpload: (url: string) => void
  actual?: string
}

export default function UploadImagen({ onUpload, actual }: Props) {
  const [preview, setPreview] = useState<string>(actual ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Solo imágenes (JPG, PNG, WebP)'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB'); return }
    setLoading(true)
    setError('')
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpload(data.url)
    } catch (e: any) {
      setError(e.message)
      setPreview('')
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-colors"
        style={{ minHeight: '160px' }}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <span className="text-4xl mb-2">📷</span>
            <p className="text-sm font-medium">Tocá para subir imagen</p>
            <p className="text-xs">o arrastrá acá — JPG, PNG, WebP (máx 5MB)</p>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-sm text-primary font-semibold">Subiendo...</div>
          </div>
        )}
      </div>
      {preview && !loading && (
        <button onClick={() => { setPreview(''); onUpload('') }} className="text-xs text-red-500 mt-1 hover:underline">
          Quitar imagen
        </button>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}
