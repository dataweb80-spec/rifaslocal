import { createClient } from '@/lib/supabase/server'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminRifasPage() {
  const supabase = await createClient()

  // Traer todas las rifas en borrador con comprobante subido, ordenadas por fecha
  const { data: pendientes } = await supabase
    .from('rifas')
    .select('id, titulo, nombre_comercio, logo_url, slug, plan_numeros:cantidad_numeros, precio_plan, tel_organizador, comprobante_pago_url, created_at')
    .eq('estado', 'borrador')
    .not('comprobante_pago_url', 'is', null)
    .order('created_at', { ascending: false })

  // Rifas activadas recientemente (últimas 10)
  const { data: activadas } = await supabase
    .from('rifas')
    .select('id, titulo, nombre_comercio, slug, cantidad_numeros, precio_plan, created_at')
    .eq('tipo', 'comercio')
    .eq('estado', 'activa')
    .order('created_at', { ascending: false })
    .limit(10)

  return <AdminPanel pendientes={pendientes ?? []} activadas={activadas ?? []} />
}
