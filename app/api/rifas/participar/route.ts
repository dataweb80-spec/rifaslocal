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
    const { data: disponibles } = await supabase
      .from('numeros_rifa')
      .select('numero, estado')
      .eq('rifa_id', rifaId)
      .in('numero', numeros)

    const noDisponibles = disponibles?.filter(n => n.estado !== 'disponible') ?? []
    if (noDisponibles.length > 0) {
      return NextResponse.json({
        error: `Los números ${noDisponibles.map(n => n.numero).join(', ')} ya están tomados`,
      }, { status: 409 })
    }

    // Registrar como pagado directo (comercio paga el plan, participación es gratis)
    await supabase
      .from('numeros_rifa')
      .update({
        estado: 'pagado',
        comprador_nombre: nombre,
        comprador_tel: telefono,
        pagado_en: new Date().toISOString(),
      })
      .eq('rifa_id', rifaId)
      .in('numero', numeros)

    // Verificar si se llenó
    const { data: rifa } = await supabase
      .from('rifas')
      .select('cantidad_numeros')
      .eq('id', rifaId)
      .single()

    const { count } = await supabase
      .from('numeros_rifa')
      .select('*', { count: 'exact', head: true })
      .eq('rifa_id', rifaId)
      .eq('estado', 'pagado')

    if (rifa && count === rifa.cantidad_numeros) {
      await supabase
        .from('rifas')
        .update({ estado: 'llena' })
        .eq('id', rifaId)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
