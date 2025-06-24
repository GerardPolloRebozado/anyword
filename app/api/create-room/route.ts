import { NextRequest, NextResponse } from 'next/server'
import { games, generateGameCode, type Player } from '@/lib/game-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, playerName } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const code = generateGameCode()
    const now = new Date()

    const player: Player = {
      id: userId,
      name: playerName || `Player ${userId.slice(0, 8)}`,
      isReady: false,
      joinedAt: now
    }

    games.set(code, {
      players: new Map([[userId, player]]),
      state: 'waiting',
      createdAt: now,
      lastActivity: now
    })

    return NextResponse.json({
      code,
      userId,
      player: {
        id: player.id,
        name: player.name,
        isReady: player.isReady
      }
    })
  } catch (error) {
    console.error('Create room error:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
