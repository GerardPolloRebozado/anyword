'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GameState, GameUpdate } from '@/types/game'

export function useGameSSE(gameCode: string, userId: string) {
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
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (!gameCode || !userId || eventSourceRef.current) {
      return
    }

    setError(null)

    try {
      const eventSource = new EventSource(`/api/game-events?code=${encodeURIComponent(gameCode)}&userId=${encodeURIComponent(userId)}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const update: GameUpdate = JSON.parse(event.data)

          if (update.type === 'initial_state' || update.type === 'player_joined' ||
            update.type === 'player_left' || update.type === 'game_started' ||
            update.type === 'word_revealed') {
            setGameState(prevState => ({
              ...prevState,
              ...update.data,
              // Ensure we don't lose the code
              code: prevState.code
            }))
          }
        } catch (parseError) {
          console.error('Error parsing SSE message:', parseError)
        }
      }

      eventSource.onerror = (event) => {
        console.error('SSE error:', event)
        setIsConnected(false)

        // Provide more specific error information
        const errorMessage = event.type === 'error' ? 'Connection error' : 'Unknown SSE error'
        setError(errorMessage)

        // Try to reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            eventSourceRef.current = null
            connect()
          }
        }, 3000)
      }

    } catch (err) {
      setError('Failed to connect')
      console.error('SSE connection error:', err)
    }
  }, [gameCode, userId])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    if (gameCode && userId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [gameCode, userId, connect, disconnect])

  return {
    gameState,
    isConnected,
    error,
    connect,
    disconnect
  }
}
