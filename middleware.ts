import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Liste des routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/auth/signin', '/auth/signup'];

// Liste des routes qui sont autorisées même pour les utilisateurs qui ont besoin d'onboarding
const onboardingExemptRoutes = ['/onboarding', '/api/spaces', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ignorer les ressources statiques
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    // Vérifier le token d'authentification
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
    if (!token && !publicRoutes.some(route => pathname.startsWith(route))) {
      const url = new URL('/auth/signin', request.url);
      return NextResponse.redirect(url);
    }

    // Si l'utilisateur est connecté
    if (token && token.email) {
      // Vérifier si l'utilisateur a besoin d'onboarding
      // Pour ce faire, il faudrait accéder à Firestore, mais ce n'est pas possible dans un middleware Edge
      // Au lieu de cela, on vérifie si le paramètre d'URL newUser est présent
      const newUser = request.nextUrl.searchParams.get('newUser') === 'true';
      
      // Si l'utilisateur est nouveau ou vient de s'inscrire, le rediriger vers l'onboarding
      // sauf s'il est déjà sur une page d'onboarding ou d'authentification
      if (newUser && 
          !pathname.startsWith('/onboarding') && 
          !pathname.startsWith('/auth') &&
          !pathname.startsWith('/api')) {
        const url = new URL('/onboarding', request.url);
        return NextResponse.redirect(url);
      }

      // Note: Idéalement, nous vérifierions également dans Firestore si l'utilisateur a besoin d'onboarding
      // Mais comme cela n'est pas possible dans un Edge Middleware, nous utilisons un paramètre d'URL
      // La vérification complète sera faite côté client dans le composant Dashboard
    }

    // Laisser passer toutes les autres requêtes
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  // Appliquer le middleware à toutes les routes sauf celles qui commencent par API
  // pour éviter les problèmes avec les routes d'API
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
