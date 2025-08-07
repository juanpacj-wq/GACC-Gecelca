// app/dashboard/components/CargaPILADialog.tsx
"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import PersonaPILA from "../modules/personas/PersonaPILA"
import { useDashboardData } from "../hooks/useDashboardData"

export default function CargaPILADialog() {
  const {
    idSolicitud,
    isPILAOpen,
    setIsPILAOpen,
    handlePILASuccess
  } = useDashboardData()

  return (
    <Dialog open={isPILAOpen} onOpenChange={setIsPILAOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <PersonaPILA 
          idSolicitud={idSolicitud}
          onClose={() => setIsPILAOpen(false)}
          onSuccess={handlePILASuccess}
        />
      </DialogContent>
    </Dialog>
  )
}