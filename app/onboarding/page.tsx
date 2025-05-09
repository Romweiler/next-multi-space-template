"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  Container,
  Text,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Card,
  CardBody,
  useToast,
  Image,
  useColorModeValue,
  Flex,
  Progress
} from '@chakra-ui/react';

export default function Onboarding() {
  const [spaceName, setSpaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.700', 'white');

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    
    // Si l'utilisateur a déjà terminé l'onboarding (a des espaces), rediriger vers le dashboard
    if (status === 'authenticated' && session) {
      // Option: vérifier dans Firestore si l'utilisateur a besoin de l'onboarding
      // Pour l'instant, nous acceptons tout utilisateur authentifié
    }
  }, [status, session, router]);

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handleCreateSpace = async () => {
    if (!spaceName.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Veuillez donner un nom à votre espace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // Appel à l'API pour créer l'espace
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: spaceName }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'espace");
      }

      const data = await response.json();

      // Succès
      toast({
        title: 'Espace créé',
        description: 'Votre espace a été créé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Rediriger vers le dashboard avec le nouvel espace
      router.push(`/dashboard?space=${data.space.id}`);
    } catch (error) {
      console.error("Erreur lors de la création de l'espace:", error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de la création de l'espace",
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (status === 'loading') {
    return (
      <Container maxW="container.md" py={10}>
        <Flex justifyContent="center" alignItems="center" height="80vh">
          <Progress size="xs" isIndeterminate width="100%" />
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={10}>
      <Card borderRadius="lg" overflow="hidden" boxShadow="xl">
        <CardBody>
          <VStack spacing={8} align="stretch" p={4}>
            <Box textAlign="center">
              <Heading size="xl" mb={2}>Bienvenue sur MKTFLOW</Heading>
              <Text fontSize="lg" color={textColor}>
                {step === 1 
                  ? 'Comprendre les espaces de travail' 
                  : 'Créez votre premier espace de travail'}
              </Text>
            </Box>

            {step === 1 ? (
              <>
                <Box bg={bgColor} p={6} borderRadius="md">
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Qu'est-ce qu'un espace de travail ?</Heading>
                    <Text>
                      Dans MKTFLOW, les espaces de travail sont des environnements dédiés où vous pouvez organiser vos projets et collaborer avec votre équipe.
                    </Text>
                    <Text>
                      Chaque espace peut contenir ses propres projets, membres et paramètres. Vous pouvez créer autant d'espaces que nécessaire pour différents clients, équipes ou projets.
                    </Text>
                    <Text fontWeight="bold">
                      Pour commencer, vous allez créer votre premier espace de travail.
                    </Text>
                  </VStack>
                </Box>
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={handleNextStep}
                >
                  Continuer
                </Button>
              </>
            ) : (
              <>
                <Box bg={bgColor} p={6} borderRadius="md">
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Créez votre premier espace</Heading>
                    <Text>
                      Donnez un nom à votre espace de travail. Vous pourrez le modifier ultérieurement si nécessaire.
                    </Text>
                    <FormControl isRequired>
                      <FormLabel>Nom de l'espace</FormLabel>
                      <Input 
                        placeholder="Ex: Mon agence, Projet client..."
                        value={spaceName}
                        onChange={(e) => setSpaceName(e.target.value)}
                        bg="white"
                        size="lg"
                      />
                    </FormControl>
                  </VStack>
                </Box>
                <Button 
                  colorScheme="blue" 
                  size="lg" 
                  onClick={handleCreateSpace}
                  isLoading={loading}
                >
                  Créer mon espace
                </Button>
              </>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
}
