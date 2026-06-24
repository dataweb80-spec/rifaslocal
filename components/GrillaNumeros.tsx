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
  nombre_comercio: string | null
  logo_url: string | null
  mp_alias: string | null
  tel_organizador: string | null
}

function formatNumero(n: number, total: number): string {
  if (total <= 99) return String(n).padStart(2, '0')
  return String(n).padStart(3, '0')
}

type Step = 'grilla' | 'form' | 'pago'

export default function GrillaNumeros({ rifaId, numeros, precioNumero, slug, tipo, titulo, imagen_url, nombre_comercio, logo_url, mp_alias, tel_organizador }: Props) {
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [step, setStep] = useState<Step>('grilla')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const total = numeros.length
  const esPaga = tipo === 'paga'
  const montoTotal = seleccionados.length * precioNumero

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

  async function handleConfirmar() {
    if (!nombre.trim()) { setError('Ingresá tu nombre'); return }
    if (telefono.replace(/\D/g, '').length < 8) { setError('Ingresá un teléfono válido'); return }

    setLoading(true)
    setError('')

    try {
      // Reservar los números
      const endpoint = esPaga ? '/api/rifas/reservar-wa' : '/api/rifas/participar'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId, numeros: seleccionados, nombre, telefono }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')

      if (esPaga) {
        // Mostrar pantalla de pago
        setStep('pago')
      } else {
        // Comercio: enviar ticket por WhatsApp y recargar
        enviarTicketWA()
        window.location.reload()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function enviarTicketWA() {
    const baseUrl = window.location.origin
    const nums = seleccionados.sort((a, b) => a - b)
    const numFormateados = nums.map(n => formatNumero(n, total)).join(', ')
    const ticketUrl = `${baseUrl}/rifa/${slug}`
    const comercio = nombre_comercio || 'RifaLocal'

    const msg = encodeURIComponent(
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎟  *TICKET DE PARTICIPACIÓN*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🏪 *${comercio}*\n` +
      `🎁 *${titulo}*\n\n` +
      `👤 Titular: *${nombre}*\n` +
      `🔢 Número${nums.length > 1 ? 's' : ''}: *${numFormateados}*\n` +
      `✅ Participación: *GRATUITA*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎰 *¿Cómo se sortea?*\n` +
      `Cuando se entreguen todos los tickets, el ganador se determina con el *primer número de la Lotería Nacional nocturna* de ese día.\n\n` +
      `📲 *Seguí la rifa acá:*\n${ticketUrl}\n\n` +
      `¡Mucha suerte! 🍀\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`
    )

    const telLimpio = telefono.replace(/\D/g, '')
    const waBase = telLimpio.startsWith('54') ? telLimpio : `54${telLimpio}`
    window.open(`https://wa.me/${waBase}?text=${msg}`, '_blank')
  }

  function abrirMercadoPago() {
    if (!mp_alias) return
    window.open(`https://link.mercadopago.com.ar/${mp_alias}`, '_blank')
  }

  function avisarOrganizador() {
    if (!tel_organizador) return
    const nums = seleccionados.sort((a, b) => a - b)
    const numFormateados = nums.map(n => formatNumero(n, total)).join(', ')
    const comercio = nombre_comercio || 'RifaLocal'

    const msg = encodeURIComponent(
      `💰 *NUEVA COMPRA — ${comercio}*\n\n` +
      `🎁 Rifa: *${titulo}*\n` +
      `🔢 Número${nums.length > 1 ? 's' : ''}: *${numFormateados}*\n` +
      `👤 Comprador: *${nombre}*\n` +
      `📱 WhatsApp: *+54${telefono.replace(/\D/g, '')}*\n` +
      `💰 Monto: *$${montoTotal.toLocaleString('es-AR')}*\n\n` +
      `✅ El comprador ya realizó el pago al alias *${mp_alias}*.\n` +
      `Verificá el pago en tu MercadoPago y confirmá el número.`
    )

    const telLimpio = tel_organizador.replace(/\D/g, '')
    const telOrg = telLimpio.startsWith('54') ? telLimpio : `54${telLimpio}`
    window.open(`https://wa.me/${telOrg}?text=${msg}`, '_blank')
    setEnviado(true)

    // Enviar ticket al comprador también
    setTimeout(() => enviarTicketPagaWA(), 1500)
  }

  function enviarTicketPagaWA() {
    const baseUrl = window.location.origin
    const nums = seleccionados.sort((a, b) => a - b)
    const numFormateados = nums.map(n => formatNumero(n, total)).join(', ')
    const ticketUrl = `${baseUrl}/rifa/${slug}`
    const comercio = nombre_comercio || 'RifaLocal'

    const msg = encodeURIComponent(
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎟  *TICKET DE PARTICIPACIÓN*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🏪 *${comercio}*\n` +
      `🎁 *${titulo}*\n\n` +
      `👤 Titular: *${nombre}*\n` +
      `🔢 Número${nums.length > 1 ? 's' : ''}: *${numFormateados}*\n` +
      `💰 Monto pagado: *$${montoTotal.toLocaleString('es-AR')}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎰 *¿Cómo se sortea?*\n` +
      `Cuando se vendan todos los números, el ganador se determina con el *primer número de la Lotería Nacional nocturna* de ese día.\n\n` +
      `📲 *Seguí la rifa acá:*\n${ticketUrl}\n\n` +
      `¡Mucha suerte! 🍀\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`
    )

    const telLimpio = telefono.replace(/\D/g, '')
    const waBase = telLimpio.startsWith('54') ? telLimpio : `54${telLimpio}`
    window.open(`https://wa.me/${waBase}?text=${msg}`, '_blank')
  }

  const pagados = numeros.filter(n => n.estado === 'pagado').length

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">

      {/* GRILLA */}
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

          <div className="grid grid-cols-10 gap-1.5 mb-5">
            {numeros.map(n => (
              <button key={n.numero} onClick={() => toggleNumero(n.numero, n.estado)}
                title={n.estado === 'pagado' ? `Tomado por ${n.comprador_nombre ?? 'alguien'}` : `Número ${formatNumero(n.numero, total)}`}
                className={`aspect-square rounded-lg font-bold flex items-center justify-center transition-all duration-150 ${total <= 99 ? 'text-xs' : 'text-[10px]'} ${colorNumero(n.estado, n.numero)}`}>
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
              <button onClick={() => setStep('form')}
                className={`w-full text-white py-3 rounded-xl font-bold transition ${esPaga ? 'bg-accent hover:opacity-90' : 'bg-primary hover:bg-primary-dark'}`}>
                {esPaga
                  ? `💳 Comprar ${seleccionados.length} número${seleccionados.length > 1 ? 's' : ''} — $${montoTotal.toLocaleString('es-AR')}`
                  : `✅ Reservar número${seleccionados.length > 1 ? 's' : ''} gratis`
                }
              </button>
            </div>
          )}
        </>
      )}

      {/* FORMULARIO DATOS */}
      {step === 'form' && (
        <div className="space-y-4">
          {(nombre_comercio || logo_url) && (
            <div className={`flex items-center gap-3 p-3 rounded-xl ${esPaga ? 'bg-orange-50' : 'bg-primary-light'}`}>
              {logo_url
                ? <img src={logo_url} alt={nombre_comercio ?? ''} className="w-10 h-10 rounded-lg object-cover border" />
                : <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white ${esPaga ? 'bg-accent' : 'bg-primary'}`}>{nombre_comercio?.[0]?.toUpperCase()}</div>
              }
              <div>
                <p className="font-bold text-sm">{nombre_comercio}</p>
                <p className="text-xs text-gray-500">{titulo}</p>
              </div>
            </div>
          )}

          <h2 className="font-bold text-lg">Tus datos de contacto</h2>

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
          <div className={`rounded-xl border-2 overflow-hidden ${esPaga ? 'border-orange-200' : 'border-primary/20'}`}>
            <div className={`p-3 flex items-center gap-3 ${esPaga ? 'bg-accent' : 'bg-primary'}`}>
              {logo_url
                ? <img src={logo_url} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-white/40" />
                : <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold text-white">{nombre_comercio?.[0]?.toUpperCase() ?? '🎟'}</div>
              }
              <div className="text-white">
                <p className="font-bold text-sm">{nombre_comercio || 'RifaLocal'}</p>
                <p className="text-xs opacity-80">{titulo}</p>
              </div>
            </div>
            <div className={`p-4 ${esPaga ? 'bg-orange-50' : 'bg-primary-light'}`}>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-gray-500">Titular</span><strong>{nombre || '—'}</strong></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Número{seleccionados.length > 1 ? 's' : ''}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {seleccionados.sort((a, b) => a - b).map(n => (
                      <strong key={n} className={`px-2 py-0.5 rounded text-sm ${esPaga ? 'bg-accent text-white' : 'bg-primary text-white'}`}>
                        {formatNumero(n, total)}
                      </strong>
                    ))}
                  </div>
                </div>
                {esPaga
                  ? <div className="flex justify-between font-bold"><span className="text-gray-500">A pagar</span><span className="text-accent">${montoTotal.toLocaleString('es-AR')}</span></div>
                  : <div className="flex justify-between font-bold"><span className="text-gray-500">Costo</span><span className="text-green-600">✅ GRATIS</span></div>
                }
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => setStep('grilla')} className="flex-1 border py-3 rounded-xl font-semibold hover:border-primary">
              ← Volver
            </button>
            <button disabled={loading} onClick={handleConfirmar}
              className={`flex-1 text-white py-3 rounded-xl font-bold disabled:opacity-50 ${esPaga ? 'bg-accent hover:opacity-90' : 'bg-primary hover:bg-primary-dark'}`}>
              {loading ? 'Procesando...' : esPaga ? 'Continuar al pago →' : '📲 Confirmar y recibir ticket'}
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA DE PAGO MP */}
      {step === 'pago' && (
        <div className="space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">💳</div>
            <h2 className="text-xl font-bold">¡Casi listo! Realizá el pago</h2>
            <p className="text-gray-500 text-sm mt-1">Tu número está reservado. Completá el pago para confirmarlo.</p>
          </div>

          {/* Datos de pago */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Números</span>
              <div className="flex gap-1">
                {seleccionados.sort((a, b) => a - b).map(n => (
                  <span key={n} className="bg-accent text-white text-sm font-bold px-2 py-0.5 rounded">
                    {formatNumero(n, total)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-gray-500 text-sm">Monto total</span>
              <span className="text-2xl font-black text-accent">${montoTotal.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Alias MP */}
          <div className="bg-blue-50 rounded-2xl p-5 text-center border-2 border-blue-200">
            <p className="text-sm text-blue-600 font-medium mb-2">Transferí o pagá con MercadoPago al alias:</p>
            <div className="bg-white rounded-xl px-6 py-3 inline-block border border-blue-200">
              <p className="text-2xl font-black text-blue-700 tracking-wide">{mp_alias}</p>
            </div>
            <p className="text-xs text-blue-500 mt-2">Buscá el alias en MercadoPago → Pagar → Alias</p>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            <button onClick={abrirMercadoPago}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition">
              <svg viewBox="0 0 40 40" className="w-7 h-7 fill-white"><path d="M20 0C9 0 0 9 0 20s9 20 20 20 20-9 20-20S31 0 20 0zm9.5 17.5c-.5 3-3 5.5-6 6.5l-1.5.5v3.5H19V24l-1.5-.5C14 22.5 11.5 20 11 17H9c.5 4 3.5 7 7.5 8.5V29h7v-3.5c4-1.5 7-4.5 7.5-8.5h-1.5z"/></svg>
              Abrir MercadoPago
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 whitespace-nowrap">Una vez que pagaste</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {!enviado ? (
              <button onClick={avisarOrganizador}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.888a.5.5 0 0 0 .609.61l6.098-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.784-.528-5.363-1.449l-.386-.224-3.97.95.984-3.882-.247-.399A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Ya pagué — Avisar al organizador por WhatsApp
              </button>
            ) : (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center space-y-3">
                <p className="text-green-700 font-bold">✅ ¡Aviso enviado al organizador!</p>
                <p className="text-sm text-gray-500">También te enviamos tu ticket de participación por WhatsApp.</p>
                <a href={`/rifa/${slug}`} className="block bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition">
                  Ver la rifa →
                </a>
              </div>
            )}
          </div>

          <p className="text-xs text-center text-gray-400">
            ⚠️ El organizador confirmará tu número una vez verificado el pago en su MercadoPago.
          </p>
        </div>
      )}
    </div>
  )
}
