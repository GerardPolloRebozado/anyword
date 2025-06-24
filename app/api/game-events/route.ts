import { NextRequest, NextResponse } from 'next/server'
import { games, addSSEConnection, removeSSEConnection } from '@/lib/game-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('userId')

  if (!code || !userId) {
    return NextResponse.json(
      { error: 'Game code and user ID are required' },
      { status: 400 }
    )
  }

  const game = games.get(code)
  if (!game) {
    return NextResponse.json(
      { error: 'Game not found' },
      { status: 404 }
    )
  }

  const player = game.players.get(userId)
  if (!player) {
    return NextResponse.json(
      { error: 'Player not in game' },
      { status: 403 }
    )
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial game state
      const players = Array.from(game.players.values()).map(p => ({
        id: p.id,
        name: p.name || 'Anonymous',
        isReady: p.isReady
      }))

      const initialData = {
        type: 'initial_state',
        gameCode: code,
        data: {
          code,
          players,
          gameState: game.state,
          readyCount: players.filter(p => p.isReady).length,
          totalPlayers: players.length,
          canStart: players.length >= 3 && players.every(p => p.isReady),
          word: game.state === 'playing' ? (game.impostor === userId ? '???' : game.word) : undefined,
          isImpostor: game.impostor === userId
        },
        timestamp: new Date().toISOString()
      }

      controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`)

      // Add connection to the game's SSE connections
      addSSEConnection(code, controller, userId)

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`)
        } catch {
          clearInterval(heartbeatInterval)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        removeSSEConnection(code, controller, userId)
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}
