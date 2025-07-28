// app/dashboard/modules/utils/StatusBadges.tsx
"use client"

import { CheckCircle2, AlertCircle, XCircle, FileText, Calendar, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Badge para estado de personas
export function PersonaStatusBadge({ 
  estado, 
  estadoActividad 
}: { 
  estado?: string; 
  estadoActividad?: string 
}) {
  const isApproved = estado === "APROBADO"
  
  switch (estadoActividad) {
    case "ACTIVO":
      if (isApproved) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Activo
          </span>
        )
      }
      break
    case "TERMINACIÓN DE CONTRATO":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          <XCircle className="w-3 h-3" />
          Terminación de contrato
        </span>
      )
    case "LICENCIA":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          <FileText className="w-3 h-3" />
          Licencia
        </span>
      )
    case "VACACIONES":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          <Calendar className="w-3 h-3" />
          Vacaciones
        </span>
      )
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Activo
          </span>
  )
}

// Badge para estado de vehículos
export function VehiculoStatusBadge({ estado }: { estado: string }) {
  if (estado === "APROBADO") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Aprobado
      </span>
    )
  } else {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
        <AlertCircle className="w-3 h-3" />
        Pendiente
      </span>
    )
  }
}

// Componente para mostrar conductores de un vehículo
export function ConductoresInfo({ conductores }: { conductores: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-gray-600">Ver conductores</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="text-sm font-medium mb-1">Conductores asignados:</p>
          <ul className="text-xs space-y-1">
            {conductores.split(';').map((conductor, idx) => (
              <li key={idx} className="text-gray-600">• {conductor.trim()}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}