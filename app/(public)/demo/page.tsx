'use client'

import { useState } from 'react'
import Link from 'next/link'

const PASOS = [
  {
    id: 1,
    titulo: 'Creás la rifa',
    subtitulo: 'En 5 minutos, desde el celular',
    icono: '📝',
    color: 'bg-purple-50 border-primary',
    contenido: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-xl">🎁</div>
            <div>
              <p className="font-bold">Smart TV Samsung 43&quot;</p>
              <p className="text-xs text-gray-500">Premio cargado con foto</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-accent">$5.000</p>
              <p className="text-xs text-gray-500">por número</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">100</p>
              <p className="text-xs text-gray-500">números totales</p>
            </div>
          </div>
          <div className="mt-3 bg-accent/10 rounded-lg p-2 text-xs text-center text-accent font-semibold">
            Recaudás $500.000 → Recibís $450.000
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center">Subís foto del premio, elegís precio y cantidad. Listo.</p>
      </div>
    ),
  },
  {
    id: 2,
    titulo: 'Compartís el QR y el link',
    subtitulo: 'Tus clientes acceden desde el celular',
    icono: '📲',
    color: 'bg-blue-50 border-blue-300',
    contenido: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm flex gap-4 items-center">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://rifalocal.ar/rifa/tv-samsung-demo"
            alt="QR demo"
            className="w-24 h-24 rounded-lg border"
          />
          <div>
            <p className="font-bold mb-1">QR de tu rifa</p>
            <p className="text-xs text-gray-500 mb-2">Lo imprimís y lo colgás en tu negocio. Tus clientes lo escanean y van directo a la página.</p>
            <div className="flex gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">WhatsApp</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Instagram</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Facebook</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center">Cada rifa tiene su link único y QR descargable.</p>
      </div>
    ),
  },
  {
    id: 3,
    titulo: 'El comprador elige su número',
    subtitulo: 'Ve la grilla y paga con MercadoPago',
    icono: '🔢',
    color: 'bg-orange-50 border-orange-300',
    contenido: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-2">GRILLA DE NÚMEROS</p>
          <div className="grid grid-cols-10 gap-1 mb-3">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
              <div key={n} className={`aspect-square rounded text-xs font-bold flex items-center justify-center text-center
                ${n === 7 || n === 13 || n === 22 ? 'bg-gray-200 text-gray-400' : n === 5 ? 'bg-accent text-white ring-2 ring-accent' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {n}
              </div>
            ))}
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-sm font-bold text-accent">Número #5 seleccionado — $5.000</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-gray-200 rounded px-2 py-0.5">🔴 Vendido</span>
              <span className="text-xs bg-accent text-white rounded px-2 py-0.5">Tuyo</span>
              <span className="text-xs bg-white border rounded px-2 py-0.5">Disponible</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center">Ingresa nombre, WhatsApp y paga. En segundos.</p>
      </div>
    ),
  },
  {
    id: 4,
    titulo: 'Recibe confirmación por WhatsApp',
    subtitulo: 'Le llega el número y cuándo se sortea',
    icono: '✉️',
    color: 'bg-green-50 border-green-300',
    contenido: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 text-sm max-w-xs">
            <p className="font-bold text-green-700 mb-1">✅ ¡Número reservado!</p>
            <p>Hola <strong>María</strong>, tu número es <strong>#5</strong>.</p>
            <p className="mt-2">🎰 Cuando se vendan todos los números, el sorteo se hará con el primer número de la <strong>Lotería Nacional nocturna</strong>.</p>
            <p className="mt-2">Seguí la rifa en tiempo real acá 👇<br />
              <span className="text-blue-600 underline text-xs">rifalocal.ar/rifa/tv-samsung</span>
            </p>
            <p className="text-xs text-gray-400 mt-2 text-right">✓✓ 14:32</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">← Mensaje que recibe el comprador en WhatsApp</p>
        </div>
        <p className="text-sm text-gray-500 text-center">Automático, sin que hagas nada.</p>
      </div>
    ),
  },
  {
    id: 5,
    titulo: 'Todos siguen la rifa en vivo',
    subtitulo: 'Ven cuántos números quedan',
    icono: '👀',
    color: 'bg-yellow-50 border-yellow-300',
    contenido: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold">TV Samsung 43&quot;</p>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">EN VIVO</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>73 vendidos</span>
              <span className="font-semibold">73% completo</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-accent h-3 rounded-full" style={{ width: '73%' }} />
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">27 números disponibles de 100</p>
          <div className="mt-2 text-xs text-center text-blue-600 font-semibold">
            🔄 Se actualiza automáticamente
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center">Cualquiera puede entrar con el link y ver el estado.</p>
      </div>
    ),
  },
  {
    id: 6,
    titulo: 'Día del sorteo — Lotería Nacional',
    subtitulo: 'Se usa el primer número de la nocturna',
    icono: '🎰',
    color: 'bg-indigo-50 border-indigo-300',
    contenido: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-2">LOTERÍA NACIONAL NOCTURNA</p>
          <div className="flex justify-center gap-2 mb-3">
            {[5, 27, 14, 88, 31].map((n, i) => (
              <div key={n} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                ${i === 0 ? 'bg-primary text-white ring-4 ring-primary/30 scale-125' : 'bg-gray-100 text-gray-500'}`}>
                {n}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-3">El <strong className="text-primary">primer número (5)</strong> es el ganador</p>
          <div className="bg-green-500 text-white rounded-xl p-4">
            <p className="text-2xl font-black">#5</p>
            <p className="font-bold">¡GANADOR!</p>
            <p className="text-sm opacity-90">María González</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800 text-center">
          Si cae sábado o domingo, se usa el lunes siguiente
        </div>
      </div>
    ),
  },
  {
    id: 7,
    titulo: 'Se notifica al ganador',
    subtitulo: 'WhatsApp automático al número #5',
    icono: '🏆',
    color: 'bg-emerald-50 border-emerald-300',
    contenido: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 text-sm max-w-xs">
            <p className="font-bold text-yellow-600 mb-1">🏆 ¡GANASTE!</p>
            <p>Hola <strong>María</strong>, ¡felicitaciones! Tu número <strong>#5</strong> ganó la rifa de la <strong>Smart TV Samsung 43&quot;</strong>.</p>
            <p className="mt-2">📞 El organizador te va a contactar en las próximas <strong>24 horas</strong> para coordinar la entrega.</p>
            <p className="text-xs text-gray-400 mt-2 text-right">✓✓ 21:15</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center">El organizador también recibe el contacto del ganador.</p>
      </div>
    ),
  },
]

