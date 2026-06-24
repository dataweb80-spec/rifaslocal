import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PanelOrganizador from '@/components/PanelOrganizador'

interface Props {
  params: Promise<{ rifaId: string }>
}

export default async function GestionarPage({ params }: Props) {
  const { rifaId } = await params
  const supabase = await createClient()

  const { data: rifa } = await supabase
    .from('rifas')
    .select('id, titulo, nombre_comercio, logo_url, slug, tipo, precio_numero, cantidad_numeros, estado')
    .eq('id', rifaId)
    .single()

  if (!rifa) notFound()

  const { data: numeros } = await supabase
    .from('numeros_rifa')
    .select('id, numero, estado, comprador_nombre, comprador_tel, reservado_en, pagado_en')
    .eq('rifa_id', rifaId)
    .order('numero')

  return (
    <PanelOrganizador
      rifa={rifa}
      numeros={numeros ?? []}
    />
  )
}
