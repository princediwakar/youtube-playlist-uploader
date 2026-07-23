import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

interface TokenWithExtras {
  accessToken?: string
  refreshToken?: string
  accessTokenExpires?: number
  error?: string
  [key: string]: unknown
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'
          ].join(' '),
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      const t = token as TokenWithExtras
      if (account) {
        t.accessToken = account.access_token
        t.refreshToken = account.refresh_token
        t.accessTokenExpires = account.expires_at
      }

      if (Date.now() < (t.accessTokenExpires as number) * 1000) {
        return token
      }

      return refreshAccessToken(t)
    },
    async session({ session, token }) {
      const t = token as TokenWithExtras
      session.accessToken = t.accessToken as string
      session.error = t.error as string
      return session
    },
  },
})

async function refreshAccessToken(token: TokenWithExtras): Promise<TokenWithExtras> {
  try {
    const url = 'https://oauth2.googleapis.com/token'

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
      method: 'POST',
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}