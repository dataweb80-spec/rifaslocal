import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import MercadoPagoConfig, { Preference } from 'mercadopago'

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
    const { tipo = 'paga', titulo, descripcion, precio_numero, cantidad_numeros, imagen_url, precio_plan, terminos_ok, nombre_comercio, logo_url } = body

    if (!titulo?.trim()) return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    if (!terminos_ok) return NextResponse.json({ error: 'Debés aceptar los términos' }, { status: 400 })
    if (tipo === 'paga' && (!precio_numero || +precio_numero <= 0)) {
      return NextResponse.json({ error: 'Precio por número inválido' }, { status: 400 })
    }

    const slug = generarSlug(titulo)
    const supabase = getSupabase()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

    // Para comercio, crear en estado 'borrador' hasta que se pague el plan
    const estadoInicial = tipo === 'comercio' ? 'borrador' : 'activa'

    const { data: rifa, error: errRifa } = await supabase
      .from('rifas')
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || null,
        precio_numero: tipo === 'paga' ? +precio_numero : 0,
        cantidad_numeros: +cantidad_numeros || 100,
        imagen_url: imagen_url?.trim() || null,
        nombre_comercio: nombre_comercio?.trim() || null,
        logo_url: logo_url?.trim() || null,
        slug,
        estado: estadoInicial,
        terminos_ok: true,
        tipo,
        sorteo_metodo: 'loteria',
        precio_plan: tipo === 'comercio' ? +precio_plan : null,
      })
      .select()
      .single()

    if (errRifa) throw new Error(errRifa.message)

    // Generar números solo para rifas paga (las comercio esperan pago)
    if (tipo === 'paga') {
      await supabase.rpc('generar_numeros_rifa', {
        p_rifa_id: rifa.id,
        p_cantidad: rifa.cantidad_numeros,
      })
      return NextResponse.json({ slug: rifa.slug, id: rifa.id })
    }

    // Para comercio: crear preferencia MP para cobrar el plan a la plataforma
    const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
    const preference = new Preference(mp)

    const pref = await preference.create({
      body: {
        items: [{
          id: rifa.id,
          title: `Plan RifaLocal — ${nombre_comercio || titulo} (${cantidad_numeros} números)`,
          quantity: 1,
          unit_price: +precio_plan,
          currency_id: 'ARS',
        }],
        back_urls: {
          success: `${baseUrl}/rifa/${rifa.slug}?nueva=1&plan=ok`,
          failure: `${baseUrl}/crear?error=pago`,
          pending: `${baseUrl}/rifa/${rifa.slug}?plan=pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/mp/webhook-plan`,
        metadata: {
          rifa_id: rifa.id,
          tipo: 'plan_comercio',
        },
      },
    })

    return NextResponse.json({ slug: rifa.slug, id: rifa.id, init_point: pref.init_point })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
