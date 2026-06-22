import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'RifaLocal — Rifas online con sorteo automático',
    template: '%s — RifaLocal',
  },
  description: 'Creá tu rifa, compartila y el sorteo es automático al llenarse. Pagos por MercadoPago.',
  keywords: ['rifa', 'sorteo', 'online', 'argentina', 'mercadopago'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
