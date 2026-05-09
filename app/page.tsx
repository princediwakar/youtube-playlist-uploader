import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import AppShell from '@/app/components/AppShell'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return <AppShell session={session} />
}
