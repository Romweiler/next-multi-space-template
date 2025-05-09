"use client"

import { Flex } from '@chakra-ui/react'
import Sidebar from '../components/Sidebar'
import AuthGuard from '../components/AuthGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <Flex width="100%" height="100vh">
        <Sidebar />
        <Flex 
          direction="column" 
          flex="1"
          p={6}
          overflowY="auto"
        >
          {children}
        </Flex>
      </Flex>
    </AuthGuard>
  )
}
