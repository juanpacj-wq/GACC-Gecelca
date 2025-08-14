// components/ui/forgot-password-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle2, AlertCircle, Info } from "lucide-react"

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultUser?: string
  onSuccess?: (nit: string) => void // Nuevo callback para notificar éxito
}

export default function ForgotPasswordDialog({ 
  open, 
  onOpenChange,
  defaultUser = "",
  onSuccess // Recibir el callback
}: ForgotPasswordDialogProps) {
  const [idNit, setIdNit] = useState(defaultUser)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [buttonLocked, setButtonLocked] = useState(false)

  // Actualizar el campo cuando cambie el defaultUser
  useEffect(() => {
    if (defaultUser) {
      setIdNit(defaultUser)
    }
  }, [defaultUser])

  // Limpiar estado cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      // Resetear todo excepto el idNit si es exitoso
      if (!success) {
        setIdNit(defaultUser)
      }
      setError("")
      setEmails([])
      // No resetear success y buttonLocked para mantener el estado después del éxito
    }
  }, [open, defaultUser, success])

  const maskEmail = (email: string): string => {
    if (!email) return "";

    const at = email.indexOf("@");
    // Si no hay @, solo enmascara todo menos los 2 primeros
    if (at === -1) {
      const visible = Math.min(2, email.length);
      return email.slice(0, visible) + "*".repeat(Math.max(0, email.length - visible));
    }

    const local = email.slice(0, at);
    const domain = email.slice(at); // incluye la @

    const visible = Math.min(2, local.length);
    const maskedLocal = "*".repeat(Math.max(0, local.length - visible));

    return local.slice(0, visible) + maskedLocal + domain;
  };

  // Función para solicitar el token
  const handleRequestToken = async () => {
    // Validación
    if (!idNit.trim()) {
      setError("Por favor ingrese su usuario (ID/NIT)")
      return
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_nit: idNit.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || `Error al solicitar token (${response.status})`)
        return
      }

      // Verificar que la respuesta sea correcta
      if (data.success && data.message === "El correo electrónico ha sido enviado correctamente") {
        setSuccess(true)
        setButtonLocked(true) // Bloquear el botón después del éxito
        
        // Procesar los correos si vienen en la respuesta
        if (data.emails) {
          const emailList = data.emails.split(";").map((e: string) => e.trim()).filter(Boolean)
          setEmails(emailList)
        }

        // Notificar al componente padre sobre el éxito
        if (onSuccess) {
          onSuccess(idNit.trim())
        }

        // Cerrar el diálogo después de un breve delay para que el usuario vea el mensaje de éxito
        setTimeout(() => {
          onOpenChange(false)
          // Resetear el estado después de cerrar
          setTimeout(() => {
            setSuccess(false)
            setButtonLocked(false)
            setEmails([])
          }, 500)
        }, 5000)
        
      } else {
        setError("La solicitud se realizó pero la respuesta no coincide con el formato esperado")
      }
    } catch (err) {
      console.error("Error al solicitar token:", err)
      setError("No se pudo completar la solicitud. Por favor intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  // Función para manejar el cierre del diálogo
  const handleClose = () => {
    // Si hay éxito y se está cerrando manualmente, notificar al padre
    if (success && onSuccess && idNit.trim()) {
      onSuccess(idNit.trim())
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Solicitar contraseña
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo de usuario */}
          <div className="space-y-2">
            <Label htmlFor="idNit">Usuario (NIT)</Label>
            <Input
              id="idNit"
              type="text"
              placeholder="Ej. 12345678"
              value={idNit}
              onChange={(e) => setIdNit(e.target.value)}
              disabled={loading || buttonLocked}
              autoComplete="username"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Se enviará un correo con las credenciales de acceso
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Credenciales solicitadas correctamente. Revise su correo electrónico.
              </AlertDescription>
            </Alert>
          )}

          {/* Lista de correos notificados */}
          {emails.length > 0 && (
            <div className="rounded-lg bg-blue-50 p-3 space-y-2">
              <p className="text-sm font-medium text-blue-900 flex items-center gap-1">
                <Info className="w-4 h-4" />
                Correos notificados:
              </p>
              <div className="space-y-1">
                {emails.map((email, idx) => (
                  <div key={idx} className="text-sm text-blue-700 pl-5">
                    • {maskEmail(email)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {success ? "Cerrar" : "Cancelar"}
            </Button>
            <Button
              type="button"
              onClick={handleRequestToken}
              disabled={loading || !idNit.trim() || buttonLocked}
              className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : buttonLocked ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Solicitado
                </>
              ) : (
                "Solicitar Token"
              )}
            </Button>
          </div>

          {/* Nota informativa */}
          {!success && !buttonLocked && (
            <div className="text-xs text-gray-500 text-center border-t pt-3">
              <p>Una vez solicitadas las credenciales, podrá ingresar con su NIT y la contraseña recibida</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}