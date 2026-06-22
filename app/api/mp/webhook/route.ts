import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import MercadoPagoConfig, { Payment } from 'mercadopago'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

  try {
    const body = await req.json()

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    // Consultar pago en MP
    const paymentClient = new Payment(mp)
    const pago = await paymentClient.get({ id: paymentId })

    if (pago.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const meta = pago.metadata as any
    const { rifa_id, numeros, comprador_nombre, comprador_tel } = meta

    if (!rifa_id || !numeros?.length) {
      return NextResponse.json({ ok: true })
    }

    // Marcar números como pagados
    await supabase
      .from('numeros_rifa')
      .update({
        estado: 'pagado',
        mp_payment_id: String(paymentId),
        monto_pagado: pago.transaction_amount! / numeros.length,
        pagado_en: new Date().toISOString(),
      })
      .eq('rifa_id', rifa_id)
      .in('numero', numeros)

    // Registrar pago
    const montoTotal = pago.transaction_amount!
    const comision = montoTotal * 0.10
    await supabase.from('pagos').insert({
      numero_id: null, // simplificado para multi-número
      rifa_id,
      mp_payment_id: String(paymentId),
      monto_total: montoTotal,
      comision_plat: comision,
      monto_organizador: montoTotal - comision,
      estado_mp: 'approved',
    })

    // Verificar si la rifa se llenó
    const { data: rifa } = await supabase
      .from('rifas')
      .select('cantidad_numeros')
      .eq('id', rifa_id)
      .single()

    const { count } = await supabase
      .from('numeros_rifa')
      .select('*', { count: 'exact', head: true })
      .eq('rifa_id', rifa_id)
      .eq('estado', 'pagado')

    if (rifa && count === rifa.cantidad_numeros) {
      // ¡Rifa llena! Ejecutar sorteo automático
      await supabase.rpc('ejecutar_sorteo', { p_rifa_id: rifa_id })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Webhook MP error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
