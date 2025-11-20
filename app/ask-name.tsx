"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { User } from "lucide-react"
import { useState, useEffect } from "react"

import { usePathname } from 'next/navigation'

export default function AskName() {
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [tempName, setTempName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/register') {
      return
    }
    const savedName = document.cookie.split('; ').find(row => row.startsWith('playerName='))
    if (savedName) {
      setPlayerName(savedName.split('=')[1])
    } else {
      setShowNameDialog(true)
    }
  }, [pathname])

  const handleSaveName = async () => {
    if (tempName.trim()) {
      try {
        const response = await fetch('/api/set-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName: tempName.trim() }),
        });
        const data = await response.json();
        if (data.success) {
          setPlayerName(data.playerName);
          setShowNameDialog(false);
          setError('');
          window.location.reload();
        } else {
          setError('Error al guardar el nombre');
        }
      } catch {
        setError('Error de conexión');
      }
    } else {
      setError('Por favor, ingresa un nombre válido');
    }
  }
  return (
    < Dialog open={showNameDialog} onOpenChange={setShowNameDialog} >
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
    </ Dialog>
  )
}
