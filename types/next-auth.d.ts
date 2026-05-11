import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    error?: string
    user: {
      id?: string
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
  }
}

declare module "auth" {
  interface Session {
    accessToken?: string
    error?: string
    user: {
      id?: string
    } & DefaultSession["user"]
  }
}