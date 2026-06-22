export const metadata = {
  title: 'Política de Privacidad — RifaLocal',
}

export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-sm">
      <h1>Política de Privacidad</h1>
      <p className="text-sm text-gray-500">Versión 1.0 — vigente desde el 1 de julio de 2026</p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        RifaLocal, operado por su titular, con domicilio en Argentina.
        Contacto: privacidad@rifalocal.ar
      </p>

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li><strong>Registro:</strong> nombre, email, contraseña (hash), teléfono.</li>
        <li><strong>Compra de número:</strong> nombre, teléfono, datos de pago (procesados por MercadoPago — no almacenamos datos de tarjeta).</li>
        <li><strong>Uso:</strong> dirección IP, navegador, páginas visitadas (con fines de seguridad y mejora del servicio).</li>
      </ul>

      <h2>3. Finalidad</h2>
      <p>Utilizamos los datos para:</p>
      <ul>
        <li>Operar el servicio de rifas y procesar pagos.</li>
        <li>Notificar resultados de sorteos.</li>
        <li>Enviar comunicaciones del servicio (no publicidad sin consentimiento).</li>
        <li>Cumplir obligaciones legales.</li>
      </ul>

      <h2>4. Compartir datos</h2>
      <p>
        Solo compartimos datos con MercadoPago (procesador de pagos) y Supabase
        (infraestructura). El Organizador recibe únicamente nombre y teléfono del
        ganador de su rifa. No vendemos datos a terceros.
      </p>

      <h2>5. Derechos del usuario</h2>
      <p>
        Podés ejercer derechos de acceso, rectificación, supresión y portabilidad
        escribiendo a privacidad@rifalocal.ar. Respondemos en 10 días hábiles.
        Ley aplicable: Ley 25.326 de Protección de Datos Personales (Argentina).
      </p>

      <h2>6. Seguridad</h2>
      <p>
        Los datos se almacenan en servidores con cifrado en reposo y en tránsito (TLS).
        Las contraseñas se hashean con bcrypt. Los pagos son procesados exclusivamente
        por MercadoPago bajo sus propios estándares PCI-DSS.
      </p>
    </main>
  )
}
