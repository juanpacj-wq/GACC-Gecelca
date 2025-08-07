// app/dashboard/components/CargaMasivaDialog.tsx
"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import PersonaMasiva from "../modules/personas/PersonaMasiva"
import { useDashboardData } from "../hooks/useDashboardData"

export default function CargaMasivaDialog() {
  const {
    idSolicitud,
    isCargaMasivaOpen,
    setIsCargaMasivaOpen,
    handleCargaMasivaSuccess
  } = useDashboardData()

  return (
    <Dialog open={isCargaMasivaOpen} onOpenChange={setIsCargaMasivaOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <PersonaMasiva 
          idSolicitud={idSolicitud}
          onClose={() => setIsCargaMasivaOpen(false)}
          onSuccess={handleCargaMasivaSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}