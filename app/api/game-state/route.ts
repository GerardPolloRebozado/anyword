import { NextRequest, NextResponse } from 'next/server'
import { games } from '@/lib/game-store'

export async function GET(request: NextRequest) {
  try {
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

    const players = Array.from(game.players.values()).map(p => ({
      id: p.id,
      name: p.name || 'Anonymous',
      isReady: p.isReady
    }))

    const gameState = {
      code,
      players,
      gameState: game.state,
      readyCount: players.filter(p => p.isReady).length,
      totalPlayers: players.length,
      canStart: players.length >= 3 && players.every(p => p.isReady)
    }

    if (game.state === 'playing') {
      return NextResponse.json({
        ...gameState,
        word: game.impostor === userId ? undefined : game.word,
        isImpostor: game.impostor === userId
      })
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error('Game state error:', error)
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    )
  }
}
