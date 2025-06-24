'use client'

import { useEffect, useRef, useState } from 'react'
import { GameState } from '@/types/game'

export function useGamePolling(gameCode: string, userId: string) {
  const [gameState, setGameState] = useState<GameState>({
    code: gameCode,
    players: [],
    gameState: 'waiting',
    word: undefined,
    isImpostor: false,
    readyCount: 0,
    totalPlayers: 0,
    canStart: false
  })

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  const connect = () => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    setError(null)
    setIsConnected(true)

    // Start polling every 2 seconds
    pollInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/game-state?code=${gameCode}&userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setGameState(prevState => ({ ...prevState, ...data }))
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000)
  }

  const disconnect = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current)
      pollInterval.current = null
    }
    setIsConnected(false)
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    gameState,
    isConnected,
    error,
    connect,
    disconnect
  }
}
