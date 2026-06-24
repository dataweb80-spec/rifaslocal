import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { rifaId, comprobante_url } = await req.json()
    if (!rifaId || !comprobante_url) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

    const { error } = await supabase
      .from('rifas')
      .update({ comprobante_pago_url: comprobante_url })
      .eq('id', rifaId)
      .eq('estado', 'borrador')

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
