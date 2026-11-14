import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Studywise — Your AI Study Partner',
  description: 'Turn class notes, PDFs, and documents into clear study guides and custom practice quizzes with AI.',
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