export default function DemoPage() {
  const [paso, setPaso] = useState(0)
  const actual = PASOS[paso]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🎟</span>
          <span className="font-bold text-primary">RifaLocal</span>
        </Link>
        <span className="text-xs bg-primary-light text-primary font-bold px-3 py-1 rounded-full">Demo interactiva</span>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-2">¿Cómo funciona?</h1>
        <p className="text-gray-500 text-center text-sm mb-6">Recorré el proceso paso a paso</p>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {PASOS.map((p, i) => (
            <button key={p.id} onClick={() => setPaso(i)}
              className={`flex-1 h-2 rounded-full transition-all ${i <= paso ? 'bg-primary' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Paso actual */}
        <div className={`bg-white rounded-2xl border-2 ${actual.color} p-6 shadow-sm mb-4`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{actual.icono}</span>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase mb-0.5">Paso {actual.id} de {PASOS.length}</div>
              <h2 className="text-xl font-bold">{actual.titulo}</h2>
              <p className="text-sm text-gray-500">{actual.subtitulo}</p>
            </div>
          </div>
          {actual.contenido}
        </div>

        {/* Navegación */}
        <div className="flex gap-3">
          <button onClick={() => setPaso(p => Math.max(0, p - 1))}
            disabled={paso === 0}
            className="flex-1 border-2 py-3 rounded-xl font-semibold disabled:opacity-30 hover:border-primary transition">
            ← Anterior
          </button>
          {paso < PASOS.length - 1 ? (
            <button onClick={() => setPaso(p => p + 1)}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition">
              Siguiente →
            </button>
          ) : (
            <Link href="/crear" className="flex-1 bg-accent text-white py-3 rounded-xl font-bold text-center hover:opacity-90 transition">
              🎟 Crear mi rifa
            </Link>
          )}
        </div>

        {/* Mini índice */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {PASOS.map((p, i) => (
            <button key={p.id} onClick={() => setPaso(i)}
              className={`p-2 rounded-xl text-center transition ${i === paso ? 'bg-primary text-white' : 'bg-white border hover:border-primary'}`}>
              <div className="text-lg">{p.icono}</div>
              <div className="text-xs mt-0.5 font-medium leading-tight line-clamp-2">{p.titulo}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
