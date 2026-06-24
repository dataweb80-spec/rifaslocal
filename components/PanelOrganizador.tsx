'use client'

import { useState } from 'react'

interface Numero {
  id: string
  numero: number
  estado: string
  comprador_nombre: string | null
  comprador_tel: string | null
  reservado_en: string | null
  pagado_en: string | null
}

interface Rifa {
  id: string
  titulo: string
  nombre_comercio: string | null
  logo_url: string | null
  slug: string
  tipo: string
  precio_numero: number
  cantidad_numeros: number
  estado: string
}

interface Props {
  rifa: Rifa
  numeros: Numero[]
}

function formatNumero(n: number, total: number) {
  if (total <= 99) return String(n).padStart(2, '0')
  return String(n).padStart(3, '0')
}

function formatFecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function PanelOrganizador({ rifa, numeros }: Props) {
  const [lista, setLista] = useState<Numero[]>(numeros)
  const [filtro, setFiltro] = useState<'todos' | 'reservado' | 'pagado'>('reservado')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const reservados = lista.filter(n => n.estado === 'reservado')
  const pagados = lista.filter(n => n.estado === 'pagado')
  const disponibles = lista.filter(n => n.estado === 'disponible')

  const filtrados = filtro === 'todos'
    ? lista.filter(n => n.estado !== 'disponible')
    : lista.filter(n => n.estado === filtro)

  async function confirmarPago(numeroId: string, numeroVal: number) {
    setLoading(numeroId)
    setError('')
    try {
      const res = await fetch('/api/rifas/confirmar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId: rifa.id, numeroId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setLista(prev => prev.map(n => n.id === numeroId
        ? { ...n, estado: 'pagado', pagado_en: new Date().toISOString() }
        : n
      ))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  async function liberarNumero(numeroId: string) {
    setLoading(numeroId)
    setError('')
    try {
      const res = await fetch('/api/rifas/liberar-numero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId: rifa.id, numeroId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setLista(prev => prev.map(n => n.id === numeroId
        ? { ...n, estado: 'disponible', comprador_nombre: null, comprador_tel: null, reservado_en: null }
        : n
      ))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  function abrirWA(tel: string | null, nombre: string | null, numero: number) {
    if (!tel) return
    const telLimpio = tel.replace(/\D/g, '')
    const wa = telLimpio.startsWith('54') ? telLimpio : `54${telLimpio}`
    const msg = encodeURIComponent(
      `Hola ${nombre ?? ''}! 🎟 Tu número *${formatNumero(numero, rifa.cantidad_numeros)}* de la rifa *${rifa.titulo}* fue *confirmado*. ¡Mucha suerte! 🍀`
    )
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex items-center gap-3">
        {rifa.logo_url
          ? <img src={rifa.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover border" />
          : <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">{rifa.nombre_comercio?.[0]?.toUpperCase() ?? '🎟'}</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{rifa.nombre_comercio || rifa.titulo}</p>
          <p className="text-xs text-gray-500 truncate">{rifa.titulo}</p>
        </div>
        <span className="text-xs bg-primary-light text-primary font-bold px-3 py-1 rounded-full whitespace-nowrap">Panel gestión</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-yellow-600">{reservados.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Reservados</p>
            <p className="text-xs text-yellow-600 font-medium">pendientes</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-green-600">{pagados.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pagados</p>
            <p className="text-xs text-green-600 font-medium">confirmados</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-gray-500">{disponibles.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Disponibles</p>
            <p className="text-xs text-gray-400 font-medium">sin vender</p>
          </div>
        </div>

        {/* Total recaudado */}
        {pagados.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <p className="text-sm text-green-700 font-medium">💰 Total recaudado (confirmados)</p>
            <p className="text-xl font-black text-green-700">
              ${(pagados.length * rifa.precio_numero).toLocaleString('es-AR')}
            </p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

        {/* Filtros */}
        <div className="flex gap-2">
          {(['reservado', 'pagado', 'todos'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${filtro === f ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}>
              {f === 'reservado' ? `⏳ Pendientes (${reservados.length})` : f === 'pagado' ? `✅ Pagados (${pagados.length})` : '📋 Todos'}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filtrados.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">{filtro === 'reservado' ? '✅' : '📋'}</p>
              <p>{filtro === 'reservado' ? 'No hay números pendientes de pago' : 'No hay registros'}</p>
            </div>
          )}

          {filtrados.map(n => (
            <div key={n.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${n.estado === 'pagado' ? 'border-green-400' : 'border-yellow-400'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${n.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {formatNumero(n.numero, rifa.cantidad_numeros)}
                  </div>
                  <div>
                    <p className="font-bold">{n.comprador_nombre ?? '—'}</p>
                    <p className="text-sm text-gray-500">{n.comprador_tel ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {n.estado === 'pagado'
                        ? `✅ Confirmado ${formatFecha(n.pagado_en)}`
                        : `⏳ Reservado ${formatFecha(n.reservado_en)}`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-accent">${rifa.precio_numero.toLocaleString('es-AR')}</p>
                </div>
              </div>

              {n.estado === 'reservado' && (
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={loading === n.id}
                    onClick={() => confirmarPago(n.id, n.numero)}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-sm transition">
                    {loading === n.id ? '...' : '✅ Confirmar pago'}
                  </button>
                  <button
                    onClick={() => abrirWA(n.comprador_tel, n.comprador_nombre, n.numero)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2.5 rounded-xl transition"
                    title="Contactar por WhatsApp">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.888a.5.5 0 0 0 .609.61l6.098-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.784-.528-5.363-1.449l-.386-.224-3.97.95.984-3.882-.247-.399A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                  </button>
                  <button
                    disabled={loading === n.id}
                    onClick={() => liberarNumero(n.id)}
                    className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-500 px-3 py-2.5 rounded-xl transition text-sm font-medium"
                    title="Liberar número (no pagó)">
                    🗑
                  </button>
                </div>
              )}

              {n.estado === 'pagado' && n.comprador_tel && (
                <div className="mt-3">
                  <button
                    onClick={() => abrirWA(n.comprador_tel, n.comprador_nombre, n.numero)}
                    className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.888a.5.5 0 0 0 .609.61l6.098-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.784-.528-5.363-1.449l-.386-.224-3.97.95.984-3.882-.247-.399A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    Enviar confirmación por WhatsApp
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 pb-4">
          Esta página es privada. Solo vos tenés el link. No lo compartás con los compradores.<br />
          URL: /gestionar/{rifa.id}
        </p>
      </div>
    </div>
  )
}
