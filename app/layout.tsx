import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kampung Literasi - Registration',
  description: 'Registration system for Kampung Literasi sessions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
