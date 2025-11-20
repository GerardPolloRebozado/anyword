'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

interface RegisterClientFormProps {
  redirectUrl?: string;
}

export default function RegisterClientForm({ redirectUrl }: RegisterClientFormProps) {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim()) {
      setIsLoading(true)
      setError('')
      try {
        const response = await fetch('/api/set-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName: playerName.trim() }),
        });
        const data = await response.json();
        if (data.success) {
          router.push(redirectUrl || '/')
        } else {
          setError('Error al guardar el nombre');
        }
      } catch (error) {
        setError('Error de conexión');
      } finally {
        setIsLoading(false)
      }
    } else {
      setError('Por favor, ingresa un nombre válido');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ingresa tu Nombre
          </CardTitle>
          <CardDescription>
            Necesitas un nombre para poder jugar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-4">
            <Input
              placeholder="Tu nombre de jugador"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar y Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
