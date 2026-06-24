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

function CrearRifaForm() {
  const router = useRouter()
  const params = useSearchParams()
  const tipoInicial = params.get('tipo') === 'comercio' ? 'comercio' : 'paga'

  const [tipo, setTipo] = useState<'paga' | 'comercio'>(tipoInicial)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    nombre_comercio: '',
    logo_url: '',
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

  async function handleSubmit() {
    if (!form.terminos_ok) { setError('Debés aceptar los términos'); return }
    setLoading(true)
    setError('')
    try {
      const body = tipo === 'paga'
        ? { tipo: 'paga', titulo: form.titulo, descripcion: form.descripcion, imagen_url: form.imagen_url, nombre_comercio: form.nombre_comercio, logo_url: form.logo_url, precio_numero: +form.precio_numero, cantidad_numeros: +form.cantidad_numeros, terminos_ok: true }
        : { tipo: 'comercio', titulo: form.titulo, descripcion: form.descripcion, imagen_url: form.imagen_url, nombre_comercio: form.nombre_comercio, logo_url: form.logo_url, precio_numero: 0, cantidad_numeros: form.plan_numeros, precio_plan: form.plan_precio, terminos_ok: true }

      const res = await fetch('/api/rifas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear')

      if (tipo === 'comercio' && data.init_point) {
        window.location.href = data.init_point
      } else {
        router.push(`/rifa/${data.slug}?nueva=1`)
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

        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-2 rounded-full transition-all ${s <= step ? (tipo === 'paga' ? 'bg-accent' : 'bg-primary') : 'bg-gray-200'}`} />
          ))}
        </div>

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

          {/* PASO 2 PAGA: Números y precio */}
          {step === 2 && tipo === 'paga' && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">Precio y cantidad de números</h2>
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
                  <div className="flex justify-between text-gray-400"><span>Comisión plataforma (10%)</span><span>−${(+form.precio_numero * +form.cantidad_numeros * 0.10).toLocaleString('es-AR')}</span></div>
                  <div className="flex justify-between font-bold text-accent border-t pt-2 mt-1"><span>Recibís vos</span><span>${gananciaOrganizador.toLocaleString('es-AR')}</span></div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 border py-3 rounded-xl font-semibold hover:border-accent">← Atrás</button>
                <button disabled={!form.precio_numero} onClick={() => setStep(3)}
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
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 border py-3 rounded-xl font-semibold hover:border-primary">← Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark">Siguiente →</button>
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
