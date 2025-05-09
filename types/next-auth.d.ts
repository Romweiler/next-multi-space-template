import NextAuth from "next-auth"

declare module "next-auth" {
  /**
   * Étendre l'interface User de next-auth
   */
  interface User {
    id: string
    email: string
    name?: string
    image?: string
  }

  /**
   * Étendre l'interface Session de next-auth
   */
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
    }
  }
}

declare module "next-auth/jwt" {
  /** Étendre l'interface JWT */
  interface JWT {
    id: string
  }
}
