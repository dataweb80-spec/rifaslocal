import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import GrillaNumeros from '@/components/GrillaNumeros'
import BotonCompartir from '@/components/BotonCompartir'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ nueva?: string; plan?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('rifas').select('titulo, descripcion, nombre_comercio').eq('slug', slug).single()
  return {
    title: data?.titulo ?? 'Rifa',
    description: data?.descripcion ?? `Participá en ${data?.nombre_comercio ?? 'esta rifa'}`,
  }
}

export default async function RifaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { nueva, plan } = await searchParams
  const supabase = await createClient()

  const { data: rifa } = await supabase
    .from('rifas')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!rifa) notFound()

  // Rifas comercio en borrador (esperando pago del plan) - mostrar pantalla de espera
  if (rifa.estado === 'borrador') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">{rifa.titulo}</h1>
          {rifa.nombre_comercio && <p className="text-primary font-semibold mb-4">{rifa.nombre_comercio}</p>}
          <p className="text-gray-500 mb-6">Esta rifa está pendiente de activación. El organizador debe completar el pago del plan para que esté disponible.</p>
          <a href="/" className="text-primary font-semibold hover:underline">← Volver al inicio</a>
        </div>
      </div>
    )
  }

  const { data: numeros } = await supabase
    .from('numeros_rifa')
    .select('numero, estado, comprador_nombre')
    .eq('rifa_id', rifa.id)
    .order('numero')

  const pagados = numeros?.filter(n => n.estado === 'pagado').length ?? 0
  const reservados = numeros?.filter(n => n.estado === 'reservado').length ?? 0
  const disponibles = (rifa.cantidad_numeros) - pagados - reservados
  const progreso = Math.round((pagados / rifa.cantidad_numeros) * 100)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://rifaslocal.vercel.app'
  const urlRifa = `${baseUrl}/rifa/${rifa.slug}`

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl">🎟</span>
          <span className="font-bold text-primary">RifaLocal</span>
        </a>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${rifa.tipo === 'comercio' ? 'bg-primary-light text-primary' : 'bg-orange-100 text-orange-700'}`}>
          {rifa.tipo === 'comercio' ? '🏪 Comercio' : '🎁 Rifa paga'}
        </span>
      </nav>

      {nueva && (
        <div className="bg-green-500 text-white text-center py-3 px-4">
          <p className="font-bold">🎉 ¡Tu rifa está activa! Compartí el link para que la gente compre números.</p>
        </div>
      )}
      {plan === 'pendiente' && (
        <div className="bg-yellow-500 text-white text-center py-3 px-4">
          <p className="font-bold">⏳ Pago en proceso. Tu rifa se activará cuando se confirme el pago.</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Encabezado */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {rifa.imagen_url && (
            <img src={rifa.imagen_url} alt={rifa.titulo} className="w-full h-56 object-cover" />
          )}
          {!rifa.imagen_url && (
            <div className={`w-full h-32 flex items-center justify-center text-6xl ${rifa.tipo === 'comercio' ? 'bg-primary-light' : 'bg-orange-50'}`}>
              {rifa.tipo === 'comercio' ? '🏪' : '🎁'}
            </div>
          )}
          <div className="p-6">
            {/* Comercio header */}
            {rifa.nombre_comercio && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                {rifa.logo_url
                  ? <img src={rifa.logo_url} alt={rifa.nombre_comercio} className="w-12 h-12 rounded-xl object-cover border" />
                  : <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white ${rifa.tipo === 'paga' ? 'bg-accent' : 'bg-primary'}`}>{rifa.nombre_comercio[0].toUpperCase()}</div>
                }
                <div>
                  <p className="font-bold">{rifa.nombre_comercio}</p>
                  <p className="text-xs text-gray-500">{rifa.tipo === 'comercio' ? 'Comercio / Entidad organizadora' : 'Organizador'}</p>
                </div>
              </div>
            )}

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

            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{pagados} vendidos</span>
                <span className="font-semibold">{progreso}% completado</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${rifa.tipo === 'paga' ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${progreso}%` }} />
              </div>
            </div>

            <div className="mt-4 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
              <span className="text-xl">🎰</span>
              <div>
                <p className="font-semibold">Sorteo con Lotería Nacional nocturna</p>
                <p className="text-xs text-blue-600">El primer número ganador del día en que se complete la rifa</p>
              </div>
            </div>
          </div>
        </div>

        <BotonCompartir url={urlRifa} titulo={rifa.titulo} slug={rifa.slug} />

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

        {rifa.estado === 'activa' && (
          <GrillaNumeros
            rifaId={rifa.id}
            numeros={numeros ?? []}
            precioNumero={rifa.precio_numero}
            slug={rifa.slug}
            tipo={rifa.tipo}
            titulo={rifa.titulo}
            imagen_url={rifa.imagen_url}
            nombre_comercio={rifa.nombre_comercio}
            logo_url={rifa.logo_url}
          />
        )}

        {rifa.estado === 'llena' && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">⏳</p>
            <p className="text-xl font-bold text-yellow-800">¡Todos los números vendidos!</p>
            <p className="text-gray-600 mt-2">Esperando el número de la Lotería Nacional nocturna para determinar el ganador.</p>
          </div>
        )}

      </div>
    </div>
  )
}
