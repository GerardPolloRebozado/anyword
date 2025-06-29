'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, GamepadIcon, User, Edit3, AlertCircle } from 'lucide-react'
import {Avatar, AvatarFallback} from "@/components/ui/avatar";

export default function Home() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [tempName, setTempName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedName = localStorage.getItem('playerName')
    if (savedName) {
      setPlayerName(savedName)
    } else {
      setShowNameDialog(true)
    }
  }, [])

  const handleSaveName = () => {
    if (tempName.trim()) {
      localStorage.setItem('playerName', tempName.trim())
      setPlayerName(tempName.trim())
      setShowNameDialog(false)
      setError('')
    } else {
      setError('Por favor, ingresa un nombre válido')
    }
  }

  const handleChangeName = () => {
    setTempName(playerName)
    setShowNameDialog(true)
    setError('')
  }

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setShowNameDialog(true)
      return
    }

    let userId = localStorage.getItem('userId')
    if (!userId) {
      userId = uuidv4()
      localStorage.setItem('userId', userId)
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          playerName: playerName.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/play?code=${data.code}`)
      } else {
        setError(data.error || 'Error al crear la sala')
      }
    } catch (err) {
      console.log('Error creating room:', err)
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setShowNameDialog(true)
      return
    }

    if (!joinCode.trim()) {
      setError('Por favor, ingresa un código de sala')
      return
    }

    let userId = localStorage.getItem('userId')
    if (!userId) {
      userId = uuidv4()
      localStorage.setItem('userId', userId)
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: joinCode.trim().toUpperCase(),
          userId,
          playerName: playerName.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/play?code=${joinCode.trim().toUpperCase()}`)
      } else {
        setError(data.error || 'Error al unirse a la sala')
      }
    } catch (err) {
      console.log('Error joining room:', err)
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <GamepadIcon className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-4xl font-bold">
                Anyword
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Encuentra al impostor en este emocionante juego de palabras
            </p>
          </div>

          {/* Player Info */}
          {playerName && (
            <Card className="mb-6">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Jugando como:</p>
                    <Badge variant="secondary" className="mt-1">
                      {playerName}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeName}
                  className="flex items-center gap-1"
                >
                  <Edit3 className="h-4 w-4" />
                  Cambiar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-red-600 font-medium">{error}</div>
            </Alert>
          )}

          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Create Room */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-2">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Crear Sala</CardTitle>
                <CardDescription>
                  Inicia una nueva partida e invita a tus amigos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateRoom}
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Nueva Sala
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Join Room */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Unirse a Sala</CardTitle>
                <CardDescription>
                  Ingresa el código de una sala existente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Código de la sala (ej: ABC123)"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinRoom}
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !joinCode.trim()}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Uniéndose...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Unirse a la Sala
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Game Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GamepadIcon className="h-5 w-5" />
                ¿Cómo jugar?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar><AvatarFallback>1</AvatarFallback> </Avatar>
                <p className="text-sm">Se necesitan al menos 3 jugadores para comenzar una partida.</p>
              </div>
              <div className="flex items-start gap-3">
                <Avatar><AvatarFallback>2</AvatarFallback> </Avatar>
                <p className="text-sm">Todos los jugadores reciben la misma palabra secreta, excepto uno: el impostor, que no la conoce.</p>
              </div>
              <div className="flex items-start gap-3">
                <Avatar><AvatarFallback>3</AvatarFallback> </Avatar>
                <p className="text-sm">Por turnos, cada jugador debe decir una palabra relacionada con la palabra secreta, tratando de no ser demasiado obvio. El impostor debe improvisar e intentar pasar desapercibido.</p>
              </div>
              <div className="flex items-start gap-3">
                <Avatar><AvatarFallback>4</AvatarFallback></Avatar>
                <p className="text-sm">Al final de la ronda, los jugadores votan quién creen que es el impostor. Si el impostor no es descubierto, gana. Si es descubierto, tiene una última oportunidad: adivinar la palabra secreta para ganar.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {playerName ? 'Cambiar Nombre' : 'Ingresa tu Nombre'}
            </DialogTitle>
            <DialogDescription>
              {playerName
                ? 'Puedes cambiar tu nombre de jugador aquí.'
                : 'Necesitas un nombre para jugar. ¿Cómo te gustaría que te llamen?'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Tu nombre de jugador"
              value={tempName}
              onChange={(e) => {
                setTempName(e.target.value)
                setError('')
              }}
              maxLength={20}
              className="text-center"
            />
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveName} disabled={!tempName.trim()}>
              {playerName ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
