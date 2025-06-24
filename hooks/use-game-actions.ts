import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface UseGameActionsProps {
  code: string
  userId: string
  onSuccess?: () => void
}

export function useGameActions({ code, userId, onSuccess }: UseGameActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleReady = useCallback(async () => {
    if (!code || !userId) {
      toast.error('Información de sala no disponible')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/set-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.isReady ? 'Marcado como listo' : 'Listo cancelado')
        onSuccess?.()
      } else {
        toast.error(data.error || 'Error al actualizar estado')
      }
    } catch (error) {
      console.error('Error setting ready:', error)
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [code, userId, onSuccess])

  const handleExitRoom = useCallback(async (onExit?: () => void) => {
    if (!code || !userId) {
      toast.error('Información de sala no disponible')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/exit-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Has salido de la sala')
        onExit?.()
      } else {
        toast.error(data.error || 'Error al salir de la sala')
      }
    } catch (error) {
      console.error('Error exiting room:', error)
      toast.error('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }, [code, userId])

  const copyRoomCode = useCallback(async (roomCode: string) => {
    try {
      await navigator.clipboard.writeText(roomCode)
      toast.success('Código copiado al portapapeles')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Error al copiar código')
    }
  }, [])

  return {
    isLoading,
    handleReady,
    handleExitRoom,
    copyRoomCode
  }
}
