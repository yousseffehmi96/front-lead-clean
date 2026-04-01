'use server'
import { clerkClient } from '@clerk/nextjs/server';

export async function createUser(
  email: string, 
  metadata: {
    firstName: string;
    lastName: string;
    role: string;
  }
) {
  try {
    const clerk = await clerkClient();
    
   
    const user = await clerk.users.createUser({
      emailAddress: [email],
      publicMetadata: metadata,
      skipPasswordRequirement: true, 
    });
    
    if (user.emailAddresses[0]) {
      await clerk.emailAddresses.updateEmailAddress(
        user.emailAddresses[0].id,
        { verified: true }
      );
    }
    
    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: metadata.firstName,
        lastName: metadata.lastName
      }
    };
  } catch (err: any) {
    console.error("Erreur lors de la création de l'utilisateur:", err);
    return { 
      success: false, 
      error: err.message || "Une erreur est survenue" 
    };
  }
}


export async function getAllUsers() {
  try {
    const clerk = await clerkClient();
    
    // On récupère la liste (limitée à 500 pour cet exemple)
    const response = await clerk.users.getUserList({
      orderBy: '-created_at', // Les plus récents en premier
    });

    // On nettoie les données pour ne renvoyer que ce qui est nécessaire au client
    const users = response.data.map(user => ({
      id: user.id,
      firstName: (user.publicMetadata.firstName) as string,
      lastName: (user.publicMetadata.lastName)as string,
      email: user.emailAddresses[0]?.emailAddress,
      role: user.publicMetadata.role as string || 'agent',
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt
    }));

    return { success: true, users };
  } catch (err: any) {
    console.error("Erreur récupération utilisateurs:", err);
    return { success: false, error: err.message };
  }
}


export async function deleteUser(userId: string) {
  try {
    const clerk = await clerkClient();
    
    await clerk.users.deleteUser(userId);
    
  
    
    return { success: true };
  } catch (err: any) {
    console.error("Erreur suppression Clerk:", err);
    return { success: false, error: err.message || "Impossible de supprimer l'utilisateur" };
  }
}