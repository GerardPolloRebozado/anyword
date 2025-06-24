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
        { error: 'Player not in this game' },
        { status: 403 }
      )
    }

    if (game.state === 'playing' && game.word && game.impostor !== userId) {
      return NextResponse.json({
        word: game.word,
        isImpostor: false
      })
    } else if (game.state === 'playing' && game.impostor === userId) {
      return NextResponse.json({
        word: '???',
        isImpostor: true
      })
    }

    return NextResponse.json({
      word: undefined,
      gameState: game.state
    })
  } catch (error) {
    console.error('Get word error:', error)
    return NextResponse.json(
      { error: 'Failed to get word' },
      { status: 500 }
    )
  }
}
