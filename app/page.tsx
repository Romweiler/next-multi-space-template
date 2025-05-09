"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Box, Spinner, Center } from '@chakra-ui/react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  return (
    <Center height="100vh">
      <Box textAlign="center">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Box>
    </Center>
  )
}
