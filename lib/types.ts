export type RifaEstado = 'borrador' | 'activa' | 'llena' | 'sorteando' | 'finalizada' | 'cancelada'
export type NumeroEstado = 'disponible' | 'reservado' | 'pagado'

export interface Rifa {
  id: string
  organizador_id: string
  titulo: string
  descripcion: string | null
  imagen_url: string | null
  precio_numero: number
  cantidad_numeros: number
  estado: RifaEstado
  ganador_numero: number | null
  ganador_id: string | null
  fecha_limite: string | null
  slug: string
  comision_plat: number
  created_at: string
}

export interface NumeroRifa {
  id: string
  rifa_id: string
  numero: number
  estado: NumeroEstado
  comprador_nombre: string | null
  comprador_tel: string | null
  pagado_en: string | null
}

export interface Profile {
  id: string
  nombre: string
  email: string
  telefono: string | null
  mp_user_id: string | null
  rol: 'organizador' | 'admin'
}
