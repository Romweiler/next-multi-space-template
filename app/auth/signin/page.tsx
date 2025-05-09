"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  Link
} from '@chakra-ui/react'
import NextLink from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setLoading(true)
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })
      
      if (result?.error) {
        toast({
          title: 'Erreur d\'authentification',
          description: 'Email ou mot de passe incorrect',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } else {
        // Vérifier si l'utilisateur a des espaces ou a besoin d'onboarding
        try {
          const usersQuery = query(collection(db, 'users'), where('email', '==', email))
          const userSnapshot = await getDocs(usersQuery)
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data()
            
            // Si l'utilisateur n'a pas d'espaces ou a besoin d'onboarding
            if ((userData.spaces?.length === 0 || !userData.spaces) || userData.needsOnboarding) {
              router.push('/onboarding')
              return
            }
          }
          
          // Sinon, rediriger vers le dashboard
          router.push('/dashboard')
        } catch (firebaseError) {
          console.error('Erreur lors de la vérification des espaces:', firebaseError)
          // En cas d'erreur, rediriger vers le dashboard par défaut
          router.push('/dashboard')
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl">MKTFLOW</Heading>
          <Text mt={2} fontSize="lg">Connexion à votre compte</Text>
        </Box>
        
        <Box as="form" onSubmit={handleSignIn}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Mot de passe</FormLabel>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
              />
            </FormControl>
            
            <Button 
              width="full" 
              mt={4} 
              colorScheme="blue" 
              type="submit"
              isLoading={loading}
            >
              Se connecter
            </Button>
          </VStack>
        </Box>
        
        <Text textAlign="center">
          Vous n'avez pas de compte ?{' '}
          <Link as={NextLink} href="/auth/signup" color="blue.500">
            S'inscrire
          </Link>
        </Text>
      </VStack>
    </Container>
  )
}
