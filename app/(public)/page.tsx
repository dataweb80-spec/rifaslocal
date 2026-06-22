import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  const { data: rifas } = await supabase
    .from('rifas')
    .select('id, titulo, imagen_url, precio_numero, cantidad_numeros, slug, estado, tipo')
    .in('estado', ['activa', 'llena'])
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎟</span>
          <span className="text-xl font-bold text-primary">RifaLocal</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/explorar" className="text-sm text-gray-600 hover:text-primary font-medium hidden sm:block">Ver rifas</Link>
          <Link href="/crear" className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark font-semibold">
            + Crear rifa
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative text-white py-20 px-6 overflow-hidden" style={{ minHeight: '520px' }}>
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <img src="/hero.jpg" alt="Hero" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-primary/70" />
        </div>
        <div className="relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            🏆 Sorteo automático con Lotería Nacional
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            La plataforma de rifas<br />más fácil de Argentina
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Creá tu rifa en 5 minutos, compartila por WhatsApp y el sorteo se realiza con el número ganador de la Lotería Nacional.
          </p>
          {/* DOS BOTONES PRINCIPALES */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/crear?tipo=paga" className="bg-accent text-white px-8 py-5 rounded-2xl text-lg font-bold hover:opacity-90 transition shadow-lg">
              🎁 Organizar una rifa paga
              <p className="text-sm font-normal opacity-80 mt-1">Compradores pagan por número</p>
            </Link>
            <Link href="/crear?tipo=comercio" className="bg-white text-primary px-8 py-5 rounded-2xl text-lg font-bold hover:bg-primary-light transition shadow-lg">
              🏪 Sorteo para mi negocio
              <p className="text-sm font-normal opacity-70 mt-1">Vos pagás, tus clientes participan gratis</p>
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/demo" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 px-6 py-3 rounded-xl font-semibold transition text-sm">
              ▶ Ver cómo funciona paso a paso
            </Link>
          </div>
        </div>
        </div>
      </section>

      {/* DOS TIPOS DE RIFA */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Dos tipos de rifa</h2>
        <p className="text-gray-500 text-center mb-12">Elegí el que mejor se adapta a lo que necesitás</p>
        <div className="grid md:grid-cols-2 gap-8">

          {/* RIFA PAGA */}
          <div className="border-2 border-accent/30 rounded-3xl p-8 hover:border-accent transition-colors">
            <div className="text-4xl mb-4">🎁</div>
            <div className="inline-block bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full mb-3">RIFA PAGA</div>
            <h3 className="text-2xl font-bold mb-3">Los compradores financian el premio</h3>
            <p className="text-gray-500 mb-6">
              Ponés un premio (TV, celular, efectivo) y vendés números. Cuando se venden todos, el sorteo es automático con Lotería Nacional. Nosotros cobramos el 10%.
            </p>
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>TV 43&quot; Samsung</strong> — 100 números a $5.000 = $500.000 recaudados. Vos recibís $450.000.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Pollo asado</strong> — 50 números a $1.000 = $50.000. Vos recibís $45.000.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Efectivo $200.000</strong> — 100 números a $3.000 = $300.000. Vos recibís $270.000.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <span className="text-accent font-bold text-lg">10%</span>
              <span>de comisión solo cuando se llena la rifa</span>
            </div>
            <Link href="/crear?tipo=paga" className="block w-full bg-accent text-white text-center py-3 rounded-xl font-bold hover:opacity-90">
              Crear rifa paga →
            </Link>
          </div>

          {/* RIFA COMERCIO */}
          <div className="border-2 border-primary/30 rounded-3xl p-8 hover:border-primary transition-colors">
            <div className="text-4xl mb-4">🏪</div>
            <div className="inline-block bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-3">SORTEO COMERCIO / ENTIDAD</div>
            <h3 className="text-2xl font-bold mb-3">Vos pagás, tus clientes participan gratis</h3>
            <p className="text-gray-500 mb-6">
              Ideal para comercios, escuelas, clubes o entidades. Pagás un plan fijo según la cantidad de números y tus clientes o socios participan sin costo.
            </p>
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <p className="text-xs font-bold text-gray-500 mb-3 uppercase">Planes disponibles</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['50 números', '$20.000'],
                  ['100 números', '$40.000'],
                  ['200 números', '$60.000'],
                  ['400 números', '$80.000'],
                  ['600 números', '$100.000'],
                  ['999 números', '$120.000'],
                ].map(([n, p]) => (
                  <div key={n} className="flex justify-between bg-white rounded-lg px-3 py-2 border">
                    <span className="text-gray-600">{n}</span>
                    <span className="font-bold text-primary">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/crear?tipo=comercio" className="block w-full bg-primary text-white text-center py-3 rounded-xl font-bold hover:bg-primary-dark">
              Crear sorteo →
            </Link>
          </div>

        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-2 gap-12">

            {/* COMPRADOR */}
            <div>
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold">👤</span>
                Para el que compra un número
              </h3>
              <div className="space-y-4">
                {[
                  { icon: '🔢', title: 'Elegís tu número', desc: 'Ves la grilla con todos los números disponibles y elegís el tuyo.' },
                  { icon: '📱', title: 'Ponés tu teléfono', desc: 'Solo necesitás tu número de WhatsApp para recibir la confirmación.' },
                  { icon: '💳', title: 'Pagás con MercadoPago', desc: 'Tarjeta, transferencia o saldo MP. Seguro y en segundos.' },
                  { icon: '✉️', title: 'Recibís confirmación por WhatsApp', desc: 'Te llega el número que elegiste y cuándo se sortea.' },
                  { icon: '🎲', title: 'El sorteo con Lotería Nacional', desc: 'Usamos el primer número de la Lotería Nacional nocturna del día de cierre.' },
                ].map(s => (
                  <div key={s.title} className="flex gap-4 items-start">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sm text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ORGANIZADOR */}
            <div>
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">🏪</span>
                Para el que organiza la rifa
              </h3>
              <div className="space-y-4">
                {[
                  { icon: '📝', title: 'Publicás en 5 minutos', desc: 'Subís foto del premio, precio por número y cantidad. Sin necesitar código.' },
                  { icon: '📲', title: 'Compartís el link o QR', desc: 'Cada rifa tiene su página y QR propios para compartir por WhatsApp, IG o donde quieras.' },
                  { icon: '👀', title: 'Seguís en tiempo real', desc: 'Ves quién compró cada número y cuánto falta para completarse.' },
                  { icon: '🎯', title: 'El sorteo es automático', desc: 'Cuando se venden todos los números y sale la Lotería, el ganador se determina solo.' },
                  { icon: '💰', title: 'Cobrás tu parte al toque', desc: 'El 90% va directo a tu MercadoPago. Nosotros nos quedamos el 10%.' },
                ].map(s => (
                  <div key={s.title} className="flex gap-4 items-start">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sm text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SORTEO CON LOTERÍA */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-4">🎰</div>
          <h2 className="text-3xl font-bold mb-4">Sorteo con Lotería Nacional</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Para garantizar transparencia total, el número ganador se determina con el <strong>primer número de la Lotería Nacional nocturna</strong> del día en que se complete la rifa. Si cae sábado o domingo, se usa el del lunes siguiente.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left max-w-2xl mx-auto">
            {[
              { icon: '✅', title: 'Transparente', desc: 'El resultado es público y verificable por cualquier persona.' },
              { icon: '🔒', title: 'Imposible de manipular', desc: 'Nadie puede predecir el número ganador de lotería.' },
              { icon: '📢', title: 'Se anuncia en pantalla', desc: 'Se publica el ganador con nombre y número en la página de la rifa.' },
            ].map(c => (
              <div key={c.title} className="flex gap-3">
                <span className="text-xl mt-0.5">{c.icon}</span>
                <div>
                  <p className="font-bold text-sm">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RIFAS ACTIVAS */}
      {rifas && rifas.length > 0 && (
        <section className="bg-gray-50 py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Rifas activas ahora</h2>
              <Link href="/explorar" className="text-primary font-semibold hover:underline text-sm">Ver todas →</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rifas.map((rifa: any) => (
                <Link key={rifa.id} href={`/rifa/${rifa.slug}`}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border hover:border-primary cursor-pointer">
                    {rifa.imagen_url ? (
                      <img src={rifa.imagen_url} alt={rifa.titulo} className="w-full h-44 object-cover" />
                    ) : (
                      <div className={`w-full h-44 flex items-center justify-center text-5xl ${rifa.tipo === 'comercio' ? 'bg-primary-light' : 'bg-orange-50'}`}>
                        {rifa.tipo === 'comercio' ? '🏪' : '🎁'}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rifa.tipo === 'comercio' ? 'bg-primary-light text-primary' : 'bg-orange-100 text-orange-700'}`}>
                          {rifa.tipo === 'comercio' ? '🏪 Comercio' : '🎁 Rifa paga'}
                        </span>
                        {rifa.estado === 'llena' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Por sortear</span>}
                      </div>
                      <h3 className="font-bold line-clamp-2 mb-1">{rifa.titulo}</h3>
                      {rifa.tipo === 'paga' && (
                        <p className="text-primary font-bold">${rifa.precio_numero?.toLocaleString('es-AR')} / número</p>
                      )}
                      {rifa.tipo === 'comercio' && (
                        <p className="text-primary font-bold">¡Participación gratuita!</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="bg-primary py-16 px-6 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">¿Listo para hacer tu rifa?</h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto">
          Sin costos fijos. Sin instalaciones. Funciona desde el celular.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/crear?tipo=paga" className="bg-accent text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition text-lg">
            🎁 Crear rifa paga
          </Link>
          <Link href="/crear?tipo=comercio" className="bg-white text-primary px-8 py-4 rounded-2xl font-bold hover:bg-primary-light transition text-lg">
            🏪 Sorteo para mi negocio
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t px-6 py-8 text-center text-sm text-gray-500">
        <div className="flex justify-center gap-6 mb-3 flex-wrap">
          <Link href="/terminos" className="hover:text-primary">Términos y condiciones</Link>
          <Link href="/privacidad" className="hover:text-primary">Privacidad</Link>
          <a href="mailto:hola@rifalocal.ar" className="hover:text-primary">Contacto</a>
        </div>
        <p>© 2026 RifaLocal. Plataforma de intermediación. Los organizadores son responsables de sus rifas.</p>
      </footer>

    </div>
  )
}
