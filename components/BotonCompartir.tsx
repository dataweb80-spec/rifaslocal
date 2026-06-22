'use client'

import { useState } from 'react'

interface Props {
  url: string
  titulo: string
  slug: string
}

export default function BotonCompartir({ url, titulo, slug }: Props) {
  const [copiado, setCopiado] = useState(false)

  const mensajeWA = encodeURIComponent(
    `🎟 *${titulo}*\n\nParticipá en esta rifa y elegí tu número 👇\n${url}`
  )
  const waUrl = `https://wa.me/?text=${mensajeWA}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`

  async function copiar() {
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold mb-4">📲 Compartí esta rifa</h3>
      <div className="flex gap-3 flex-wrap">
        {/* WhatsApp */}
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 min-w-[140px] bg-green-500 text-white py-3 rounded-xl font-semibold text-center hover:bg-green-600 transition flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.888a.5.5 0 0 0 .609.61l6.098-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.784-.528-5.363-1.449l-.386-.224-3.97.95.984-3.882-.247-.399A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          WhatsApp
        </a>

        {/* Copiar link */}
        <button onClick={copiar}
          className="flex-1 min-w-[140px] border-2 border-gray-200 py-3 rounded-xl font-semibold hover:border-primary text-gray-700 transition flex items-center justify-center gap-2">
          {copiado ? '✅ Copiado!' : '🔗 Copiar link'}
        </button>
      </div>

      {/* QR */}
      <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <img src={qrUrl} alt="QR de la rifa" className="w-20 h-20 rounded-lg" />
        <div>
          <p className="font-semibold text-sm">Código QR</p>
          <p className="text-xs text-gray-500 mt-1">Mostralo en tu negocio o imprimilo para que tus clientes accedan directo a la rifa.</p>
          <a href={qrUrl} download={`qr-${slug}.png`}
            className="text-xs text-primary font-semibold hover:underline mt-1 inline-block">
            Descargar QR →
          </a>
        </div>
      </div>
    </div>
  )
}
