import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import OfflineProvider from '@/components/OfflineProvider'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import './globals.css'

export const metadata: Metadata = {
  title: 'CascadeVision - Ocean Hazard Platform',
  description: 'A comprehensive platform for monitoring and managing ocean hazards',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CascadeVision',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <OfflineProvider>
          {children}
        </OfflineProvider>
        <PWAInstallPrompt />
        <Analytics />
      </body>
    </html>
  )
}
