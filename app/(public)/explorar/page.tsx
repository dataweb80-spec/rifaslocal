import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 60

export default async function ExplorarPage() {
  const supabase = await createClient()

  const { data: rifas } = await supabase
    .from('rifas')
    .select(`
      id, titulo, imagen_url, precio_numero, cantidad_numeros, slug, estado,
      numeros_pagados:numeros_rifa(count)
    `)
    .in('estado', ['activa', 'llena'])
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Rifas activas</h1>
        <p className="text-gray-500 mb-8">Elegí tu número y participá</p>

        {!rifas || rifas.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🎟</div>
            <p className="text-lg">No hay rifas activas por ahora</p>
            <Link href="/crear" className="inline-block mt-4 text-primary font-semibold hover:underline">
              ¡Creá la primera!
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rifas.map((rifa: any) => {
              const pagados = rifa.numeros_pagados?.[0]?.count ?? 0
              const progreso = Math.round((pagados / rifa.cantidad_numeros) * 100)
              return (
                <Link key={rifa.id} href={`/rifa/${rifa.slug}`}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border hover:border-primary cursor-pointer">
                    {rifa.imagen_url ? (
                      <img src={rifa.imagen_url} alt={rifa.titulo} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-primary-light flex items-center justify-center text-5xl">🎁</div>
                    )}
                    <div className="p-5">
                      <h2 className="font-bold text-lg mb-1 line-clamp-2">{rifa.titulo}</h2>
                      <p className="text-2xl font-bold text-primary mb-3">
                        ${rifa.precio_numero.toLocaleString('es-AR')}
                        <span className="text-sm font-normal text-gray-500"> / número</span>
                      </p>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${progreso}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{pagados} vendidos</span>
                        <span>{rifa.cantidad_numeros - pagados} disponibles</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
