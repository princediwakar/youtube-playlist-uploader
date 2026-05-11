import { auth } from '@/lib/auth'
import AppShell from '@/app/components/AppShell'

export default async function HomePage() {
  const session = await auth()

  return <AppShell session={session} />
}
