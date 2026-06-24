import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { rifaId, numeroId } = await req.json()
    if (!rifaId || !numeroId) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

    const { error } = await supabase
      .from('numeros_rifa')
      .update({ estado: 'pagado', pagado_en: new Date().toISOString() })
      .eq('id', numeroId)
      .eq('rifa_id', rifaId)
      .eq('estado', 'reservado')

    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
