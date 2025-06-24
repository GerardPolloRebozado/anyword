export interface Player {
  id: string
  name: string
  isReady: boolean
  joinedAt?: Date
}

export interface GameState {
  code: string
  players: Player[]
  gameState: 'waiting' | 'starting' | 'playing' | 'finished'
  word?: string
  isImpostor?: boolean
  readyCount: number
  totalPlayers: number
  canStart: boolean
}

export interface GameUpdate {
  type: 'initial_state' | 'player_joined' | 'player_left' | 'game_started' | 'word_revealed' | 'game_ended' | 'heartbeat'
  gameCode: string
  data: Partial<GameState>
  timestamp: string
}
