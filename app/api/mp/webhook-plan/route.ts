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
    if (body.type !== 'payment') return NextResponse.json({ ok: true })

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    const paymentClient = new Payment(mp)
    const pago = await paymentClient.get({ id: paymentId })
    if (pago.status !== 'approved') return NextResponse.json({ ok: true })

    const meta = pago.metadata as any
    const { rifa_id } = meta
    if (!rifa_id) return NextResponse.json({ ok: true })

    // Activar la rifa y generar números
    const { data: rifa } = await supabase
      .from('rifas')
      .update({ estado: 'activa', mp_plan_payment_id: String(paymentId) })
      .eq('id', rifa_id)
      .select('cantidad_numeros')
      .single()

    if (rifa) {
      await supabase.rpc('generar_numeros_rifa', {
        p_rifa_id: rifa_id,
        p_cantidad: rifa.cantidad_numeros,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
