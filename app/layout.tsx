import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fieldnotes — Study Desk',
  description: 'Turn your notes, readings, and class materials into focused study notes and practice questions.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
