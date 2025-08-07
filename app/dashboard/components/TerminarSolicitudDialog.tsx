// app/dashboard/components/TerminarSolicitudDialog.tsx
"use client"

import { Loader2 } from "lucide-react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useDashboardData } from "../hooks/useDashboardData"

export default function TerminarSolicitudDialog() {
  const {
    showTerminarDialog,
    setShowTerminarDialog,
    terminandoSolicitud,
    handleTerminarSolicitud
  } = useDashboardData()

  return (
    <AlertDialog open={showTerminarDialog} onOpenChange={setShowTerminarDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar terminación de solicitud</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro de que desea terminar esta solicitud? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={terminandoSolicitud}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleTerminarSolicitud}
            className="bg-red-600 hover:bg-red-700"
            disabled={terminandoSolicitud}
          >
            {terminandoSolicitud ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Terminando...
              </>
            ) : (
              "Terminar solicitud"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}