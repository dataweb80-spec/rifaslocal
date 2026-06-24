'use client'

import { useState, useMemo } from 'react'

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

type Tab = 'gestion' | 'vender' | 'notificar'

function formatNumero(n: number, total: number) {
  if (total <= 99) return String(n).padStart(2, '0')
  return String(n).padStart(3, '0')
}

function formatFecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function proximaLoteria(): string {
  const now = new Date()
  const hora = now.getHours()
  const dia = now.getDay() // 0=dom, 1=lun ... 5=vie, 6=sab

  // Lotería Nacional nocturna: lunes a viernes ~21:00
  // Si ya pasó las 21hs o es fin de semana, calcular próximo día hábil
  let diasAdelante = 0

  if (dia === 6) diasAdelante = 2       // sábado → lunes
  else if (dia === 0) diasAdelante = 1  // domingo → lunes
  else if (hora >= 21) {
    // Ya pasó la lotería de hoy
    if (dia === 5) diasAdelante = 3     // viernes noche → lunes
    else diasAdelante = 1
  }
  // Si es día hábil y antes de las 21hs → hoy mismo

  const fecha = new Date(now)
  fecha.setDate(fecha.getDate() + diasAdelante)

  const esHoy = diasAdelante === 0
  const esMañana = diasAdelante === 1

  if (esHoy) return 'esta noche'
  if (esMañana) return 'mañana a la noche'

  return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' a la noche'
}

function WaIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.888a.5.5 0 0 0 .609.61l6.098-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.95 0-3.784-.528-5.363-1.449l-.386-.224-3.97.95.984-3.882-.247-.399A9.945 9.945 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  )
}

