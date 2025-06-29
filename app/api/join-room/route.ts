import { NextRequest, NextResponse } from 'next/server'
import { games, broadcastToGame, type Player } from '@/lib/game-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, userId, playerName } = body

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

    if (game.state !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      )
    }

    if (!game.players.has(userId)) {

      const player: Player = {
        id: userId,
        name: playerName || `Player ${userId.slice(0, 8)}`,
        isReady: false,
        joinedAt: new Date()
      }

      game.players.set(userId, player)
      game.lastActivity = new Date()

      broadcastToGame(csode, {
        type: 'player_joined',
        gameCode: code,
        data: {
          players: Array.from(game.players.values()).map(p => ({
            id: p.id,
            name: p.name || 'Anonymous',
            isReady: p.isReady
          })),
          readyCount: Array.from(game.players.values()).filter(p => p.isReady).length,
          totalPlayers: game.players.size,
          canStart: game.players.size >= 3 && Array.from(game.players.values()).every(p => p.isReady),
          gameState: game.state
        },
        timestamp: new Date().toISOString()
      })
    }

    const players = Array.from(game.players.values()).map(p => ({
      id: p.id,
      name: p.name || 'Anonymous',
      isReady: p.isReady
    }))

    return NextResponse.json({
      success: true,
      game: {
        code,
        players,
        gameState: game.state,
        readyCount: players.filter(p => p.isReady).length,
        totalPlayers: players.length,
        canStart: players.length >= 3 && players.every(p => p.isReady)
      }
    })
  } catch (error) {
    console.error('Join room error:', error)
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    )
  }
}
