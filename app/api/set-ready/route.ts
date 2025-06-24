import { NextRequest, NextResponse } from 'next/server'
import { games, broadcastToGame } from '@/lib/game-store'
import ollama from 'ollama'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, userId, newRound = false } = body

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

    // Handle new round request
    if (newRound && game.state === 'playing') {
      game.state = 'waiting'
      game.word = undefined
      game.impostor = undefined
      // Reset all players to not ready
      game.players.forEach(p => {
        p.isReady = false
      })
      player.isReady = true // Mark the requesting player as ready
      game.lastActivity = new Date()

      const players = Array.from(game.players.values()).map(p => ({
        id: p.id,
        name: p.name || 'Anonymous',
        isReady: p.isReady
      }))

      // Broadcast new round started
      broadcastToGame(code, {
        type: 'player_joined',
        gameCode: code,
        data: {
          players,
          readyCount: 1, // Only the requesting player is ready
          totalPlayers: players.length,
          canStart: false,
          gameState: 'waiting'
        },
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        isReady: true,
        gameState: {
          code,
          players,
          gameState: 'waiting',
          readyCount: 1,
          totalPlayers: players.length,
          canStart: false
        }
      })
    }

    // Allow ready toggle only in waiting state
    if (game.state === 'starting') {
      return NextResponse.json(
        { error: 'Game is starting, please wait' },
        { status: 400 }
      )
    }

    if (game.state !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      )
    }

    // Normal ready toggle
    player.isReady = !player.isReady
    game.lastActivity = new Date()

    const players = Array.from(game.players.values()).map(p => ({
      id: p.id,
      name: p.name || 'Anonymous',
      isReady: p.isReady
    }))

    const readyCount = players.filter(p => p.isReady).length
    const canStart = players.length >= 3 && players.every(p => p.isReady)

    // Broadcast player state change
    broadcastToGame(code, {
      type: 'player_joined',
      gameCode: code,
      data: {
        players,
        readyCount,
        totalPlayers: players.length,
        canStart,
        gameState: game.state
      },
      timestamp: new Date().toISOString()
    })

    // If all players are ready and minimum players met, start the game
    if (canStart) {
      game.state = 'starting'

      // Broadcast game starting
      broadcastToGame(code, {
        type: 'game_started',
        gameCode: code,
        data: {
          gameState: 'starting',
          players
        },
        timestamp: new Date().toISOString()
      })

      // Select random word and impostor after a delay
      setTimeout(async () => {
        // Check if game still exists
        const currentGame = games.get(code)
        if (!currentGame || currentGame.state !== 'starting') {
          return
        }

        try {
          const raeWordRes = await fetch("https://rae-api.com/api/random")
          const raeWord = await raeWordRes.json()

          const res = await ollama.generate({
            model: 'llama3.2:3b',
            prompt: `Eres un generador de palabras simples y cotidianas para un juego de mesa. Genera una sola palabra concreta, fácil de entender y muy común. Evita palabras raras, técnicas, abstractas o que suenen extrañas. Tu respuesta debe ser solo la palabra, sin comillas ni explicación. Game ID: ${uuidv4()}. Aquí tienes una palabra aleatoria de la RAE, si crees que es fácil úsala, sino usa un sinónimo: ${raeWord.data?.word || "mesa"}`,
            options: { temperature: 1.2 }
          })

          currentGame.word = res.response.trim().toLowerCase()
          const playerIds = Array.from(currentGame.players.keys())
          currentGame.impostor = playerIds[Math.floor(Math.random() * playerIds.length)]
          currentGame.state = 'playing'

          broadcastToGame(code, {
            type: 'word_revealed',
            gameCode: code,
            data: {
              gameState: 'playing'
              // Note: word and impostor info is sent per player in the SSE initial state
            },
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Error generating word or setting game state:', error)
          // Reset game state to allow retry
          if (currentGame) {
            currentGame.state = 'waiting'
          }
        }
      }, 3000)
    }

    return NextResponse.json({
      success: true,
      isReady: player.isReady,
      gameState: {
        code,
        players,
        gameState: game.state,
        readyCount,
        totalPlayers: players.length,
        canStart
      }
    })
  } catch (error) {
    console.error('Set ready error:', error)
    return NextResponse.json(
      { error: 'Failed to update ready state' },
      { status: 500 }
    )
  }
}
