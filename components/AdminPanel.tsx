'use client'

import { useState } from 'react'

interface RifaPendiente {
  id: string
  titulo: string
  nombre_comercio: string | null
  logo_url: string | null
  slug: string
  plan_numeros: number
  precio_plan: number | null
  tel_organizador: string | null
  comprobante_pago_url: string | null
  created_at: string
}

interface RifaActivada {
  id: string
  titulo: string
  nombre_comercio: string | null
  slug: string
  cantidad_numeros: number
  precio_plan: number | null
  created_at: string
}

interface Props {
  pendientes: RifaPendiente[]
  activadas: RifaActivada[]
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminPanel({ pendientes, activadas }: Props) {
  const [lista, setLista] = useState(pendientes)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [tab, setTab] = useState<'pendientes' | 'activadas'>('pendientes')

  function handleLogin() {
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'rifalocal2024'
    if (password === adminPass) {
      setAutenticado(true)
    } else {
      setError('Contraseña incorrecta')
    }
  }

  async function activarRifa(rifaId: string) {
    setLoading(rifaId)
    setError('')
    try {
      const res = await fetch('/api/rifas/activar-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')

      // Notificar al organizador por WA
      const rifa = lista.find(r => r.id === rifaId)
      if (rifa?.tel_organizador) {
        const baseUrl = window.location.origin
        const tel = rifa.tel_organizador.replace(/\D/g, '')
        const wa = tel.startsWith('54') ? tel : `54${tel}`
        const msg = encodeURIComponent(
          `🚀 *¡Tu rifa está activa!*\n\n` +
          `🏪 *${rifa.nombre_comercio}*\n` +
          `🎁 ${rifa.titulo}\n\n` +
          `✅ Verificamos tu pago y activamos tu rifa con ${rifa.plan_numeros} números.\n\n` +
          `👉 Accedé acá:\n${baseUrl}/rifa/${rifa.slug}?nueva=1&gestionar=${rifa.id}`
        )
        window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
      }

      setLista(prev => prev.filter(r => r.id !== rifaId))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  async function rechazarRifa(rifaId: string) {
    if (!confirm('¿Rechazar este pago? La rifa quedará en borrador sin comprobante.')) return
    setLoading(rifaId)
    try {
      await fetch('/api/rifas/guardar-comprobante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId, comprobante_url: null }),
      })
      setLista(prev => prev.filter(r => r.id !== rifaId))
    } catch {
      // silencioso
    } finally {
      setLoading(null)
    }
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full space-y-4">
          <div className="text-center">
            <p className="text-3xl mb-2">🔐</p>
            <h1 className="text-xl font-bold">Panel Admin — RifaLocal</h1>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Contraseña"
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleLogin} className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark">
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎟</span>
          <span className="font-bold text-primary">RifaLocal</span>
          <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full ml-1">ADMIN</span>
        </div>
        <a href="/" className="text-sm text-gray-500 hover:text-primary">← Inicio</a>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('pendientes')}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${tab === 'pendientes' ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}>
            ⏳ Pendientes de activar ({lista.length})
          </button>
          <button onClick={() => setTab('activadas')}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${tab === 'activadas' ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}>
            ✅ Activadas recientemente ({activadas.length})
          </button>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

        {/* Pendientes */}
        {tab === 'pendientes' && (
          <div className="space-y-4">
            {lista.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
                <p className="text-3xl mb-2">✅</p>
                <p>No hay rifas pendientes de activación</p>
              </div>
            )}
            {lista.map(rifa => (
              <div key={rifa.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-yellow-50 flex items-center gap-3">
                  {rifa.logo_url
                    ? <img src={rifa.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                    : <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">{rifa.nombre_comercio?.[0]?.toUpperCase() ?? '?'}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{rifa.nombre_comercio}</p>
                    <p className="text-sm text-gray-600 truncate">{rifa.titulo}</p>
                    <p className="text-xs text-gray-400">{formatFecha(rifa.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">${rifa.precio_plan?.toLocaleString('es-AR') ?? '—'}</p>
                    <p className="text-xs text-gray-500">{rifa.plan_numeros} números</p>
                  </div>
                </div>

                {rifa.comprobante_pago_url && (
                  <div className="p-4 border-b">
                    <p className="text-xs font-bold text-gray-500 mb-2">COMPROBANTE DE PAGO:</p>
                    <a href={rifa.comprobante_pago_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={rifa.comprobante_pago_url}
                        alt="Comprobante"
                        className="w-full max-w-sm rounded-xl border shadow-sm hover:opacity-90 transition cursor-pointer"
                      />
                    </a>
                    <p className="text-xs text-blue-500 mt-1">Clic para ver en tamaño completo</p>
                  </div>
                )}

                <div className="p-4 flex gap-2">
                  <button
                    disabled={loading === rifa.id}
                    onClick={() => activarRifa(rifa.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition">
                    {loading === rifa.id ? 'Activando...' : '✅ Pago OK — Activar rifa'}
                  </button>
                  <button
                    disabled={loading === rifa.id}
                    onClick={() => rechazarRifa(rifa.id)}
                    className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-500 px-4 py-3 rounded-xl font-semibold transition text-sm">
                    Rechazar
                  </button>
                  {rifa.tel_organizador && (
                    <a
                      href={`https://wa.me/54${rifa.tel_organizador.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${rifa.nombre_comercio}, te contactamos de RifaLocal sobre tu pago.`)}`}
                      target="_blank"
                      className="bg-green-50 hover:bg-green-100 text-green-600 px-4 py-3 rounded-xl transition"
                      title="Contactar organizador">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.888a.5.5 0 0 0 .609.61l6.098-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.784-.528-5.363-1.449l-.386-.224-3.97.95.984-3.882-.247-.399A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activadas */}
        {tab === 'activadas' && (
          <div className="space-y-3">
            {activadas.map(rifa => (
              <div key={rifa.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold shrink-0">✅</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{rifa.nombre_comercio}</p>
                  <p className="text-sm text-gray-500 truncate">{rifa.titulo} · {rifa.cantidad_numeros} números</p>
                  <p className="text-xs text-gray-400">{formatFecha(rifa.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-600">${rifa.precio_plan?.toLocaleString('es-AR') ?? '—'}</p>
                  <a href={`/rifa/${rifa.slug}`} target="_blank" className="text-xs text-primary hover:underline">Ver rifa →</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
