"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Center, Spinner } from '@chakra-ui/react'

type AuthGuardProps = {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false)
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (isLoading || status === 'loading') {
    return (
      <Center height="100vh">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    )
  }

  return <>{children}</>
}
