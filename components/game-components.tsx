'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Crown, Clock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

interface Player {
  id: string
  name?: string
  isReady: boolean
}

interface PlayersCardProps {
  players: Player[]
  userId: string
  readyCount: number
  totalPlayers: number
}

export function PlayersCard({ players, userId, readyCount, totalPlayers }: PlayersCardProps) {
  const readyPercentage = totalPlayers > 0 ? (readyCount / totalPlayers) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Jugadores ({totalPlayers})
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{readyCount} de {totalPlayers} listos</span>
            <span>{Math.round(readyPercentage)}%</span>
          </div>
          <Progress value={readyPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${player.id === userId
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted/50'
                }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {(player.name || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {player.name || 'Anónimo'}
                    </span>
                    {player.id === userId && (
                      <Badge variant="secondary" className="text-xs">
                        Tú
                      </Badge>
                    )}
                    {index === 0 && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
              <Badge
                variant={player.isReady ? 'default' : 'outline'}
                className="flex items-center gap-1"
              >
                {player.isReady ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {player.isReady ? 'Listo' : 'Esperando'}
              </Badge>
            </div>
          ))}
        </div>

        {totalPlayers < 3 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              Se necesitan al menos 3 jugadores para empezar
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface GameStateCardProps {
  gameState: string
  currentPlayer?: { isReady: boolean }
  word?: string
  isImpostor: boolean
  onReady: () => void
  onNewRound?: () => void
  onExitRoom: () => void
  isLoading: boolean
}

export function GameStateCard({
  gameState,
  currentPlayer,
  word,
  isImpostor,
  onReady,
  onNewRound,
  onExitRoom,
  isLoading
}: GameStateCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del Juego</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === 'waiting' && (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-lg font-medium">Esperando jugadores...</p>
              <p className="text-sm text-muted-foreground">
                Todos los jugadores deben estar listos para comenzar
              </p>
            </div>
            <Button
              onClick={onReady}
              disabled={isLoading}
              className="w-full"
              variant={currentPlayer?.isReady ? 'outline' : 'default'}
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Cargando...
                </>
              ) : currentPlayer?.isReady ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como listo
                </>
              )}
            </Button>
          </div>
        )}

        {gameState === 'starting' && (
          <div className="text-center space-y-4">
            <div className="p-6 rounded-lg bg-linear-to-br from-primary/10 to-primary/5">
              <div className="animate-pulse">
                <Crown className="h-12 w-12 mx-auto mb-3 text-primary" />
                <p className="text-xl font-bold">¡El juego está empezando!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Preparando palabra secreta...
                </p>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center space-y-4">
            <div className={`p-6 rounded-lg border-2 ${isImpostor
              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
              : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
              }`}>
              <div className="flex items-center justify-center mb-3">
                {isImpostor ? (
                  <EyeOff className="h-8 w-8 text-red-600 dark:text-red-400" />
                ) : (
                  <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <p className="text-sm font-medium mb-2">
                {isImpostor ? 'Eres el impostor' : 'Tu palabra es:'}
              </p>
              <p className="text-3xl font-bold mb-4">
                {word || '???'}
              </p>
              <p className={`text-sm ${isImpostor
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
                }`}>
                {isImpostor
                  ? '¡Trata de adivinar la palabra sin que te descubran!'
                  : 'Discute con los otros jugadores para encontrar al impostor'
                }
              </p>
            </div>

            <Button
              onClick={onNewRound || onReady}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Cargando...
                </>
              ) : (
                'Nueva ronda'
              )}
            </Button>
          </div>
        )}

        <Separator />

        <Button
          onClick={onExitRoom}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Salir de la sala
        </Button>
      </CardContent>
    </Card>
  )
}

export function GameSkeleton() {
  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <Skeleton className="h-8 w-32 mx-auto mb-2" />
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
