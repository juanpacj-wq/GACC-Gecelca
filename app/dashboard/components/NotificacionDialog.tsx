// app/dashboard/components/NotificacionDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useDashboardData } from "../hooks/useDashboardData"
import { fetchFromApi } from "@/lib/api-tokens"

export default function NotificacionDialog() {
  const { idSolicitud, isNotificacionOpen, setIsNotificacionOpen } = useDashboardData()
  const [comentario, setComentario] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSend = async () => {
    if (!comentario.trim()) {
      setError("El comentario no puede estar vacío.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      await fetchFromApi('COMENTARIOS_PERSONA', {
        id_solicitud: idSolicitud,
        comentario: comentario,
      });
      setSuccess(true)
      setComentario("")
      setTimeout(() => {
        setIsNotificacionOpen(false)
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al enviar la notificación.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isNotificacionOpen} onOpenChange={setIsNotificacionOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notificación de Cambios</DialogTitle>
          <DialogDescription>
            En este apartado debe especificar las actividades realizadas que desea informar, recuerde que en caso de cambio de documentos debe mencionar los empleados/vehículos en cuestión y describir la modificación realizada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Escriba aquí sus comentarios..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={6}
          />
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="mt-2 border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Notificación enviada correctamente.</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsNotificacionOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={loading || !comentario.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}