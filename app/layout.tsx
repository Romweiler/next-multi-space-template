import { ChakraProvider } from '@chakra-ui/react'
import { Inter } from 'next/font/google'
import { AuthProvider } from './providers/auth-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MKTFLOW',
  description: 'Une application efficace avec l\'écosystème Google',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <ChakraProvider>
            {children}
          </ChakraProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
