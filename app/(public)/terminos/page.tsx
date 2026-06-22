export const metadata = {
  title: 'Términos y Condiciones — RifaLocal',
  description: 'Términos y condiciones de uso de la plataforma RifaLocal',
}

export default function TerminosPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-sm">
      <h1>Términos y Condiciones de Uso</h1>
      <p className="text-sm text-gray-500">Versión 1.0 — vigente desde el 1 de julio de 2026</p>

      <h2>1. Sobre la plataforma</h2>
      <p>
        RifaLocal (en adelante "la Plataforma") es un servicio de intermediación tecnológica
        que permite a usuarios ("Organizadores") publicar y gestionar rifas de premios físicos
        o digitales, y a compradores ("Participantes") adquirir números para participar en
        dichos sorteos. La Plataforma actúa exclusivamente como intermediario tecnológico y
        no es parte del contrato entre Organizador y Participante.
      </p>

      <h2>2. Naturaleza jurídica de las rifas</h2>
      <p>
        Las rifas publicadas en la Plataforma son acuerdos privados entre el Organizador y
        los Participantes. El Organizador declara bajo su exclusiva responsabilidad que:
      </p>
      <ul>
        <li>El premio ofrecido existe, le pertenece y puede ser entregado.</li>
        <li>La rifa no contraviene la normativa vigente en su jurisdicción.</li>
        <li>Cuenta con los permisos necesarios si el monto total supera los límites
            establecidos por la legislación local de juegos de azar.</li>
      </ul>
      <p>
        <strong>RifaLocal no autoriza ni homologa las rifas publicadas.</strong> La
        responsabilidad legal recae exclusivamente sobre el Organizador.
      </p>

      <h2>3. Comisión de la Plataforma</h2>
      <p>
        La Plataforma retiene automáticamente el <strong>10% (diez por ciento)</strong> del
        monto total recaudado por cada rifa como contraprestación por los servicios de
        publicación, gestión de pagos, sorteo automatizado y soporte. Dicha comisión es
        descontada en el momento del procesamiento del pago mediante el sistema de split de
        MercadoPago. El 90% restante es transferido al Organizador.
      </p>

      <h2>4. Obligaciones del Organizador</h2>
      <ul>
        <li>Publicar información veraz sobre el premio (fotos reales, descripción exacta).</li>
        <li>Entregar el premio al ganador dentro de los 15 días corridos posteriores al sorteo.</li>
        <li>Vincular su cuenta de MercadoPago para recibir pagos.</li>
        <li>Mantener actualizado su número de contacto para coordinación con el ganador.</li>
        <li>No cancelar una rifa con números ya vendidos sin reembolsar a los Participantes.</li>
      </ul>

      <h2>5. Obligaciones de los Participantes</h2>
      <ul>
        <li>Proporcionar datos de contacto verídicos al comprar un número.</li>
        <li>Aceptar que el resultado del sorteo es definitivo e inapelable.</li>
        <li>Reclamar el premio dentro de los 30 días posteriores a la notificación.</li>
      </ul>

      <h2>6. Proceso de sorteo</h2>
      <p>
        El sorteo se realiza automáticamente cuando todos los números de la rifa han sido
        adquiridos y los pagos confirmados. El sistema utiliza un generador de números
        pseudoaleatorio seguro. El resultado es registrado con marca de tiempo en la base de
        datos y es visible públicamente para todos los participantes.
      </p>

      <h2>7. Cancelaciones y reembolsos</h2>
      <p>
        Si una rifa es cancelada por el Organizador antes de completarse, los Participantes
        recibirán reintegro total del monto pagado. La comisión de la Plataforma no es
        reembolsable en rifas que hayan tenido al menos un pago procesado.
        Los reembolsos están sujetos a los tiempos de MercadoPago (hasta 10 días hábiles).
      </p>

      <h2>8. Prohibiciones</h2>
      <p>Está estrictamente prohibido utilizar la Plataforma para:</p>
      <ul>
        <li>Rifas de premios ilegales, armas, sustancias controladas o cualquier bien cuya
            comercialización esté prohibida.</li>
        <li>Fraude, estafa o cualquier actividad que perjudique a los Participantes.</li>
        <li>Publicar premios inexistentes o con descripción falsa.</li>
        <li>Uso de cuentas falsas o múltiples cuentas de un mismo titular.</li>
      </ul>
      <p>
        La violación de estas normas resultará en la suspensión inmediata de la cuenta y la
        posibilidad de acciones legales.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        RifaLocal no garantiza la entrega del premio por parte del Organizador. En caso de
        incumplimiento, la Plataforma proveerá los datos de contacto del Organizador al
        Participante afectado para que ejerza las acciones legales que correspondan. La
        responsabilidad máxima de la Plataforma se limita al valor de la comisión cobrada.
      </p>

      <h2>10. Privacidad de datos</h2>
      <p>
        Los datos personales recopilados (nombre, email, teléfono) son utilizados
        exclusivamente para la operación del servicio y notificación de resultados. No son
        cedidos a terceros salvo requerimiento judicial. El Organizador accede únicamente
        a los datos de contacto del ganador de su rifa.
      </p>

      <h2>11. Modificaciones</h2>
      <p>
        RifaLocal se reserva el derecho de modificar estos términos con previo aviso de
        15 días mediante notificación por email. El uso continuado de la Plataforma implica
        aceptación de los nuevos términos.
      </p>

      <h2>12. Jurisdicción</h2>
      <p>
        Ante cualquier controversia, las partes se someten a la jurisdicción de los
        Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires, Argentina, renunciando
        a cualquier otro fuero que pudiera corresponderles.
      </p>

      <p className="text-sm text-gray-500 mt-8">
        Consultas: legal@rifalocal.ar
      </p>
    </main>
  )
}
