import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { rifaId, numeros, nombre, telefono } = await req.json()

    if (!rifaId || !numeros?.length || !nombre || !telefono) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Verificar disponibilidad
    const { data: disponibles, error: errDisp } = await supabase
      .from('numeros_rifa')
      .select('id, numero, estado')
      .eq('rifa_id', rifaId)
      .in('numero', numeros)

    if (errDisp) throw new Error(errDisp.message)

    const noDisponibles = disponibles?.filter(n => n.estado !== 'disponible') ?? []
    if (noDisponibles.length > 0) {
      return NextResponse.json({
        error: `Los números ${noDisponibles.map((n: any) => n.numero).join(', ')} ya no están disponibles`,
      }, { status: 409 })
    }

    // Reservar — el organizador confirma manualmente al verificar el pago en MP
    await supabase
      .from('numeros_rifa')
      .update({
        estado: 'reservado',
        comprador_nombre: nombre,
        comprador_tel: telefono,
        reservado_en: new Date().toISOString(),
      })
      .eq('rifa_id', rifaId)
      .in('numero', numeros)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
