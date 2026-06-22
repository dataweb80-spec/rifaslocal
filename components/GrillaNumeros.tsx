'use client'

import { useState } from 'react'

interface Numero {
  numero: number
  estado: string
  comprador_nombre: string | null
}

interface Props {
  rifaId: string
  numeros: Numero[]
  precioNumero: number
  slug: string
  tipo: 'paga' | 'comercio'
  titulo: string
  imagen_url: string | null
}

function formatNumero(n: number, total: number): string {
  if (total <= 99) return String(n).padStart(2, '0')
  return String(n).padStart(3, '0')
}

export default function GrillaNumeros({ rifaId, numeros, precioNumero, slug, tipo, titulo, imagen_url }: Props) {
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [step, setStep] = useState<'grilla' | 'form'>('grilla')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = numeros.length
  const esPaga = tipo === 'paga'

  function toggleNumero(n: number, estado: string) {
    if (estado !== 'disponible') return
    setSeleccionados(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    )
  }

  function colorNumero(estado: string, numero: number) {
    if (estado === 'pagado') return 'bg-gray-200 text-gray-400 cursor-not-allowed'
    if (estado === 'reservado') return 'bg-yellow-100 text-yellow-500 cursor-not-allowed'
    if (seleccionados.includes(numero)) return esPaga
      ? 'bg-accent text-white ring-2 ring-accent shadow-md scale-105'
      : 'bg-primary text-white ring-2 ring-primary shadow-md scale-105'
    return 'bg-white border border-gray-200 hover:border-primary hover:text-primary hover:scale-105 cursor-pointer'
  }

  // Columnas según tamaño
  const cols = total <= 50 ? 'grid-cols-10' : total <= 100 ? 'grid-cols-10' : 'grid-cols-10'

  async function handleConfirmar() {
    if (!nombre.trim()) { setError('Ingresá tu nombre'); return }
    if (telefono.replace(/\D/g, '').length < 8) { setError('Ingresá un teléfono válido'); return }

    setLoading(true)
    setError('')

    try {
      const endpoint = esPaga ? '/api/rifas/reservar' : '/api/rifas/participar'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId, numeros: seleccionados, nombre, telefono }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')

      if (esPaga) {
        window.location.href = data.init_point
        return
      }

      // Rifas comercio: enviar ticket por WhatsApp
      const baseUrl = window.location.origin
      const nums = seleccionados.sort((a, b) => a - b)
      const numFormateados = nums.map(n => formatNumero(n, total)).join(', ')
      const ticketUrl = `${baseUrl}/rifa/${slug}`

      const msg = encodeURIComponent(
        `🎟 *TICKET DE RIFA*\n\n` +
        `📋 *${titulo}*\n` +
        `👤 Titular: *${nombre}*\n` +
        `🔢 Número${nums.length > 1 ? 's' : ''}: *${numFormateados}*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🎰 El sorteo se realizará con el primer número de la *Lotería Nacional nocturna* del día en que se entreguen todos los tickets.\n\n` +
        `📲 Seguí la rifa acá:\n${ticketUrl}\n\n` +
        `¡Mucha suerte! 🍀`
      )

      const telLimpio = telefono.replace(/\D/g, '')
      const waBase = telLimpio.startsWith('54') ? telLimpio : `54${telLimpio}`
      window.open(`https://wa.me/${waBase}?text=${msg}`, '_blank')
      window.location.reload()

    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  const montoTotal = seleccionados.length * precioNumero
  const pagados = numeros.filter(n => n.estado === 'pagado').length

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      {step === 'grilla' && (
        <>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-bold text-lg">
              {esPaga ? '🔢 Elegí tu número' : '🎁 Elegí tu número — ¡gratis!'}
            </h2>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border bg-white inline-block" />Libre</span>
              <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded inline-block ${esPaga ? 'bg-accent' : 'bg-primary'}`} />Tuyo</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 inline-block" />Tomado</span>
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="flex gap-3 mb-4 text-xs text-center">
            <div className="flex-1 bg-gray-50 rounded-lg py-2">
              <p className="font-bold text-lg text-gray-800">{pagados}</p>
              <p className="text-gray-500">vendidos</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg py-2">
              <p className="font-bold text-lg text-green-600">{total - pagados}</p>
              <p className="text-gray-500">disponibles</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg py-2">
              <p className="font-bold text-lg text-primary">{total}</p>
              <p className="text-gray-500">totales</p>
            </div>
          </div>

          <div className={`grid ${cols} gap-1.5 mb-5`}>
            {numeros.map(n => (
              <button
                key={n.numero}
                onClick={() => toggleNumero(n.numero, n.estado)}
                title={n.estado === 'pagado' ? `Tomado por ${n.comprador_nombre ?? 'alguien'}` : `Número ${formatNumero(n.numero, total)}`}
                className={`aspect-square rounded-lg font-bold flex items-center justify-center transition-all duration-150 ${total <= 99 ? 'text-xs' : 'text-[10px]'} ${colorNumero(n.estado, n.numero)}`}
              >
                {formatNumero(n.numero, total)}
              </button>
            ))}
          </div>

          {seleccionados.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-wrap gap-1">
                  {seleccionados.sort((a, b) => a - b).map(n => (
                    <span key={n} className={`text-xs px-2 py-1 rounded-lg font-bold ${esPaga ? 'bg-orange-100 text-accent' : 'bg-primary-light text-primary'}`}>
                      {formatNumero(n, total)}
                    </span>
                  ))}
                </div>
                {esPaga
                  ? <p className="font-bold text-lg text-accent">${montoTotal.toLocaleString('es-AR')}</p>
                  : <p className="font-bold text-green-600 text-sm">¡GRATIS!</p>
                }
              </div>
              <button
                onClick={() => setStep('form')}
                className={`w-full text-white py-3 rounded-xl font-bold transition ${esPaga ? 'bg-accent hover:opacity-90' : 'bg-primary hover:bg-primary-dark'}`}
              >
                {esPaga
                  ? `💳 Comprar ${seleccionados.length} número${seleccionados.length > 1 ? 's' : ''}`
                  : `✅ Reservar número${seleccionados.length > 1 ? 's' : ''}`
                }
              </button>
            </div>
          )}
        </>
      )}

      {step === 'form' && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Tus datos de contacto</h2>
          <p className="text-sm text-gray-500">Te enviamos tu ticket por WhatsApp al instante.</p>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre completo *</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: María González"
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp *</label>
            <div className="flex gap-2">
              <span className="border rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 text-sm whitespace-nowrap">🇦🇷 +54</span>
              <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="11 1234-5678"
                className="flex-1 border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {/* Preview ticket */}
          <div className={`rounded-xl p-4 border-2 ${esPaga ? 'bg-orange-50 border-orange-200' : 'bg-primary-light border-primary/20'}`}>
            <p className="text-xs font-bold uppercase text-gray-500 mb-2">🎟 Tu ticket</p>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Rifa:</span> <strong>{titulo}</strong></p>
              <p><span className="text-gray-500">Número{seleccionados.length > 1 ? 's' : ''}:</span>{' '}
                {seleccionados.sort((a, b) => a - b).map(n => (
                  <strong key={n} className={`mx-0.5 px-2 py-0.5 rounded ${esPaga ? 'bg-accent text-white' : 'bg-primary text-white'}`}>
                    {formatNumero(n, total)}
                  </strong>
                ))}
              </p>
              {esPaga
                ? <p><span className="text-gray-500">Total:</span> <strong className="text-accent">${montoTotal.toLocaleString('es-AR')}</strong></p>
                : <p><strong className="text-green-600">✅ Participación gratuita</strong></p>
              }
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-3 text-xs text-green-800 flex items-start gap-2">
            <span className="text-base">📲</span>
            <p>Al confirmar te vamos a abrir WhatsApp con tu ticket de participación.</p>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => setStep('grilla')} className="flex-1 border py-3 rounded-xl font-semibold hover:border-primary">
              ← Volver
            </button>
            <button disabled={loading} onClick={handleConfirmar}
              className={`flex-1 text-white py-3 rounded-xl font-bold disabled:opacity-50 ${esPaga ? 'bg-accent hover:opacity-90' : 'bg-primary hover:bg-primary-dark'}`}>
              {loading ? 'Procesando...' : esPaga ? '💳 Pagar con MP' : '📲 Confirmar y recibir ticket'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
