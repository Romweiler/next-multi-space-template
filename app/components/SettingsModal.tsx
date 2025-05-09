"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, deleteDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  Text,
  Heading,
  Divider,
  useColorMode,
  Switch,
  Select,
  Input,
  Avatar,
  FormControl,
  FormLabel,
  FormHelperText,
  Badge,
  Card,
  CardBody,
  Icon,
  Tooltip,
  useToast,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon, InfoIcon, WarningIcon } from "@chakra-ui/icons";

// Types pour les espaces
interface Space {
  id: string;
  name: string;
  createdAt: any;
  ownerId: string;
  members: string[];
  settings?: {
    defaultView?: string;
    notifications?: boolean;
    color?: string;
  };
}

const SECTIONS = [
  { label: "Général", key: "general", icon: InfoIcon },
  { label: "Profil", key: "profile", icon: InfoIcon },
  { label: "Espaces", key: "spaces", icon: InfoIcon },
];

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session } = useSession();
  const [section, setSection] = useState("general");
  const { colorMode, setColorMode } = useColorMode();
  const toast = useToast();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  
  // États pour les données utilisateur
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // États pour les espaces
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  
  // Paramètres généraux
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("fr");
  const [autoSave, setAutoSave] = useState(true);
  
  // Référence pour le dialog de confirmation
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // Variable pour stocker l'ID de l'utilisateur
  const [userId, setUserId] = useState<string>("");
  
  // Charger les données utilisateur depuis Firebase
  useEffect(() => {
    if (session?.user?.email && isOpen) {
      setLoading(true);
      console.log("Chargement des données utilisateur...");
      
      // Récupérer les informations utilisateur
      const fetchUserData = async () => {
        try {
          // Chercher l'utilisateur par email (source unique de vérité)
          const usersQuery = query(collection(db, 'users'), where('email', '==', session.user.email));
          const userSnapshot = await getDocs(usersQuery);
          
          if (!userSnapshot.empty) {
            // Utiliser le premier document trouvé qui correspond à l'email
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            const userDocId = userDoc.id; // Récupérer l'ID de l'utilisateur
            console.log("Données utilisateur trouvées:", userData);
            console.log("ID utilisateur:", userDocId);
            
            // Stocker l'ID de l'utilisateur
            setUserId(userDocId);
            
            // Récupérer le prénom et le nom séparément depuis les données utilisateur
            setFirstName(userData.firstName || '');
            setLastName(userData.lastName || '');
            setEmail(userData.email || session.user.email || '');
            
            // Récupérer les préférences utilisateur si elles existent
            if (userData.preferences) {
              setNotificationsEnabled(userData.preferences.notifications || true);
              setLanguage(userData.preferences.language || 'fr');
              setAutoSave(userData.preferences.autoSave || true);
            }
            
            // Récupérer les espaces de l'utilisateur
            try {
              // Utiliser les espaces stockés dans le document utilisateur
              if (userData.spaces && Array.isArray(userData.spaces)) {
                // Récupérer les données de chaque espace
                const spacesPromises = userData.spaces.map(spaceId => 
                  getDoc(doc(db, 'spaces', spaceId))
                );
                
                const spacesSnapshots = await Promise.all(spacesPromises);
                const spacesData = spacesSnapshots
                  .filter(snapshot => snapshot.exists())
                  .map(snapshot => ({
                    id: snapshot.id,
                    ...snapshot.data()
                  })) as Space[];
                
                console.log("Espaces récupérés:", spacesData);
                setSpaces(spacesData);
                
                // Définir l'espace courant
                const currentSpaceId = localStorage.getItem('currentSpaceId');
                if (currentSpaceId && spacesData.length > 0) {
                  const space = spacesData.find(s => s.id === currentSpaceId);
                  if (space) {
                    setCurrentSpace(space);
                  } else {
                    setCurrentSpace(spacesData[0]);
                  }
                } else if (spacesData.length > 0) {
                  setCurrentSpace(spacesData[0]);
                }
              } else {
                console.log("Aucun espace trouvé pour l'utilisateur");
                setSpaces([]);
              }
            } catch (spaceError) {
              console.error("Erreur lors de la récupération des espaces:", spaceError);
              setSpaces([]);
            }
          } else {
            console.log("Aucun utilisateur trouvé avec l'email:", session.user.email);
            // Initialiser avec des valeurs vides
            setEmail(session.user.email || '');
            setSpaces([]);
          }
          
        } catch (error) {
          console.error('Erreur lors du chargement des données utilisateur:', error);
          toast({
            title: 'Erreur',
            description: 'Impossible de charger vos informations',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [session?.user?.email, isOpen, toast]);
  
  // Sauvegarder les modifications du profil
  const saveProfileChanges = async () => {
    if (!session?.user?.email) return;
    
    try {
      setSaving(true);
      
      // Trouver l'utilisateur réel par email
      const usersQuery = query(collection(db, 'users'), where('email', '==', session.user.email));
      const userSnapshot = await getDocs(usersQuery);
      
      if (!userSnapshot.empty) {
        // Récupérer l'ID du document utilisateur existant
        const userId = userSnapshot.docs[0].id;
        console.log("Mise à jour de l'utilisateur avec ID:", userId);
        
        // Générer le nom complet
        const fullName = `${firstName} ${lastName}`;
        
        // Mettre à jour le document utilisateur dans Firestore
        await updateDoc(doc(db, 'users', userId), {
          firstName: firstName,
          lastName: lastName,
          displayName: fullName // On garde displayName pour la compatibilité
        });
        
        // Mettre à jour également Firebase Auth si l'utilisateur est connecté
        if (auth.currentUser) {
          try {
            await updateProfile(auth.currentUser, { displayName: fullName });
          } catch (authError) {
            console.error("Erreur lors de la mise à jour du profil Auth:", authError);
            // Continuer même en cas d'erreur avec Auth - Firestore est la source de vérité
          }
        }
          
        // Informer l'utilisateur que les changements ont été enregistrés
        toast({
          title: 'Succès',
          description: 'Vos informations ont été mises à jour.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Forcer une déconnexion/reconnexion pour actualiser les données de session
        toast({
          title: 'Mise à jour en cours',
          description: 'Actualisation pour appliquer les changements...',
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
        
        // Fermer la modale
        onClose();
        
        // Rediriger vers le tableau de bord après un bref délai
        setTimeout(() => {
          // Forcer une réactualisation complète de la page pour mettre à jour la session
          window.location.href = '/dashboard?refresh=true';
        }, 1000);
      } else {
        // Aucun utilisateur trouvé avec cet email
        console.error("Aucun utilisateur correspondant trouvé dans Firestore");
        toast({
          title: 'Erreur',
          description: 'Impossible de trouver votre profil utilisateur.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Mettre à jour l'email si modifié
      if (email !== session.user.email && auth.currentUser) {
        await updateEmail(auth.currentUser, email);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour vos informations',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Mettre à jour les préférences utilisateur
  const savePreferences = async () => {
    if (!session?.user?.email) return;
    
    try {
      setSaving(true);
      
      // Trouver l'utilisateur réel par email
      const usersQuery = query(collection(db, 'users'), where('email', '==', session.user.email));
      const userSnapshot = await getDocs(usersQuery);
      
      if (!userSnapshot.empty) {
        // Récupérer l'ID du document utilisateur existant
        const userId = userSnapshot.docs[0].id;
        
        // Mettre à jour les préférences utilisateur
        await updateDoc(doc(db, 'users', userId), {
          'preferences.notifications': notificationsEnabled,
          'preferences.language': language,
          'preferences.autoSave': autoSave,
        });
        
        toast({
          title: 'Succès',
          description: 'Vos préférences ont été mises à jour',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour vos préférences',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Changer le mot de passe
  const changePassword = async () => {
    if (!auth.currentUser || !currentPassword || !newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Réauthentifier l'utilisateur avant de changer le mot de passe
      const credential = EmailAuthProvider.credential(auth.currentUser.email || '', currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Changer le mot de passe
      await updatePassword(auth.currentUser, newPassword);
      
      toast({
        title: 'Succès',
        description: 'Votre mot de passe a été mis à jour',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de changer votre mot de passe. Vérifiez votre mot de passe actuel.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Créer un nouvel espace
  const createNewSpace = async () => {
    if (!session?.user?.email || !newSpaceName.trim()) return;
    
    try {
      setSaving(true);
      
      // Utiliser l'API pour créer l'espace plutôt que d'accéder directement à Firestore
      // Cela garantit une cohérence avec la création d'espace depuis la sidebar
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSpaceName.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de l\'espace');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Succès',
        description: 'Nouvel espace créé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Réinitialiser le champ
      setNewSpaceName('');
      
      // Fermer la modale
      onClose();
      
      // Rediriger vers le dashboard avec le nouvel espace pour actualiser l'interface
      const timestamp = Date.now();
      window.location.href = `/dashboard?space=${data.space.id}&t=${timestamp}`;
      
    } catch (error) {
      console.error('Erreur lors de la création de l\'espace:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer un nouvel espace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Supprimer un espace
  const deleteSpace = async () => {
    if (!spaceToDelete || !session?.user?.email) return;
    
    // Trouver l'ID utilisateur
    const usersQuery = query(collection(db, 'users'), where('email', '==', session.user.email));
    const userSnapshot = await getDocs(usersQuery);
    
    let userId = 'default_user_id';
    if (!userSnapshot.empty) {
      userId = userSnapshot.docs[0].id;
    }
    
    try {
      setSaving(true);
      
      // Vérifier que l'utilisateur est bien le propriétaire de l'espace
      if (spaceToDelete.ownerId !== userId) {
        toast({
          title: 'Erreur',
          description: 'Vous n\'êtes pas autorisé à supprimer cet espace',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Supprimer l'espace
      await deleteDoc(doc(db, 'spaces', spaceToDelete.id));
      
      // Mettre à jour la liste des espaces de l'utilisateur
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        spaces: arrayRemove(spaceToDelete.id)
      });
      
      toast({
        title: 'Succès',
        description: 'L\'espace a été supprimé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Mettre à jour la liste des espaces
      setSpaces(spaces.filter(s => s.id !== spaceToDelete.id));
      
      // Si l'espace supprimé était l'espace courant, définir un autre espace comme courant
      if (currentSpace?.id === spaceToDelete.id) {
        if (spaces.length > 1) {
          const newCurrentSpace = spaces.find(s => s.id !== spaceToDelete.id);
          if (newCurrentSpace) {
            setCurrentSpace(newCurrentSpace);
            localStorage.setItem('currentSpaceId', newCurrentSpace.id);
          }
        } else {
          setCurrentSpace(null);
          localStorage.removeItem('currentSpaceId');
        }
      }
      
      // Réinitialiser l'état
      setSpaceToDelete(null);
      onAlertClose();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'espace:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'espace',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backgroundColor="rgba(0, 0, 0, 0.75)" />
        <ModalContent 
          borderRadius="md" 
          w="900px" 
          h="600px" 
          maxW="90vw" 
          maxH="85vh" 
          overflow="hidden"
        >
          <Flex direction="row" h="100%">
            {/* Sidebar */}
            <Box bg="gray.900" color="white" w="240px" py={6} px={4}>
              <Text fontSize="lg" fontWeight="bold" mb={6} px={2} color="blue.300">
                Paramètres
              </Text>
              <VStack align="stretch" spacing={2}>
                {SECTIONS.map((s) => (
                  <Button
                    key={s.key}
                    variant={section === s.key ? "solid" : "ghost"}
                    colorScheme={section === s.key ? "blue" : undefined}
                    justifyContent="flex-start"
                    leftIcon={<Icon as={s.icon} />}
                    onClick={() => setSection(s.key)}
                    borderRadius="md"
                    size="md"
                    w="full"
                  >
                    {s.label}
                  </Button>
                ))}
              </VStack>
            </Box>

            {/* Content */}
            <Box flex={1} bg="white" p={0} position="relative" overflowY="auto" css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                width: '10px',
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c5c5c5',
                borderRadius: '24px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#a8a8a8',
              },
            }}>
              <ModalCloseButton color="gray.600" top={4} right={4} zIndex={2} />

              {loading ? (
                <Flex justify="center" align="center" h="100%" minH="400px">
                  <Spinner size="xl" color="blue.500" thickness="4px" />
                </Flex>
              ) : (
                <Box p={8}>
                  {/* Section Générale */}
                  {section === "general" && (
                    <Box>
                      <Heading size="lg" mb={6}>
                        Paramètres généraux
                      </Heading>

                      <Card mb={5} variant="outline">
                        <CardBody>
                          <Heading size="md" mb={4}>
                            Apparence
                          </Heading>
                          <FormControl mb={4}>
                            <FormLabel fontWeight="medium">Thème</FormLabel>
                            <Select
                              value={colorMode}
                              onChange={(e) => setColorMode(e.target.value as "light" | "dark")}
                              maxW="sm"
                            >
                              <option value="light">Clair</option>
                              <option value="dark">Sombre</option>
                              <option value="system">Système</option>
                            </Select>
                            <FormHelperText>Définit l'apparence générale de l'application</FormHelperText>
                          </FormControl>
                        </CardBody>
                      </Card>

                      <Card mb={5} variant="outline">
                        <CardBody>
                          <Heading size="md" mb={4}>
                            Notifications
                          </Heading>
                          <FormControl display="flex" alignItems="center" mb={3}>
                            <FormLabel htmlFor="notifications" mb="0" flex="1">
                              Activer les notifications
                            </FormLabel>
                            <Switch 
                              id="notifications" 
                              isChecked={notificationsEnabled}
                              onChange={(e) => setNotificationsEnabled(e.target.checked)}
                            />
                          </FormControl>
                          <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="autoSave" mb="0" flex="1">
                              Sauvegarde automatique
                            </FormLabel>
                            <Switch 
                              id="autoSave" 
                              isChecked={autoSave}
                              onChange={(e) => setAutoSave(e.target.checked)}
                            />
                          </FormControl>
                        </CardBody>
                      </Card>

                      <Card variant="outline">
                        <CardBody>
                          <Heading size="md" mb={4}>
                            Langue
                          </Heading>
                          <FormControl mb={4}>
                            <FormLabel fontWeight="medium">Langue de l'interface</FormLabel>
                            <Select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                              maxW="sm"
                            >
                              <option value="fr">Français</option>
                              <option value="en">English</option>
                            </Select>
                          </FormControl>
                        </CardBody>
                      </Card>

                      <Button
                        mt={6}
                        colorScheme="blue"
                        onClick={saveProfileChanges}
                        isLoading={saving}
                      >
                        Enregistrer les modifications
                      </Button>
                    </Box>
                  )}

                  {/* Section Profil */}
                  {section === "profile" && (
                    <Box>
                      <Heading size="lg" mb={6}>
                        Profil utilisateur
                      </Heading>

                      <Card mb={6} variant="outline">
                        <CardBody>
                          <Flex align="center" mb={6}>
                            <Avatar 
                              name={`${firstName} ${lastName}`} 
                              size="xl" 
                              mr={6} 
                              bg="blue.500"
                            />
                            <Box>
                              <Text fontSize="2xl" fontWeight="bold">{`${firstName} ${lastName}`}</Text>
                              <Text fontSize="md" color="gray.500">{email}</Text>
                              <Badge mt={2} colorScheme="green">Compte actif</Badge>
                            </Box>
                          </Flex>

                          <Divider my={4} />

                          <FormControl mb={4}>
                            <FormLabel>Prénom</FormLabel>
                            <Input 
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Votre prénom"
                            />
                          </FormControl>
                          
                          <FormControl mb={4}>
                            <FormLabel>Nom</FormLabel>
                            <Input 
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Votre nom de famille"
                            />
                          </FormControl>

                          <FormControl mb={4}>
                            <FormLabel fontWeight="medium">Adresse email</FormLabel>
                            <Input 
                              value={email} 
                              onChange={e => setEmail(e.target.value)}
                              placeholder="votre@email.com" 
                            />
                          </FormControl>

                          <Button
                            colorScheme="blue"
                            onClick={saveProfileChanges}
                            isLoading={saving}
                            mb={4}
                          >
                            Enregistrer les modifications
                          </Button>
                        </CardBody>
                      </Card>

                      <Card variant="outline">
                        <CardBody>
                          <Heading size="md" mb={4}>
                            Sécurité
                          </Heading>

                          <FormControl mb={4}>
                            <FormLabel fontWeight="medium">Mot de passe actuel</FormLabel>
                            <Input 
                              type="password" 
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              placeholder="Entrez votre mot de passe actuel"
                            />
                          </FormControl>

                          <FormControl mb={4}>
                            <FormLabel fontWeight="medium">Nouveau mot de passe</FormLabel>
                            <Input 
                              type="password" 
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Entrez votre nouveau mot de passe"
                            />
                          </FormControl>

                          <FormControl mb={4}>
                            <FormLabel fontWeight="medium">Confirmer le mot de passe</FormLabel>
                            <Input 
                              type="password" 
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Confirmez votre nouveau mot de passe"
                            />
                          </FormControl>

                          <Button
                            colorScheme="blue"
                            onClick={changePassword}
                            isLoading={saving}
                          >
                            Mettre à jour le mot de passe
                          </Button>
                        </CardBody>
                      </Card>
                    </Box>
                  )}

                  {/* Section Espaces */}
                  {section === "spaces" && (
                    <Box>
                      <Heading size="lg" mb={6}>
                        Gestion des espaces
                      </Heading>

                      <Card mb={6} variant="outline">
                        <CardBody>
                          <Heading size="md" mb={4}>
                            Espaces disponibles
                          </Heading>

                          {spaces.length === 0 ? (
                            <Text color="gray.500">Vous n'avez pas encore d'espace.</Text>
                          ) : (
                            <VStack align="stretch" spacing={3} mb={4}>
                              {spaces.map(space => (
                                <Flex 
                                  key={space.id} 
                                  p={3} 
                                  borderWidth="1px" 
                                  borderRadius="md"
                                  borderColor={currentSpace?.id === space.id ? "blue.500" : "gray.200"}
                                  bg={currentSpace?.id === space.id ? "blue.50" : "white"}
                                  align="center"
                                  justify="space-between"
                                >
                                  <Box>
                                    <Text fontWeight="medium">{space.name}</Text>
                                    <HStack spacing={2} mt={1}>
                                      <Badge colorScheme="blue">{space.members?.length || 1} membre(s)</Badge>
                                      {space.ownerId === userId && (
                                        <Badge colorScheme="green">Propriétaire</Badge>
                                      )}
                                    </HStack>
                                  </Box>
                                  <HStack>
                                    {currentSpace?.id !== space.id && (
                                      <Button 
                                        size="sm" 
                                        colorScheme="blue" 
                                        variant="outline"
                                        onClick={() => {
                                          // Mettre à jour l'espace courant
                                          setCurrentSpace(space);
                                          localStorage.setItem('currentSpaceId', space.id);
                                          
                                          // Fermer la modale
                                          onClose();
                                          
                                          // Rediriger vers le dashboard avec le nouvel espace pour actualiser l'interface
                                          const timestamp = Date.now();
                                          window.location.href = `/dashboard?space=${space.id}&t=${timestamp}`;
                                        }}
                                      >
                                        Sélectionner
                                      </Button>
                                    )}
                                    {space.ownerId === userId && (
                                      <Button 
                                        size="sm" 
                                        colorScheme="red" 
                                        variant="ghost"
                                        onClick={() => {
                                          setSpaceToDelete(space);
                                          onAlertOpen();
                                        }}
                                      >
                                        <Icon as={CloseIcon} />
                                      </Button>
                                    )}
                                  </HStack>
                                </Flex>
                              ))}
                            </VStack>
                          )}

                          <Divider my={4} />

                          <Heading size="sm" mb={3}>
                            Créer un nouvel espace
                          </Heading>

                          <HStack>
                            <Input 
                              placeholder="Nom de l'espace" 
                              value={newSpaceName}
                              onChange={e => setNewSpaceName(e.target.value)}
                            />
                            <Button 
                              colorScheme="blue" 
                              onClick={createNewSpace}
                              isLoading={saving}
                              isDisabled={!newSpaceName.trim()}
                            >
                              Créer
                            </Button>
                          </HStack>
                        </CardBody>
                      </Card>

                      {currentSpace && (
                        <Card variant="outline">
                          <CardBody>
                            <Heading size="md" mb={4}>
                              Paramètres de l'espace: {currentSpace.name}
                            </Heading>

                            <FormControl mb={4}>
                              <FormLabel fontWeight="medium">Couleur de l'espace</FormLabel>
                              <Select
                                value={currentSpace.settings?.color || '#4285F4'}
                                maxW="sm"
                              >
                                <option value="#4285F4">Bleu</option>
                                <option value="#34A853">Vert</option>
                                <option value="#EA4335">Rouge</option>
                                <option value="#FBBC05">Jaune</option>
                              </Select>
                            </FormControl>

                            <FormControl mb={4}>
                              <FormLabel fontWeight="medium">Vue par défaut</FormLabel>
                              <Select
                                value={currentSpace.settings?.defaultView || 'dashboard'}
                                maxW="sm"
                              >
                                <option value="dashboard">Tableau de bord</option>
                                <option value="analytics">Analytiques</option>
                                <option value="calendar">Calendrier</option>
                              </Select>
                            </FormControl>

                            <FormControl display="flex" alignItems="center">
                              <FormLabel htmlFor="spaceNotifications" mb="0" flex="1">
                                Notifications pour cet espace
                              </FormLabel>
                              <Switch 
                                id="spaceNotifications" 
                                isChecked={currentSpace.settings?.notifications !== false}
                              />
                            </FormControl>
                          </CardBody>
                        </Card>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Flex>
        </ModalContent>
      </Modal>

      {/* Dialog de confirmation pour la suppression d'un espace */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Supprimer l'espace
            </AlertDialogHeader>

            <AlertDialogBody>
              Êtes-vous sûr de vouloir supprimer l'espace "{spaceToDelete?.name}" ? Cette action est irréversible.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={deleteSpace} ml={3} isLoading={saving}>
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
