export type Player = {
  id: string
  name?: string
  isReady: boolean
  joinedAt: Date
}

export type GameState = 'waiting' | 'starting' | 'playing' | 'finished'

export type Game = {
  players: Map<string, Player>
  word?: string
  impostor?: string
  state: GameState
  createdAt: Date
  lastActivity: Date
}

export type GameUpdate = {
  type: 'player_joined' | 'player_left' | 'game_started' | 'word_revealed' | 'game_ended' | 'initial_state' | 'heartbeat'
  gameCode: string
  data?: unknown
  timestamp: Date | string
}

export const sseConnections = new Map<string, Set<{ controller: ReadableStreamDefaultController, userId: string }>>()
export const games = new Map<string, Game>()

export function generateGameCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  return code
}

export function broadcastToGame(gameCode: string, update: GameUpdate) {
  const connections = sseConnections.get(gameCode)
  const game = games.get(gameCode)

  if (connections && game) {
    const connectionsArray = Array.from(connections)
    const failedConnections: { controller: ReadableStreamDefaultController, userId: string }[] = []

    connectionsArray.forEach((connection) => {
      const { controller, userId } = connection
      try {
        if (update.type === 'word_revealed') {
          const personalizedUpdate = {
            ...update,
            data: {
              ...(update.data || {}),
              word: game.impostor === userId ? '???' : game.word,
              isImpostor: game.impostor === userId
            }
          }
          controller.enqueue(`data: ${JSON.stringify(personalizedUpdate)}\n\n`)
        } else {
          controller.enqueue(`data: ${JSON.stringify(update)}\n\n`)
        }
      } catch (error) {
        failedConnections.push(connection)
        console.error('Failed to send SSE message:', error)
      }
    })

    failedConnections.forEach(connection => {
      connections.delete(connection)
    })
  }
}

export function addSSEConnection(gameCode: string, controller: ReadableStreamDefaultController, userId: string) {
  if (!sseConnections.has(gameCode)) {
    sseConnections.set(gameCode, new Set())
  }
  sseConnections.get(gameCode)!.add({ controller, userId })
}

export function removeSSEConnection(gameCode: string, controller: ReadableStreamDefaultController, userId: string) {
  const connections = sseConnections.get(gameCode)
  if (connections) {
    // Find and remove the matching connection
    for (const conn of Array.from(connections)) {
      if (conn.controller === controller && conn.userId === userId) {
        connections.delete(conn)
        break
      }
    }
    // Clean up empty connection sets
    if (connections.size === 0) {
      sseConnections.delete(gameCode)
    }
  }
}

setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  for (const [code, game] of games.entries()) {
    if (game.lastActivity < oneHourAgo) {
      games.delete(code)
      sseConnections.delete(code)
    }
  }
}, 10 * 60 * 1000)
