import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GrillaNumeros from '@/components/GrillaNumeros'
import BotonCompartir from '@/components/BotonCompartir'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ nueva?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('rifas').select('titulo, descripcion').eq('slug', slug).single()
  return {
    title: data?.titulo ?? 'Rifa',
    description: data?.descripcion ?? 'Participá en esta rifa',
  }
}

export default async function RifaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { nueva } = await searchParams
  const supabase = await createClient()

  const { data: rifa } = await supabase
    .from('rifas')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!rifa) notFound()

  const { data: numeros } = await supabase
    .from('numeros_rifa')
    .select('numero, estado, comprador_nombre')
    .eq('rifa_id', rifa.id)
    .order('numero')

  const pagados = numeros?.filter(n => n.estado === 'pagado').length ?? 0
  const reservados = numeros?.filter(n => n.estado === 'reservado').length ?? 0
  const disponibles = (rifa.cantidad_numeros) - pagados - reservados
  const progreso = Math.round((pagados / rifa.cantidad_numeros) * 100)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3800'
  const urlRifa = `${baseUrl}/rifa/${rifa.slug}`

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav simple */}
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl">🎟</span>
          <span className="font-bold text-primary">RifaLocal</span>
        </a>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${rifa.tipo === 'comercio' ? 'bg-primary-light text-primary' : 'bg-orange-100 text-orange-700'}`}>
          {rifa.tipo === 'comercio' ? '🏪 Comercio' : '🎁 Rifa paga'}
        </span>
      </nav>

      {/* Banner si es nueva */}
      {nueva && (
        <div className="bg-green-500 text-white text-center py-3 px-4">
          <p className="font-bold">🎉 ¡Tu rifa está activa! Compartí el link para que la gente compre números.</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Encabezado */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {rifa.imagen_url && (
            <img src={rifa.imagen_url} alt={rifa.titulo} className="w-full h-56 object-cover" />
          )}
          {!rifa.imagen_url && (
            <div className={`w-full h-40 flex items-center justify-center text-6xl ${rifa.tipo === 'comercio' ? 'bg-primary-light' : 'bg-orange-50'}`}>
              {rifa.tipo === 'comercio' ? '🏪' : '🎁'}
            </div>
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{rifa.titulo}</h1>
            {rifa.descripcion && <p className="text-gray-500 mb-4">{rifa.descripcion}</p>}

            <div className="flex items-center gap-4 flex-wrap mb-4">
              {rifa.tipo === 'paga' && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">${rifa.precio_numero.toLocaleString('es-AR')}</p>
                  <p className="text-xs text-gray-500">por número</p>
                </div>
              )}
              {rifa.tipo === 'comercio' && (
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold">
                  ✅ Participación GRATIS
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">{rifa.cantidad_numeros}</p>
                <p className="text-xs text-gray-500">números totales</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{disponibles}</p>
                <p className="text-xs text-gray-500">disponibles</p>
              </div>
            </div>

            {/* Barra progreso */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{pagados} pagados</span>
                <span className="font-semibold">{progreso}% completado</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${rifa.tipo === 'paga' ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${progreso}%` }} />
              </div>
            </div>

            {/* Sorteo */}
            <div className="mt-4 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
              <span className="text-xl">🎰</span>
              <div>
                <p className="font-semibold">Sorteo con Lotería Nacional nocturna</p>
                <p className="text-xs text-blue-600">El primer número ganador del día en que se complete la rifa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compartir */}
        <BotonCompartir url={urlRifa} titulo={rifa.titulo} slug={rifa.slug} />

        {/* Ganador */}
        {rifa.estado === 'finalizada' && rifa.ganador_numero && (
          <div className="bg-green-500 text-white rounded-2xl p-6 text-center shadow-lg">
            <p className="text-4xl mb-2">🏆</p>
            <p className="text-2xl font-bold mb-1">¡Rifa finalizada!</p>
            <p className="text-5xl font-black my-3">#{rifa.ganador_numero}</p>
            <p className="text-lg">es el número ganador</p>
            {rifa.loteria_numero && (
              <p className="text-sm opacity-80 mt-2">Número Lotería Nacional: {rifa.loteria_numero}</p>
            )}
          </div>
        )}

        {/* Grilla de números */}
        {(rifa.estado === 'activa') && (
          <GrillaNumeros
            rifaId={rifa.id}
            numeros={numeros ?? []}
            precioNumero={rifa.precio_numero}
            slug={rifa.slug}
            tipo={rifa.tipo}
            titulo={rifa.titulo}
            imagen_url={rifa.imagen_url}
          />
        )}

        {rifa.estado === 'llena' && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">⏳</p>
            <p className="text-xl font-bold text-yellow-800">¡Todos los números vendidos!</p>
            <p className="text-gray-600 mt-2">Esperando el número de la Lotería Nacional nocturna de hoy para determinar el ganador.</p>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-3">¿Cómo funciona?</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3"><span>1️⃣</span><span>Elegís tu número de la grilla</span></div>
            <div className="flex gap-3"><span>2️⃣</span><span>Ingresás tu nombre y número de WhatsApp</span></div>
            <div className="flex gap-3"><span>3️⃣</span><span>Pagás con MercadoPago (tarjeta, transferencia o saldo)</span></div>
            <div className="flex gap-3"><span>4️⃣</span><span>Recibís confirmación por WhatsApp con tu número</span></div>
            <div className="flex gap-3"><span>5️⃣</span><span>Cuando se llene, el sorteo se hace con el primer número de Lotería Nacional nocturna</span></div>
            <div className="flex gap-3"><span>6️⃣</span><span>Si ganás, te contactamos por WhatsApp dentro de las 24hs</span></div>
          </div>
        </div>

      </div>
    </div>
  )
}
