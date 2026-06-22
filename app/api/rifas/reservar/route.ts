import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import MercadoPagoConfig, { Preference } from 'mercadopago'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

  try {
    const { rifaId, numeros, nombre, telefono } = await req.json()

    if (!rifaId || !numeros?.length || !nombre || !telefono) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Verificar que los números estén disponibles
    const { data: disponibles, error: errDisp } = await supabase
      .from('numeros_rifa')
      .select('id, numero, estado')
      .eq('rifa_id', rifaId)
      .in('numero', numeros)

    if (errDisp) throw new Error(errDisp.message)

    const noDisponibles = disponibles?.filter(n => n.estado !== 'disponible') ?? []
    if (noDisponibles.length > 0) {
      return NextResponse.json({
        error: `Los números ${noDisponibles.map(n => n.numero).join(', ')} ya no están disponibles`,
      }, { status: 409 })
    }

    // Obtener datos de la rifa
    const { data: rifa } = await supabase
      .from('rifas')
      .select('titulo, precio_numero, comision_plat')
      .eq('id', rifaId)
      .single()

    if (!rifa) return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 })

    const montoTotal = rifa.precio_numero * numeros.length
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

    // Crear preferencia MP
    const preference = new Preference(mp)
    const pref = await preference.create({
      body: {
        items: [{
          id: rifaId,
          title: `${rifa.titulo} — Números ${numeros.join(', ')}`,
          quantity: 1,
          unit_price: montoTotal,
          currency_id: 'ARS',
        }],
        payer: { name: nombre, phone: { number: telefono } },
        back_urls: {
          success: `${baseUrl}/rifa/pago-ok?rifa=${rifaId}`,
          failure: `${baseUrl}/rifa/pago-error`,
          pending: `${baseUrl}/rifa/pago-pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/mp/webhook`,
        metadata: {
          rifa_id: rifaId,
          numeros,
          comprador_nombre: nombre,
          comprador_tel: telefono,
        },
        // Split: comisión para la plataforma
        // marketplace_fee: montoTotal * rifa.comision_plat,
      },
    })

    // Reservar números temporalmente
    const ahora = new Date().toISOString()
    await supabase
      .from('numeros_rifa')
      .update({
        estado: 'reservado',
        comprador_nombre: nombre,
        comprador_tel: telefono,
        mp_preference_id: pref.id,
        reservado_en: ahora,
      })
      .eq('rifa_id', rifaId)
      .in('numero', numeros)

    return NextResponse.json({ init_point: pref.init_point })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
