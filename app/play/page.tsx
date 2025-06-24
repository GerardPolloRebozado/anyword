'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGameSSE } from '@/hooks/use-game-sse'
import { PlayersCard, GameStateCard, GameSkeleton } from '@/components/game-components'
import { Wifi, WifiOff, Copy, Check } from 'lucide-react'

import React from 'react'

function PlayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [userId, setUserId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const { gameState, isConnected, error } = useGameSSE(code, userId)

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem('userId') || ''
    const playerNameFromStorage = localStorage.getItem('playerName') || ''
    setUserId(userIdFromStorage)
    setPlayerName(playerNameFromStorage)

    const codeFromQuery = searchParams.get('code')
    if (codeFromQuery) {
      setCode(codeFromQuery)
    }
  }, [searchParams])

  const handleReady = async () => {
    if (!code || !userId) return
    setIsLoading(true)

    try {
      await fetch(`/api/set-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      })
    } catch (error) {
      console.error('Error setting ready:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewRound = async () => {
    if (!code || !userId) return
    setIsLoading(true)

    try {
      await fetch(`/api/set-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code, newRound: true })
      })
    } catch (error) {
      console.error('Error starting new round:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exitRoom = async () => {
    if (!code || !userId) return

    try {
      await fetch(`/api/exit-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId })
      })
      router.push('/')
    } catch (error) {
      console.error('Error exiting room:', error)
    }
  }

  const copyRoomCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!code) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl">No se encontró código de sala</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Volver al inicio
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-red-500">Error de conexión: {error}</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Volver al inicio
        </Button>
      </div>
    )
  }

  const currentPlayer = gameState.players.find(p => p.id === userId)
  const { word, isImpostor = false } = gameState

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Sala: {code}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyRoomCode}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge variant={isConnected ? 'default' : 'destructive'} className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
          {playerName && (
            <Badge variant="outline">
              {playerName}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayersCard
          players={gameState.players}
          userId={userId}
          readyCount={gameState.readyCount}
          totalPlayers={gameState.totalPlayers}
        />

        <GameStateCard
          gameState={gameState.gameState}
          currentPlayer={currentPlayer}
          word={word}
          isImpostor={isImpostor}
          onReady={handleReady}
          onNewRound={handleNewRound}
          onExitRoom={exitRoom}
          isLoading={isLoading}
        />
      </div>

      <div className="fixed bottom-2 left-2 text-xs text-muted-foreground">
        ID: {userId.slice(0, 8)}...
      </div>
    </div>
  )
}

const Play: React.FC = () => {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <PlayContent />
    </Suspense>
  )
}

export default Play
