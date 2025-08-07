// app/dashboard/contexts/DashboardContext.tsx
"use client"

import { createContext, useContext } from "react"
import { PersonaRegistro, VehiculoRegistro, TipoIngreso } from "../types"

interface DashboardContextType {
  tipoIngreso: TipoIngreso
  setTipoIngreso: (tipo: TipoIngreso) => void
  idSolicitud: string
  idPersona: string
  setIdPersona: (id: string) => void
  idVehiculo: string
  setIdVehiculo: (id: string) => void
  loading: boolean
  error: string
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  personas: PersonaRegistro[]
  vehiculos: VehiculoRegistro[]
  solicitudData: any
  filtroNombre: string
  setFiltroNombre: (value: string) => void
  filtroEstado: string
  setFiltroEstado: (value: string) => void
  editMode: boolean
  setEditMode: (mode: boolean) => void
  currentPersona: PersonaRegistro | null
  setCurrentPersona: (persona: PersonaRegistro | null) => void
  currentVehiculo: VehiculoRegistro | null
  setCurrentVehiculo: (vehiculo: VehiculoRegistro | null) => void
  isCargaMasivaOpen: boolean
  setIsCargaMasivaOpen: (open: boolean) => void
  isPILAOpen: boolean
  setIsPILAOpen: (open: boolean) => void
  showCargaMasivaSuccess: boolean
  setShowCargaMasivaSuccess: (show: boolean) => void
  showPILASuccess: boolean
  setShowPILASuccess: (show: boolean) => void
  isSolicitudTerminada: boolean
  showTerminarDialog: boolean
  setShowTerminarDialog: (open: boolean) => void
  terminandoSolicitud: boolean
  fechaTerminacion: string
  handleTerminarSolicitud: () => Promise<void>
  handleRefresh: () => void
  fetchPersonas: () => Promise<void>
  fetchVehiculos: () => Promise<void>
  fetchSolicitudData: (id: string) => Promise<void>
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}