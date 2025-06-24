import { NextRequest, NextResponse } from 'next/server'
import { games, broadcastToGame } from '@/lib/game-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, userId } = body

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Game code and user ID are required' },
        { status: 400 }
      )
    }

    const game = games.get(code)
    if (!game) {
      return NextResponse.json({ success: true }) // Game doesn't exist, consider it a success
    }

    const player = game.players.get(userId)
    if (!player) {
      return NextResponse.json({ success: true }) // Player not in game, consider it a success
    }

    // Remove player from game
    game.players.delete(userId)
    game.lastActivity = new Date()

    // If no players left, delete the game
    if (game.players.size === 0) {
      games.delete(code)
      return NextResponse.json({ success: true })
    }

    const players = Array.from(game.players.values()).map(p => ({
      id: p.id,
      name: p.name || 'Anonymous',
      isReady: p.isReady
    }))

    // Broadcast player left
    broadcastToGame(code, {
      type: 'player_left',
      gameCode: code,
      data: {
        players,
        readyCount: players.filter(p => p.isReady).length,
        totalPlayers: players.length,
        canStart: players.length >= 3 && players.every(p => p.isReady),
        gameState: game.state
      },
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Exit room error:', error)
    return NextResponse.json(
      { error: 'Failed to exit room' },
      { status: 500 }
    )
  }
}
