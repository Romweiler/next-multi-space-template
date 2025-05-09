"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { 
  Box, 
  Text,
  Container,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Heading,
  Flex
} from '@chakra-ui/react'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import DashboardHeader from '../components/DashboardHeader'

export default function Dashboard() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const spaceParam = searchParams.get('space')
  const [currentSpace, setCurrentSpace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) {
        setLoading(false)
        return
      }
      
      try {
        // Vérifier si l'utilisateur a des espaces
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', session.user.email)
        )
        
        const userSnapshot = await getDocs(usersQuery)
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data()
          
          // Vérifier si l'utilisateur a besoin d'onboarding
          if ((userData.spaces?.length === 0 || !userData.spaces) || userData.needsOnboarding) {
            // Rediriger vers la page d'onboarding
            window.location.href = '/onboarding'
            return
          }
          
          // Déterminer l'ID de l'espace à afficher
          // Priorité au paramètre d'URL, puis localStorage, puis premier espace de l'utilisateur
          let spaceId = spaceParam || localStorage.getItem('currentSpaceId') || userData.spaces[0]
          
          // Si un espace est spécifié dans l'URL, le mémoriser pour les prochaines visites
          if (spaceParam) {
            localStorage.setItem('currentSpaceId', spaceParam)
          }
          
          if (spaceId) {
            const spaceDoc = await getDoc(doc(db, 'spaces', spaceId))
            
            if (spaceDoc.exists()) {
              setCurrentSpace({
                id: spaceDoc.id,
                ...spaceDoc.data()
              })
            } else if (userData.spaces.length > 0) {
              // Si l'espace demandé n'existe pas, utiliser le premier espace disponible
              const fallbackSpaceDoc = await getDoc(doc(db, 'spaces', userData.spaces[0]))
              
              if (fallbackSpaceDoc.exists()) {
                setCurrentSpace({
                  id: fallbackSpaceDoc.id,
                  ...fallbackSpaceDoc.data()
                })
                // Mettre à jour l'espace courant dans le localStorage
                localStorage.setItem('currentSpaceId', fallbackSpaceDoc.id)
              }
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [session])
  
  if (loading) {
    return <Box p={8}>Chargement...</Box>
  }
  
  return (
    <Flex direction="column" width="100%">
      <DashboardHeader title="Tableau de bord" />
      
      <Container maxW="container.xl">
        <Box mb={8}>
          <Text color="gray.600" fontSize="lg">
            Bienvenue {session?.user?.name || 'utilisateur'} dans votre espace {currentSpace?.name || 'principal'}
          </Text>
        </Box>
        


        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <Stack>
                <Heading size="md">Activité récente</Heading>
                <Text>
                  Aucune activité récente à afficher pour le moment.
                </Text>
              </Stack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stack>
                <Heading size="md">Membres de l'espace</Heading>
                <Text>
                  {currentSpace?.members?.length || 1} membre(s) dans cet espace.
                </Text>
              </Stack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stack>
                <Heading size="md">Démarrage rapide</Heading>
                <Text>
                  Personnalisez votre espace ou invitez des collaborateurs en utilisant le menu de gestion.
                </Text>
              </Stack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Container>
    </Flex>
  )
}
