'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import UploadImagen from '@/components/UploadImagen'

const PLANES_COMERCIO = [
  { numeros: 50,  precio: 20000 },
  { numeros: 100, precio: 40000 },
  { numeros: 200, precio: 60000 },
  { numeros: 400, precio: 80000 },
  { numeros: 600, precio: 100000 },
  { numeros: 999, precio: 120000 },
]

const PLATFORM_ALIAS = process.env.NEXT_PUBLIC_PLATFORM_ALIAS ?? 'danielmfaggi'

function CrearRifaForm() {
  const router = useRouter()
  const params = useSearchParams()
  const tipoInicial = params.get('tipo') === 'comercio' ? 'comercio' : 'paga'

  const [tipo, setTipo] = useState<'paga' | 'comercio'>(tipoInicial)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rifaCreada, setRifaCreada] = useState<{ id: string; slug: string } | null>(null)
  const [pagoAvisado, setPagoAvisado] = useState(false)

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    nombre_comercio: '',
    logo_url: '',
    mp_alias: '',
    tel_organizador: '',
    precio_numero: '',
    cantidad_numeros: '100',
    plan_numeros: 100,
    plan_precio: 40000,
    terminos_ok: false,
  })

  function set(field: string, value: string | boolean | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const gananciaOrganizador = form.precio_numero
    ? +form.precio_numero * +form.cantidad_numeros * 0.90
    : 0

  async function handleActivarPlan() {
    if (!rifaCreada) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rifas/activar-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifaId: rifaCreada.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al activar')

      // Avisar al admin de RifaLocal por WhatsApp si hay número configurado
      const adminPhone = process.env.NEXT_PUBLIC_PLATFORM_PHONE
      if (adminPhone) {
        const msg = encodeURIComponent(
          `💰 *NUEVO PLAN PAGADO — RifaLocal*\n\n` +
          `🏪 *${form.nombre_comercio}*\n` +
          `🎁 ${form.titulo}\n` +
          `🔢 Plan: ${form.plan_numeros} números\n` +
          `💵 Monto: $${form.plan_precio.toLocaleString('es-AR')}\n` +
          `📱 WA organizador: +54${form.tel_organizador.replace(/\D/g, '')}\n\n` +
          `✅ Ya pagó por alias *${PLATFORM_ALIAS}*. Verificar en MP.`
        )
        const telLimpio = adminPhone.replace(/\D/g, '')
        const waAdmin = telLimpio.startsWith('54') ? telLimpio : `54${telLimpio}`
        window.open(`https://wa.me/${waAdmin}?text=${msg}`, '_blank')
      }

      setPagoAvisado(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!form.terminos_ok) { setError('Debés aceptar los términos'); return }
    setLoading(true)
    setError('')
    try {
      const body = tipo === 'paga'
        ? { tipo: 'paga', titulo: form.titulo, descripcion: form.descripcion, imagen_url: form.imagen_url, nombre_comercio: form.nombre_comercio, logo_url: form.logo_url, mp_alias: form.mp_alias, tel_organizador: form.tel_organizador, precio_numero: +form.precio_numero, cantidad_numeros: +form.cantidad_numeros, terminos_ok: true }
        : { tipo: 'comercio', titulo: form.titulo, descripcion: form.descripcion, imagen_url: form.imagen_url, nombre_comercio: form.nombre_comercio, logo_url: form.logo_url, tel_organizador: form.tel_organizador, precio_numero: 0, cantidad_numeros: form.plan_numeros, precio_plan: form.plan_precio, terminos_ok: true }

      const res = await fetch('/api/rifas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear')

      if (tipo === 'comercio') {
        // Guardar datos para el paso 4 (pago del plan)
        setRifaCreada({ id: data.id, slug: data.slug })
        setStep(4)
      } else {
        router.push(`/rifa/${data.slug}?nueva=1&gestionar=${data.id}`)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <a href="/" className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🎟</span>
          <span className="text-xl font-bold text-primary">RifaLocal</span>
        </a>
        <h1 className="text-3xl font-bold mb-2">Crear rifa</h1>

        <div className="flex gap-3 mb-6">
          <button onClick={() => setTipo('paga')} className={`flex-1 py-3 rounded-xl font-semibold border-2 transition text-sm ${tipo === 'paga' ? 'bg-accent text-white border-accent' : 'bg-white border-gray-200 text-gray-600'}`}>
            🎁 Rifa paga
          </button>
          <button onClick={() => setTipo('comercio')} className={`flex-1 py-3 rounded-xl font-semibold border-2 transition text-sm ${tipo === 'comercio' ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600'}`}>
            🏪 Comercio / Entidad
          </button>
        </div>

        {step < 4 && (
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-2 rounded-full transition-all ${s <= step ? (tipo === 'paga' ? 'bg-accent' : 'bg-primary') : 'bg-gray-200'}`} />
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm">

          {/* PASO 1: Comercio + Premio */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">{tipo === 'paga' ? 'Datos del organizador y el premio' : 'Datos de tu comercio o entidad'}</h2>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {tipo === 'paga' ? 'Nombre del organizador *' : 'Nombre del comercio / entidad *'}
                </label>
                <input type="text" value={form.nombre_comercio} onChange={e => set('nombre_comercio', e.target.value)}
                  placeholder={tipo === 'paga' ? 'ej: Juan García' : 'ej: Carnicería Don Juan / Club Atlético Norte'}
                  className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {tipo === 'paga' ? 'Tu foto o logo (opcional)' : 'Logo del comercio / entidad (opcional)'}
                </label>
                <UploadImagen actual={form.logo_url} onUpload={url => set('logo_url', url)} />
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-1">
                  {tipo === 'paga' ? '¿Cuál es el premio? *' : '¿Qué vas a sortear? *'}
                </label>
                <input type="text" value={form.titulo} onChange={e => set('titulo', e.target.value)}
                  placeholder={tipo === 'paga' ? 'ej: Smart TV Samsung 43"' : 'ej: Sorteo Pollo Asado'}
                  className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción del premio</label>
                <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                  placeholder="Describí el premio con detalle..." rows={2}
                  className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Foto del premio (opcional)</label>
                <UploadImagen actual={form.imagen_url} onUpload={url => set('imagen_url', url)} />
              </div>

              <button disabled={!form.titulo.trim() || !form.nombre_comercio.trim()} onClick={() => setStep(2)}
                className={`w-full text-white py-3 rounded-xl font-semibold disabled:opacity-50 ${tipo === 'paga' ? 'bg-accent hover:opacity-90' : 'bg-primary hover:bg-primary-dark'}`}>
                Siguiente →
              </button>
            </div>
          )}

          {/* PASO 2 PAGA: Precio + Alias MP */}
          {step === 2 && tipo === 'paga' && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">Precio y datos de cobro</h2>

              <div>
                <label className="block text-sm font-medium mb-1">Precio por número (ARS) *</label>
                <input type="number" value={form.precio_numero} onChange={e => set('precio_numero', e.target.value)}
                  placeholder="ej: 5000" min="1"
                  className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-lg font-semibold" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cantidad de números</label>
                <div className="grid grid-cols-4 gap-2">
                  {['50', '100', '200', '500'].map(n => (
                    <button key={n} onClick={() => set('cantidad_numeros', n)}
                      className={`py-2.5 rounded-lg border font-semibold ${form.cantidad_numeros === n ? 'bg-accent text-white border-accent' : 'border-gray-200 hover:border-accent'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {form.precio_numero && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Total a recaudar</span><span className="font-bold">${(+form.precio_numero * +form.cantidad_numeros).toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Comisión RifaLocal (10%)</span><span>−${(+form.precio_numero * +form.cantidad_numeros * 0.10).toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between font-bold text-accent border-t pt-2 mt-1"><span>Recibís vos</span><span>${gananciaOrganizador.toLocaleString('es-AR')}</span></div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 mb-4">
                  <p className="font-semibold mb-1">💳 ¿Cómo recibís el pago?</p>
                  <p>Los compradores te pagan directamente por MercadoPago usando tu alias. Ingresá tu alias de MP para que aparezca en la pantalla de pago.</p>
                </div>

                <label className="block text-sm font-medium mb-1">Tu alias de MercadoPago *</label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                  <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r">alias:</span>
                  <input type="text" value={form.mp_alias} onChange={e => set('mp_alias', e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="tualias"
                    className="flex-1 px-3 py-2.5 focus:outline-none font-semibold" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Encontralo en MercadoPago → Tu perfil → Alias</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tu WhatsApp (para recibir avisos de compra) *</label>
                <div className="flex gap-2">
                  <span className="border rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 text-sm whitespace-nowrap">🇦🇷 +54</span>
                  <input type="tel" value={form.tel_organizador} onChange={e => set('tel_organizador', e.target.value)}
                    placeholder="11 1234-5678"
                    className="flex-1 border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Cuando alguien compre un número te llegará un WhatsApp con los datos del comprador.</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 border py-3 rounded-xl font-semibold hover:border-accent">← Atrás</button>
                <button disabled={!form.precio_numero || !form.mp_alias.trim() || !form.tel_organizador.trim()} onClick={() => setStep(3)}
                  className="flex-1 bg-accent text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:opacity-90">Siguiente →</button>
              </div>
            </div>
          )}

          {/* PASO 2 COMERCIO: Plan */}
          {step === 2 && tipo === 'comercio' && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">Elegí tu plan</h2>
              <p className="text-sm text-gray-500">Tus clientes participan gratis. Vos pagás una vez.</p>
              <div className="space-y-2">
                {PLANES_COMERCIO.map(plan => (
                  <button key={plan.numeros} onClick={() => { set('plan_numeros', plan.numeros); set('plan_precio', plan.precio) }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${form.plan_numeros === plan.numeros ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-primary bg-white'}`}>
                    <div className="text-left">
                      <p className={`font-bold ${form.plan_numeros === plan.numeros ? 'text-primary' : ''}`}>{plan.numeros} números</p>
                      <p className="text-xs text-gray-500">Hasta {plan.numeros} participantes</p>
                    </div>
                    <p className={`text-xl font-bold ${form.plan_numeros === plan.numeros ? 'text-primary' : 'text-gray-700'}`}>${plan.precio.toLocaleString('es-AR')}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tu WhatsApp (para recibir avisos) *</label>
                <div className="flex gap-2">
                  <span className="border rounded-lg px-3 py-2.5 bg-gray-50 text-gray-500 text-sm whitespace-nowrap">🇦🇷 +54</span>
                  <input type="tel" value={form.tel_organizador} onChange={e => set('tel_organizador', e.target.value)}
                    placeholder="11 1234-5678"
                    className="flex-1 border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 border py-3 rounded-xl font-semibold hover:border-primary">← Atrás</button>
                <button disabled={!form.tel_organizador.trim()} onClick={() => setStep(3)} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-primary-dark">Siguiente →</button>
              </div>
            </div>
          )}

          {/* PASO 3: Confirmación */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">Confirmación</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-3 pb-3 border-b">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="logo" className="w-12 h-12 rounded-xl object-cover border" />
                    : <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold text-white ${tipo === 'paga' ? 'bg-accent' : 'bg-primary'}`}>{form.nombre_comercio[0]?.toUpperCase()}</div>
                  }
                  <div>
                    <p className="font-bold">{form.nombre_comercio}</p>
                    <p className="text-xs text-gray-500">{tipo === 'paga' ? 'Organizador' : 'Comercio / Entidad'}</p>
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Premio</span><span className="font-medium">{form.titulo}</span></div>
                {tipo === 'paga' ? (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Precio / número</span><span className="font-medium">${(+form.precio_numero).toLocaleString('es-AR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Cantidad</span><span className="font-medium">{form.cantidad_numeros} números</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Alias MP</span><span className="font-medium text-blue-600">{form.mp_alias}</span></div>
                    <div className="flex justify-between font-bold text-accent border-t pt-2"><span>Recibís vos</span><span>${gananciaOrganizador.toLocaleString('es-AR')}</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Participantes</span><span className="font-medium">{form.plan_numeros} números</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Clientes participan</span><span className="font-medium text-green-600">✅ Gratis</span></div>
                    <div className="flex justify-between font-bold text-primary border-t pt-2"><span>Pagás el plan</span><span>${form.plan_precio.toLocaleString('es-AR')}</span></div>
                  </>
                )}
              </div>

              {tipo === 'comercio' && (
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                  <span className="text-xl">💳</span>
                  <div>
                    <p className="font-semibold mb-1">Pago del plan por MercadoPago</p>
                    <p>Al confirmar vas a MercadoPago a pagar el plan. Una vez acreditado, tu sorteo queda activo automáticamente.</p>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 rounded-xl p-3 text-sm text-yellow-800">
                🎰 <strong>Sorteo con Lotería Nacional nocturna</strong> al completarse todos los números.
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.terminos_ok} onChange={e => set('terminos_ok', e.target.checked)} className="mt-1" />
                <span className="text-sm text-gray-600">
                  Leí y acepto los <a href="/terminos" target="_blank" className="text-primary underline">Términos y Condiciones</a>. Declaro que el premio existe y me comprometo a entregarlo al ganador.
                </span>
              </label>

              {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 border py-3 rounded-xl font-semibold hover:border-primary">← Atrás</button>
                <button disabled={loading || !form.terminos_ok} onClick={handleSubmit}
                  className={`flex-1 text-white py-3 rounded-xl font-semibold disabled:opacity-50 ${tipo === 'paga' ? 'bg-accent hover:opacity-90' : 'bg-primary hover:bg-primary-dark'}`}>
                  {loading ? 'Procesando...' : tipo === 'paga' ? '🎟 Publicar rifa' : '💳 Pagar plan y publicar'}
                </button>
              </div>
            </div>
          )}
          {/* PASO 4 COMERCIO: Pago del plan a RifaLocal */}
          {step === 4 && rifaCreada && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">🎉</div>
                <h2 className="text-xl font-bold">¡Tu rifa está lista!</h2>
                <p className="text-gray-500 text-sm mt-1">Solo falta pagar el plan para activarla.</p>
              </div>

              {/* Resumen */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-3 pb-3 border-b">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="logo" className="w-10 h-10 rounded-xl object-cover border" />
                    : <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white">{form.nombre_comercio[0]?.toUpperCase()}</div>
                  }
                  <div>
                    <p className="font-bold">{form.nombre_comercio}</p>
                    <p className="text-xs text-gray-500">{form.titulo} · {form.plan_numeros} números</p>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-primary">
                  <span>Plan a pagar</span>
                  <span>${form.plan_precio.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Alias de pago */}
              <div className="bg-blue-50 rounded-2xl p-5 text-center border-2 border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-2">Pagá el plan por MercadoPago al alias:</p>
                <div className="bg-white rounded-xl px-6 py-3 inline-block border border-blue-200 mb-2">
                  <p className="text-2xl font-black text-blue-700 tracking-wide">{PLATFORM_ALIAS}</p>
                </div>
                <p className="text-xs text-blue-500">Monto exacto: <strong>${form.plan_precio.toLocaleString('es-AR')}</strong></p>
                <p className="text-xs text-blue-400 mt-1">MercadoPago → Pagar → Alias</p>
              </div>

              {/* Botones */}
              {!pagoAvisado ? (
                <div className="space-y-3">
                  <button
                    onClick={() => window.open(`https://link.mercadopago.com.ar/${PLATFORM_ALIAS}`, '_blank')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition">
                    <svg viewBox="0 0 40 40" className="w-7 h-7 fill-white"><path d="M20 0C9 0 0 9 0 20s9 20 20 20 20-9 20-20S31 0 20 0zm9.5 17.5c-.5 3-3 5.5-6 6.5l-1.5.5v3.5H19V24l-1.5-.5C14 22.5 11.5 20 11 17H9c.5 4 3.5 7 7.5 8.5V29h7v-3.5c4-1.5 7-4.5 7.5-8.5h-1.5z"/></svg>
                    Abrir MercadoPago
                  </button>
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs text-gray-400 whitespace-nowrap">Una vez que transferiste</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>
                  <button
                    disabled={loading}
                    onClick={handleActivarPlan}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition">
                    {loading ? 'Activando...' : '✅ Ya pagué — Activar mi rifa'}
                  </button>
                  {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-3xl">🚀</p>
                  <p className="text-xl font-bold text-green-700">¡Rifa activada!</p>
                  <p className="text-sm text-gray-600">Tu sorteo ya está publicado y listo para compartir.</p>
                  <a href={`/rifa/${rifaCreada.slug}?nueva=1&gestionar=${rifaCreada.id}`}
                    className="block bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition">
                    Ver mi rifa y panel de gestión →
                  </a>
                </div>
              )}

              <p className="text-xs text-center text-gray-400">
                ¿Problemas con el pago? Escribinos por WhatsApp y lo activamos manualmente.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function CrearRifaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <CrearRifaForm />
    </Suspense>
  )
}
