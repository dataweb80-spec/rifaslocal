import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
    + '-' + Math.random().toString(36).slice(2, 7)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo = 'paga', titulo, descripcion, precio_numero, cantidad_numeros, imagen_url, precio_plan, terminos_ok } = body

    if (!titulo?.trim()) return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    if (!terminos_ok) return NextResponse.json({ error: 'Debés aceptar los términos' }, { status: 400 })

    if (tipo === 'paga' && (!precio_numero || +precio_numero <= 0)) {
      return NextResponse.json({ error: 'Precio por número inválido' }, { status: 400 })
    }

    const slug = generarSlug(titulo)
    const supabase = getSupabase()

    const { data: rifa, error: errRifa } = await supabase
      .from('rifas')
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || null,
        precio_numero: tipo === 'paga' ? +precio_numero : 0,
        cantidad_numeros: +cantidad_numeros || 100,
        imagen_url: imagen_url?.trim() || null,
        slug,
        estado: 'activa',
        terminos_ok: true,
        tipo,
        sorteo_metodo: 'loteria',
        precio_plan: tipo === 'comercio' ? +precio_plan : null,
      })
      .select()
      .single()

    if (errRifa) throw new Error(errRifa.message)

    await supabase.rpc('generar_numeros_rifa', {
      p_rifa_id: rifa.id,
      p_cantidad: rifa.cantidad_numeros,
    })

    return NextResponse.json({ slug: rifa.slug, id: rifa.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
