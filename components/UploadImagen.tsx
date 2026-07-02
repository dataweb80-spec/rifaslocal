'use client'

import { useState, useRef } from 'react'

interface Props {
  onUpload: (url: string) => void
  actual?: string
}

// Comprime y redimensiona la imagen antes de subir
function comprimirImagen(file: File, maxPx = 1200, calidad = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round((height / width) * maxPx); width = maxPx }
        else { width = Math.round((width / height) * maxPx); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Error al comprimir')), 'image/jpeg', calidad)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function UploadImagen({ onUpload, actual }: Props) {
  const [preview, setPreview] = useState<string>(actual ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Solo imágenes (JPG, PNG, WebP)'); return }
    setLoading(true)
    setError('')

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    try {
      // Comprimir antes de subir (evita límite 4.5MB de Vercel)
      const comprimido = await comprimirImagen(file)

      const form = new FormData()
      form.append('file', comprimido, 'imagen.jpg')
      const res = await fetch('/api/upload', { method: 'POST', body: form })

      // Capturar errores no-JSON (ej: 413 de Vercel)
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { throw new Error(`Error del servidor: ${text.slice(0, 80)}`) }

      if (!res.ok) throw new Error(data.error ?? 'Error al subir')
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
            <p className="text-xs">o arrastrá acá — JPG, PNG, WebP</p>
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
