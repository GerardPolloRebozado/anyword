
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PlayContent from './client-page'
import { Suspense } from 'react'
import { GameSkeleton } from '@/components/game-components'

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>}) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  const playerName = cookieStore.get('playerName')?.value
    const sp = await searchParams

  if (!userId || !playerName) {
    const code = sp.code || ''
    const redirectUrl = `/register?redirect=${encodeURIComponent(`/play?code=${code}`)}`
    redirect(redirectUrl)
  }

  return (
    <Suspense fallback={<GameSkeleton />}>
      <PlayContent userId={userId} playerName={playerName} />
    </Suspense>
  )
}
