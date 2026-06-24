import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { rifaId } = await req.json()
    if (!rifaId) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

    // Verificar que existe y está en borrador
    const { data: rifa, error: errGet } = await supabase
      .from('rifas')
      .select('id, estado, cantidad_numeros, slug')
      .eq('id', rifaId)
      .eq('estado', 'borrador')
      .single()

    if (errGet || !rifa) {
      return NextResponse.json({ error: 'Rifa no encontrada o ya activada' }, { status: 404 })
    }

    // Activar y generar números
    const { error: errUpdate } = await supabase
      .from('rifas')
      .update({ estado: 'activa', mp_plan_payment_id: 'alias-manual' })
      .eq('id', rifaId)

    if (errUpdate) throw new Error(errUpdate.message)

    await supabase.rpc('generar_numeros_rifa', {
      p_rifa_id: rifaId,
      p_cantidad: rifa.cantidad_numeros,
    })

    return NextResponse.json({ ok: true, slug: rifa.slug })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
