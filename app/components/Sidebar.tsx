"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Spacer,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  useToast
} from '@chakra-ui/react'
import { ChevronDownIcon, AddIcon } from '@chakra-ui/icons'

type Space = {
  id: string
  name: string
  ownerId: string
}

export default function Sidebar() {
  const { data: session } = useSession()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null)
  const [newSpaceName, setNewSpaceName] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // Récupérer les espaces de l'utilisateur sans doublons
  const fetchSpaces = async () => {
    if (!session?.user?.email) return [];
  
    try {
      // On cherche d'abord le document utilisateur correspondant à l'email
      const usersQuery = query(collection(db, 'users'), where('email', '==', session.user.email));
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        console.error("Aucun utilisateur trouvé avec cet email:", session.user.email);
        return [];
      }
      
      // Récupérer l'ID de l'utilisateur
      const userId = userSnapshot.docs[0].id;
      
      // Chercher les espaces où l'utilisateur est propriétaire
      const spacesQuery = query(collection(db, 'spaces'), where('ownerId', '==', userId));
      const spacesSnapshot = await getDocs(spacesQuery);
      
      // Récupérer les données des espaces
      const spacesData = spacesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Space[];
      
      // Éliminer les doublons potentiels en utilisant un Set basé sur l'ID
      const uniqueSpaces = Array.from(
        new Map(spacesData.map(space => [space.id, space]))
      ).map(([_, space]) => space) as Space[];
      
      // Mettre à jour l'état des espaces avec la liste dédupliquée
      setSpaces(uniqueSpaces);
      
      // Récupérer l'ID de l'espace courant depuis localStorage
      const savedSpaceId = localStorage.getItem('currentSpaceId');
      
      if (savedSpaceId && spacesData.some(space => space.id === savedSpaceId)) {
        // Si l'espace courant est dans la liste, l'utiliser
        const currentSpaceData = spacesData.find(space => space.id === savedSpaceId)!;
        setCurrentSpace(currentSpaceData);
      } else if (spacesData.length > 0) {
        // Sinon, utiliser le premier espace de la liste
        setCurrentSpace(spacesData[0]);
        localStorage.setItem('currentSpaceId', spacesData[0].id);
      }

      return spacesData;
    } catch (error) {
      console.error("Erreur lors de la récupération des espaces:", error);
      return [];
    }
  };
  
  // Charger les espaces au démarrage
  useEffect(() => {
    fetchSpaces();
  }, [session]);
  
  // Écouter les changements d'espace et mettre à jour l'interface
  useEffect(() => {
    const handleSpaceChange = async (event: Event) => {
      try {
        const savedSpaceId = localStorage.getItem('currentSpaceId');
        if (!savedSpaceId) return;
        
        // D'abord, vérifier si l'espace est déjà dans la liste chargée
        const spaceInList = spaces.find(s => s.id === savedSpaceId);
        
        if (spaceInList) {
          setCurrentSpace(spaceInList);
        } else {
          // Si l'espace n'est pas dans la liste, le récupérer depuis Firestore
          const spaceDoc = await getDoc(doc(db, 'spaces', savedSpaceId));
          if (spaceDoc.exists()) {
            const spaceData = {
              id: spaceDoc.id,
              ...spaceDoc.data()
            } as Space;
            
            setCurrentSpace(spaceData);
            
            // Ajouter l'espace à la liste seulement s'il n'existe pas déjà
            setSpaces(prev => {
              // Vérifier si l'espace existe déjà dans la liste
              const exists = prev.some(s => s.id === spaceData.id);
              if (exists) return prev; // Retourner la liste inchangée si l'espace existe déjà
              return [...prev, spaceData]; // Sinon, ajouter le nouvel espace
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'espace courant:", error);
      }
    };
    
    // Vérifier et mettre à jour l'espace courant au chargement
    const checkCurrentSpace = async () => {
      const savedSpaceId = localStorage.getItem('currentSpaceId');
      if (!savedSpaceId) return;
      
      // Si l'espace courant n'est pas défini ou ne correspond pas à l'ID sauvegardé
      if (!currentSpace || currentSpace.id !== savedSpaceId) {
        await handleSpaceChange(new Event('init'));
      }
    };
    
    checkCurrentSpace();
    
    // Ajouter un écouteur pour le changement d'espace
    window.addEventListener('spaceChanged', handleSpaceChange);
    
    return () => {
      window.removeEventListener('spaceChanged', handleSpaceChange);
    };
  }, [spaces, currentSpace]);
  
  // Synchroniser avec les changements de page
  useEffect(() => {
    const handlePageLoad = async () => {
      // Mettre à jour les espaces au chargement de la page
      await fetchSpaces();
    };
    
    // Ajouter un écouteur pour le chargement de la page
    window.addEventListener('load', handlePageLoad);
    
    return () => {
      window.removeEventListener('load', handlePageLoad);
    };
  }, []);

  // Changer d'espace
  const handleSpaceChange = (space: Space) => {
    // Mettre à jour l'état local immédiatement
    setCurrentSpace(space);
    
    // Stocker l'ID dans localStorage
    localStorage.setItem('currentSpaceId', space.id);
    
    // Afficher un message de chargement
    toast({
      title: 'Changement d\'espace',
      description: `Chargement de l'espace ${space.name}...`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    
    // Déclencher l'événement de changement d'espace
    const event = new CustomEvent('spaceChanged', { 
      detail: { spaceId: space.id, spaceName: space.name } 
    });
    window.dispatchEvent(event);
    
    // Ajouter un paramètre unique pour forcer le rechargement
    const timestamp = Date.now();
    
    // Rediriger vers le dashboard avec paramètres pour forcer le rechargement
    setTimeout(() => {
      window.location.href = `/dashboard?space=${space.id}&t=${timestamp}`;
    }, 100);
  }

  // Créer un nouvel espace via l'API pour éviter les problèmes de sécurité du client
  const handleCreateSpace = async () => {
    if (!newSpaceName.trim() || !session?.user?.id) {
      console.log("Impossible de créer un espace: données manquantes", { newSpaceName, userId: session?.user?.id });
      return;
    }
    
    try {
      console.log("Tentative de création d'espace via l'API:", { newSpaceName });
      
      // Création d'espace via l'API plutôt que directement avec Firebase
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSpaceName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de l\'espace');
      }
      
      const data = await response.json();
      console.log("Réponse de l'API:", data);
      
      // Ajouter le nouvel espace à la liste locale
      const newSpace = {
        id: data.space.id,
        name: data.space.name,
        ownerId: data.space.ownerId
      };
      
      setSpaces(prevSpaces => [...prevSpaces, newSpace]);
      setCurrentSpace(newSpace);
      localStorage.setItem('currentSpaceId', newSpace.id);
      
      // Réinitialiser le formulaire et fermer la modal
      setNewSpaceName('');
      onClose();
      
      toast({
        title: 'Espace créé',
        description: `L'espace "${newSpaceName}" a été créé avec succès.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      // Rediriger vers le dashboard avec le nouvel espace pour actualiser l'interface
      const timestamp = Date.now();
      window.location.href = `/dashboard?space=${newSpace.id}&t=${timestamp}`;
    } catch (error) {
      console.error("Erreur lors de la création de l'espace:", error)
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de la création de l'espace.",
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Flex 
      direction="column" 
      height="100vh" 
      width="250px" 
      bg="gray.100" 
      p={4} 
      borderRight="1px" 
      borderColor="gray.200"
    >
      {/* En-tête avec le nom de l'application */}
      <Box mb={8}>
        <Text fontSize="2xl" fontWeight="bold" color="blue.600">MKTFLOW</Text>
      </Box>
      
      {/* Contenu principal de la sidebar */}
      <VStack spacing={4} align="stretch" flex="1">
        {/* Ici viendront les éléments de navigation du tableau de bord */}
      </VStack>
      
      {/* Bas de la sidebar avec le sélecteur d'espace */}
      <Box mt={4}>
        <Divider mb={4} />
        <Menu placement="top">
          <MenuButton 
            as={Button} 
            width="full" 
            variant="ghost" 
            rightIcon={<ChevronDownIcon />} 
            textAlign="left"
            justifyContent="space-between"
            className="space-selector-button"
          >
            {currentSpace?.name || 'Sélectionner un espace'}
          </MenuButton>
          <MenuList>
            {/* Filtrer les espaces pour éviter les doublons basés sur l'ID */}
            {Array.from(new Map(spaces.map(space => [space.id, space])).values()).map((space) => (
              <MenuItem 
                key={space.id} 
                onClick={() => handleSpaceChange(space)}
                fontWeight={currentSpace?.id === space.id ? 'bold' : 'normal'}
              >
                {space.name}
              </MenuItem>
            ))}
            <MenuItem icon={<AddIcon />} onClick={onOpen}>
              Créer un nouvel espace
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
      
      {/* Modal pour créer un nouvel espace */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Créer un nouvel espace</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Nom de l'espace"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCreateSpace}
              isDisabled={!newSpaceName.trim()}
            >
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
