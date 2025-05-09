"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
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

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !firstName || !lastName) {
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
      // Créer l'utilisateur avec Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Ne plus utiliser le displayName de Firebase Auth, mais juste stocker dans Firestore
      // On garde updateProfile pour ne pas avoir à modifier d'autres parties du code
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      })
      
      // Créer un document utilisateur dans Firestore avec prénom et nom séparés
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        // On garde displayName pour la compatibilité mais il sera généré à partir de firstName et lastName
        displayName: `${firstName} ${lastName}`,
        createdAt: new Date().toISOString(),
        needsOnboarding: true // Flag pour indiquer que l'utilisateur doit passer par l'onboarding
      })
      
      toast({
        title: 'Compte créé',
        description: 'Votre compte a été créé avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      // Rediriger vers la page de connexion
      // Ajouter un paramètre pour indiquer qu'il s'agit d'un nouvel utilisateur
      router.push('/auth/signin?newUser=true')
    } catch (error: any) {
      let message = 'Une erreur est survenue lors de la création du compte.'
      if (error.code === 'auth/email-already-in-use') {
        message = 'Cet email est déjà utilisé.'
      }
      toast({
        title: 'Erreur',
        description: message,
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
          <Text mt={2} fontSize="lg">Créer un compte</Text>
        </Box>
        
        <Box as="form" onSubmit={handleSignUp}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Prénom</FormLabel>
              <Input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Votre prénom"
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Nom</FormLabel>
              <Input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Votre nom de famille"
              />
            </FormControl>
            
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
              S'inscrire
            </Button>
          </VStack>
        </Box>
        
        <Text textAlign="center">
          Vous avez déjà un compte ?{' '}
          <Link as={NextLink} href="/auth/signin" color="blue.500">
            Se connecter
          </Link>
        </Text>
      </VStack>
    </Container>
  )
}