export default function PanelOrganizador({ rifa: rifaInicial, numeros: numerosIniciales }: Props) {
  const [numeros, setNumeros] = useState<Numero[]>(numerosIniciales)
  const [rifa, setRifa] = useState(rifaInicial)
  const [tab, setTab] = useState<Tab>('gestion')

  // --- GESTIÓN ---
  const [filtro, setFiltro] = useState<'todos' | 'reservado' | 'pagado'>('reservado')
  const [loadingGestion, setLoadingGestion] = useState<string | null>(null)
  const [errorGestion, setErrorGestion] = useState('')

  // --- VENDER ---
  const [selVender, setSelVender] = useState<number[]>([])
  const [nombreCliente, setNombreCliente] = useState('')
  const [telCliente, setTelCliente] = useState('')
  const [loadingVender, setLoadingVender] = useState(false)
  const [errorVender, setErrorVender] = useState('')
  const [ventaOk, setVentaOk] = useState(false)
  const [rifaLlena, setRifaLlena] = useState(rifa.estado === 'llena')

  // --- NOTIFICAR ---
  const [ganadorNum, setGanadorNum] = useState('')
  const [notifIndex, setNotifIndex] = useState(0)
  const [notifIniciada, setNotifIniciada] = useState(false)

  const reservados = numeros.filter(n => n.estado === 'reservado')
  const pagados = numeros.filter(n => n.estado === 'pagado')
  const disponibles = numeros.filter(n => n.estado === 'disponible')
  const total = rifa.cantidad_numeros

  const compradores = useMemo(() => {
    const vistos = new Set<string>()
    return pagados.filter(n => {
      if (!n.comprador_tel) return false
      if (vistos.has(n.comprador_tel)) return false
      vistos.add(n.comprador_tel)
      return true
    })
  }, [pagados])

  // ---- GESTIÓN ACTIONS ----

  async function confirmarPago(numeroId: string) {
    setLoadingGestion(numeroId)
    setErrorGestion('')
    try {
      const res = await fetch('/api/rifas/confirmar-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId: rifa.id, numeroId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNumeros(prev => prev.map(n => n.id === numeroId ? { ...n, estado: 'pagado', pagado_en: new Date().toISOString() } : n))
    } catch (e: any) { setErrorGestion(e.message) }
    finally { setLoadingGestion(null) }
  }

  async function liberarNumero(numeroId: string) {
    setLoadingGestion(numeroId)
    try {
      await fetch('/api/rifas/liberar-numero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId: rifa.id, numeroId }),
      })
      setNumeros(prev => prev.map(n => n.id === numeroId
        ? { ...n, estado: 'disponible', comprador_nombre: null, comprador_tel: null, reservado_en: null }
        : n
      ))
    } catch { }
    finally { setLoadingGestion(null) }
  }

  function abrirWAComprador(tel: string | null, nombre: string | null, numeroVal: number) {
    if (!tel) return
    const wa = tel.replace(/\D/g, '')
    const waFull = wa.startsWith('54') ? wa : `54${wa}`
    const msg = encodeURIComponent(
      `Hola ${nombre ?? ''}! 🎟 Tu número *${formatNumero(numeroVal, total)}* de la rifa *${rifa.titulo}* fue *confirmado*. ¡Mucha suerte! 🍀`
    )
    window.open(`https://wa.me/${waFull}?text=${msg}`, '_blank')
  }

  // ---- VENDER ACTIONS ----

  function toggleVender(n: number, estado: string) {
    if (estado !== 'disponible') return
    setSelVender(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  async function handleVender() {
    if (!selVender.length || !nombreCliente.trim() || telCliente.replace(/\D/g, '').length < 8) return
    setLoadingVender(true)
    setErrorVender('')
    try {
      const res = await fetch('/api/rifas/vender-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId: rifa.id, numeros: selVender, nombre: nombreCliente, telefono: telCliente }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Actualizar estado local
      const ahora = new Date().toISOString()
      setNumeros(prev => prev.map(n => selVender.includes(n.numero)
        ? { ...n, estado: 'pagado', comprador_nombre: nombreCliente, comprador_tel: telCliente, pagado_en: ahora }
        : n
      ))

      if (data.rifaLlena) {
        setRifaLlena(true)
        setRifa(r => ({ ...r, estado: 'llena' }))
      }

      // Enviar ticket WA al cliente
      enviarTicketWACliente()

      setVentaOk(true)
    } catch (e: any) { setErrorVender(e.message) }
    finally { setLoadingVender(false) }
  }

  function enviarTicketWACliente() {
    const baseUrl = window.location.origin
    const nums = selVender.sort((a, b) => a - b)
    const numFormateados = nums.map(n => formatNumero(n, total)).join(', ')
    const comercio = rifa.nombre_comercio || 'RifaLocal'
    const monto = rifa.precio_numero > 0 ? `💰 Monto pagado: *$${(nums.length * rifa.precio_numero).toLocaleString('es-AR')}*\n` : `✅ Participación: *GRATUITA*\n`

    const msg = encodeURIComponent(
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎟  *TICKET DE PARTICIPACIÓN*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🏪 *${comercio}*\n` +
      `🎁 *${rifa.titulo}*\n\n` +
      `👤 Titular: *${nombreCliente}*\n` +
      `🔢 Número${nums.length > 1 ? 's' : ''}: *${numFormateados}*\n` +
      monto + `\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎰 *¿Cómo se sortea?*\n` +
      `Cuando se completen todos los números, el ganador se determina con el *primer número de la Lotería Nacional nocturna* de ese día.\n\n` +
      `📲 *Seguí la rifa acá:*\n${baseUrl}/rifa/${rifa.slug}\n\n` +
      `¡Mucha suerte! 🍀\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`
    )

    const tel = telCliente.replace(/\D/g, '')
    const waFull = tel.startsWith('54') ? tel : `54${tel}`
    window.open(`https://wa.me/${waFull}?text=${msg}`, '_blank')
  }

  function resetVenta() {
    setSelVender([])
    setNombreCliente('')
    setTelCliente('')
    setVentaOk(false)
    setErrorVender('')
  }

  // ---- NOTIFICAR SORTEO ----

  function avisarSorteo(index: number) {
    const compradorConTel = compradores[index]
    if (!compradorConTel) return

    const baseUrl = window.location.origin
    const proxima = proximaLoteria()
    const numerosDelComprador = pagados
      .filter(n => n.comprador_tel === compradorConTel.comprador_tel)
      .map(n => formatNumero(n.numero, total))
      .join(', ')

    const msg = encodeURIComponent(
      `🎰 *¡El sorteo es ${proxima}!*\n\n` +
      `🏪 *${rifa.nombre_comercio || rifa.titulo}*\n` +
      `🎁 ${rifa.titulo}\n\n` +
      `🔢 Tus números: *${numerosDelComprador}*\n\n` +
      `El ganador se determina con el *primer número de la Lotería Nacional nocturna*.\n\n` +
      `📲 Seguí la rifa en vivo:\n${baseUrl}/rifa/${rifa.slug}\n\n` +
      `¡Mucha suerte! 🍀`
    )

    const tel = compradorConTel.comprador_tel!.replace(/\D/g, '')
    const wa = tel.startsWith('54') ? tel : `54${tel}`
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
    setNotifIndex(index + 1)
  }

  function avisarGanador(index: number) {
    if (!ganadorNum) return
    const compradorConTel = compradores[index]
    if (!compradorConTel) return

    const baseUrl = window.location.origin
    const numerosDelComprador = pagados
      .filter(n => n.comprador_tel === compradorConTel.comprador_tel)
      .map(n => formatNumero(n.numero, total))
      .join(', ')

    const esGanador = pagados.some(
      n => n.comprador_tel === compradorConTel.comprador_tel && String(n.numero) === ganadorNum
    )

    const msg = encodeURIComponent(
      esGanador
        ? `🏆 *¡GANASTE la rifa!*\n\n` +
          `🏪 *${rifa.nombre_comercio || rifa.titulo}*\n` +
          `🎁 ${rifa.titulo}\n\n` +
          `🎰 El número ganador fue: *${formatNumero(+ganadorNum, total)}*\n` +
          `🔢 Tus números eran: *${numerosDelComprador}*\n\n` +
          `El organizador te va a contactar en las próximas horas para coordinar el premio. 🎉`
        : `🎰 *Resultado del sorteo*\n\n` +
          `🏪 *${rifa.nombre_comercio || rifa.titulo}*\n` +
          `🎁 ${rifa.titulo}\n\n` +
          `El número ganador fue: *${formatNumero(+ganadorNum, total)}*\n` +
          `Tus números eran: *${numerosDelComprador}*\n\n` +
          `Esta vez no fue, pero gracias por participar. ¡Hasta la próxima! 🍀`
    )

    const tel = compradorConTel.comprador_tel!.replace(/\D/g, '')
    const wa = tel.startsWith('54') ? tel : `54${tel}`
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
    setNotifIndex(index + 1)
  }

  // ---- RENDER ----

  const filtrados = filtro === 'todos'
    ? numeros.filter(n => n.estado !== 'disponible')
    : numeros.filter(n => n.estado === filtro)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        {rifa.logo_url
          ? <img src={rifa.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover border shrink-0" />
          : <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold shrink-0">{rifa.nombre_comercio?.[0]?.toUpperCase() ?? '🎟'}</div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate text-sm">{rifa.nombre_comercio || rifa.titulo}</p>
          <p className="text-xs text-gray-500 truncate">{rifa.titulo}</p>
        </div>
        <a href={`/rifa/${rifa.slug}`} target="_blank" className="text-xs text-primary whitespace-nowrap">Ver rifa →</a>
      </nav>

      {/* Alerta rifa llena */}
      {rifaLlena && (
        <div className="bg-green-500 text-white px-4 py-3 text-center">
          <p className="font-bold">🎉 ¡Todos los números vendidos! Avisá a los compradores del sorteo.</p>
          <button onClick={() => setTab('notificar')} className="mt-1 text-sm underline">Ir a notificaciones →</button>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-yellow-600">{reservados.length}</p>
            <p className="text-xs text-gray-500">Reservados</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-green-600">{pagados.length}</p>
            <p className="text-xs text-gray-500">Pagados</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xl font-black text-gray-500">{disponibles.length}</p>
            <p className="text-xs text-gray-500">Disponibles</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'gestion', label: '📋 Gestión' },
            { key: 'vender', label: '💵 Vender' },
            { key: 'notificar', label: '📢 Avisar' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition ${tab === t.key ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== TAB GESTIÓN ===== */}
        {tab === 'gestion' && (
          <div className="space-y-3">
            {pagados.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center justify-between">
                <p className="text-sm text-green-700 font-medium">💰 Recaudado</p>
                <p className="text-lg font-black text-green-700">
                  ${(pagados.length * rifa.precio_numero).toLocaleString('es-AR')}
                </p>
              </div>
            )}

            {errorGestion && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{errorGestion}</p>}

            <div className="flex gap-2">
              {(['reservado', 'pagado', 'todos'] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${filtro === f ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}>
                  {f === 'reservado' ? `⏳ Pendientes (${reservados.length})` : f === 'pagado' ? `✅ Pagados (${pagados.length})` : '📋 Todos'}
                </button>
              ))}
            </div>

            {filtrados.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
                <p className="text-3xl mb-2">{filtro === 'reservado' ? '✅' : '📋'}</p>
                <p className="text-sm">{filtro === 'reservado' ? 'No hay números pendientes' : 'No hay registros'}</p>
              </div>
            )}

            {filtrados.map(n => (
              <div key={n.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${n.estado === 'pagado' ? 'border-green-400' : 'border-yellow-400'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${n.estado === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {formatNumero(n.numero, total)}
                    </div>
                    <div>
                      <p className="font-bold">{n.comprador_nombre ?? '—'}</p>
                      <p className="text-sm text-gray-500">{n.comprador_tel ?? '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {n.estado === 'pagado' ? `✅ ${formatFecha(n.pagado_en)}` : `⏳ Reservado ${formatFecha(n.reservado_en)}`}
                      </p>
                    </div>
                  </div>
                  {rifa.precio_numero > 0 && (
                    <p className="font-bold text-accent shrink-0">${rifa.precio_numero.toLocaleString('es-AR')}</p>
                  )}
                </div>

                {n.estado === 'reservado' && (
                  <div className="mt-3 flex gap-2">
                    <button disabled={loadingGestion === n.id} onClick={() => confirmarPago(n.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-sm transition">
                      {loadingGestion === n.id ? '...' : '✅ Confirmar pago'}
                    </button>
                    <button onClick={() => abrirWAComprador(n.comprador_tel, n.comprador_nombre, n.numero)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2.5 rounded-xl transition">
                      <WaIcon />
                    </button>
                    <button disabled={loadingGestion === n.id} onClick={() => liberarNumero(n.id)}
                      className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-500 px-3 py-2.5 rounded-xl transition text-sm">
                      🗑
                    </button>
                  </div>
                )}

                {n.estado === 'pagado' && n.comprador_tel && (
                  <button onClick={() => abrirWAComprador(n.comprador_tel, n.comprador_nombre, n.numero)}
                    className="mt-3 w-full bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition">
                    <WaIcon className="w-4 h-4" /> Enviar confirmación por WA
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== TAB VENDER ===== */}
        {tab === 'vender' && (
          <div className="space-y-4">
            {ventaOk ? (
              <div className="space-y-4">
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center space-y-2">
                  <p className="text-4xl">✅</p>
                  <p className="text-xl font-bold text-green-700">¡Venta registrada!</p>
                  <p className="text-sm text-gray-600">
                    Números <strong>{selVender.sort((a,b)=>a-b).map(n => formatNumero(n, total)).join(', ')}</strong> vendidos a <strong>{nombreCliente}</strong>
                  </p>
                  <p className="text-sm text-gray-500">Se abrió WhatsApp para enviarle el ticket al cliente.</p>
                  {rifaLlena && (
                    <div className="bg-green-100 rounded-xl p-3 mt-2">
                      <p className="font-bold text-green-800">🎉 ¡Todos los números vendidos!</p>
                      <p className="text-xs text-green-700">Ir a "📢 Avisar" para notificar a todos los compradores.</p>
                    </div>
                  )}
                </div>
                <button onClick={resetVenta} className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition">
                  Vender otro número →
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-bold mb-3">Elegí el número o números a vender:</p>
                  <div className="grid grid-cols-10 gap-1.5">
                    {numeros.map(n => {
                      const sel = selVender.includes(n.numero)
                      const libre = n.estado === 'disponible'
                      return (
                        <button key={n.numero} onClick={() => toggleVender(n.numero, n.estado)}
                          className={`aspect-square rounded-lg font-bold flex items-center justify-center transition-all duration-150
                            ${total <= 99 ? 'text-xs' : 'text-[10px]'}
                            ${!libre ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                              sel ? 'bg-primary text-white ring-2 ring-primary shadow-md scale-105' :
                              'bg-white border border-gray-200 hover:border-primary hover:text-primary cursor-pointer'
                            }`}>
                          {formatNumero(n.numero, total)}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block" />Seleccionado</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" />Vendido</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border inline-block" />Libre</span>
                  </div>
                </div>

                {selVender.length > 0 && (
                  <div className="bg-primary-light rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {selVender.sort((a,b)=>a-b).map(n => (
                          <span key={n} className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-lg">
                            {formatNumero(n, total)}
                          </span>
                        ))}
                      </div>
                      {rifa.precio_numero > 0 && (
                        <span className="font-black text-primary">${(selVender.length * rifa.precio_numero).toLocaleString('es-AR')}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre del cliente *</label>
                      <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)}
                        placeholder="ej: María González"
                        className="w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">WhatsApp del cliente *</label>
                      <div className="flex gap-2">
                        <span className="border rounded-xl px-3 py-2.5 bg-white text-gray-500 text-sm whitespace-nowrap">🇦🇷 +54</span>
                        <input type="tel" value={telCliente} onChange={e => setTelCliente(e.target.value)}
                          placeholder="11 1234-5678"
                          className="flex-1 border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
                      </div>
                    </div>

                    {errorVender && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{errorVender}</p>}

                    <button
                      disabled={loadingVender || !nombreCliente.trim() || telCliente.replace(/\D/g,'').length < 8}
                      onClick={handleVender}
                      className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                      <WaIcon />
                      {loadingVender ? 'Registrando...' : `Cobrar y enviar ticket por WA`}
                    </button>
                  </div>
                )}

                {selVender.length === 0 && disponibles.length === 0 && (
                  <div className="bg-yellow-50 rounded-2xl p-6 text-center">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="font-bold text-yellow-800">¡Todos los números están vendidos!</p>
                    <button onClick={() => setTab('notificar')} className="mt-3 text-sm text-primary underline">Ir a notificaciones →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== TAB NOTIFICAR ===== */}
        {tab === 'notificar' && (
          <div className="space-y-4">

            {/* Avisar sorteo */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-blue-50 p-4 border-b">
                <h3 className="font-bold text-blue-800">📢 Avisar a todos del sorteo</h3>
                <p className="text-xs text-blue-600 mt-1">
                  Próxima Lotería Nacional nocturna: <strong>{proximaLoteria()}</strong>
                </p>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600">
                  Se enviará un mensaje a <strong>{compradores.length} compradores</strong> únicos avisando cuándo es el sorteo y recordándoles sus números.
                </p>

                {!notifIniciada ? (
                  <button onClick={() => { setNotifIndex(0); setNotifIniciada(true); avisarSorteo(0) }}
                    disabled={compradores.length === 0}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                    <WaIcon />
                    Empezar a avisar ({compradores.length} mensajes)
                  </button>
                ) : notifIndex < compradores.length ? (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(notifIndex / compradores.length) * 100}%` }} />
                    </div>
                    <p className="text-sm text-center text-gray-600">{notifIndex} de {compradores.length} enviados</p>
                    <button onClick={() => avisarSorteo(notifIndex)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                      <WaIcon />
                      Enviar al siguiente →
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="font-bold text-green-700">✅ ¡Todos avisados!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Avisar ganador */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-yellow-50 p-4 border-b">
                <h3 className="font-bold text-yellow-800">🏆 Publicar número ganador</h3>
                <p className="text-xs text-yellow-600 mt-1">Ingresá el primer número de la Lotería Nacional nocturna</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Número ganador (Lotería Nacional)</label>
                  <input type="number" value={ganadorNum} onChange={e => setGanadorNum(e.target.value)}
                    placeholder="ej: 47"
                    className="w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-2xl font-bold text-center" />
                </div>

                {ganadorNum && (
                  <div className="bg-yellow-50 rounded-xl p-3 text-sm text-center">
                    {(() => {
                      const ganador = pagados.find(n => String(n.numero) === ganadorNum)
                      return ganador
                        ? <p>🏆 Ganador: <strong>{ganador.comprador_nombre}</strong> con el número <strong>{formatNumero(+ganadorNum, total)}</strong></p>
                        : <p className="text-gray-500">El número {formatNumero(+ganadorNum, total)} no está vendido o no existe en esta rifa.</p>
                    })()}
                  </div>
                )}

                {ganadorNum && (
                  notifIndex < compradores.length ? (
                    <div className="space-y-2">
                      {notifIndex > 0 && (
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${(notifIndex / compradores.length) * 100}%` }} />
                        </div>
                      )}
                      <button onClick={() => { setNotifIndex(0); avisarGanador(0) }}
                        disabled={notifIndex > 0}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                        <WaIcon />
                        {notifIndex === 0 ? `Notificar a todos (${compradores.length} mensajes)` : `Siguiente → (${notifIndex}/${compradores.length})`}
                      </button>
                      {notifIndex > 0 && (
                        <button onClick={() => avisarGanador(notifIndex)}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                          <WaIcon /> Enviar al siguiente →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="font-bold text-green-700">✅ ¡Todos notificados del resultado!</p>
                    </div>
                  )
                )}
              </div>
            </div>

            <p className="text-xs text-center text-gray-400 pb-4">
              Los mensajes se abren de a uno en WhatsApp. Tocás "Enviar" en cada uno y volvés acá para el siguiente.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
