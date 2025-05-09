"use client"

import { Box, Flex, Heading, Button, Avatar, Menu, MenuButton, MenuList, MenuItem, Text } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SettingsModal from './SettingsModal'

interface DashboardHeaderProps {
  title: string
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  return (
    <Flex
      as="header"
      width="100%"
      py={4}
      px={6}
      alignItems="center"
      justifyContent="space-between"
      borderBottom="1px"
      borderColor="gray.200"
      mb={6}
    >
      <Heading size="md">{title}</Heading>

      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          variant="ghost"
        >
          <Flex alignItems="center">
            <Avatar size="sm" name={session?.user?.name || ''} mr={2} />
            <Text className="user-display-name">{session?.user?.name || 'Utilisateur'}</Text>
          </Flex>
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => setIsSettingsOpen(true)}>Paramètres</MenuItem>
          <MenuItem onClick={handleSignOut}>Déconnexion</MenuItem>
        </MenuList>
      </Menu>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </Flex>
  )
}
