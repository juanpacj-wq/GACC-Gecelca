// app/dashboard/hooks/useDashboardData.ts
"use client"

import { useRouter } from "next/navigation"
import { useDashboard } from "../contexts/DashboardContext"
import { useAuth } from "@/contexts/AuthContext"
import { PersonaRegistro, VehiculoRegistro } from "../types"

export function useDashboardData() {
  const router = useRouter()
  const { logout } = useAuth()
  const context = useDashboard()

  // Manejadores de eventos para funcionalidades específicas
  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleOpenDialog = () => {
    context.setEditMode(false)
    context.setCurrentPersona(null)
    context.setCurrentVehiculo(null)
    context.setIdPersona("") // Resetear el ID de persona al abrir el diálogo
    context.setIdVehiculo("") // Resetear el ID de vehículo al abrir el diálogo
    context.setActiveTab("general")
    context.setIsDialogOpen(true)
  }

  // Manejador para abrir el diálogo de carga masiva
  const handleOpenCargaMasiva = () => {
    context.setIsCargaMasivaOpen(true)
  }

  // Manejador para abrir el diálogo de carga PILA
  const handleOpenPILA = () => {
    context.setIsPILAOpen(true)
  }

  // Manejador para editar una persona
  const handleEditPersona = (persona: PersonaRegistro) => {
    context.setEditMode(true)
    context.setCurrentPersona(persona)
    // Usar el id_persona si está disponible, o guid0, o Title como fallback
    if (persona.id_persona) {
      context.setIdPersona(persona.id_persona)
    } else if (persona.Title) {
      context.setIdPersona(persona.Title)
    }
    context.setActiveTab("general")
    context.setIsDialogOpen(true)
  }

  // Manejador para editar un vehículo
  const handleEditVehiculo = (vehiculo: VehiculoRegistro) => {
    context.setEditMode(true)
    context.setCurrentVehiculo(vehiculo)
    if (vehiculo.id_vehiculo) {
      context.setIdVehiculo(vehiculo.id_vehiculo)
    }
    context.setActiveTab("general")
    context.setIsDialogOpen(true)
  }

  // Función para limpiar el formulario después de cerrar el diálogo
  const handleCloseDialog = () => {
    context.setIsDialogOpen(false)
    context.setEditMode(false)
    context.setCurrentPersona(null)
    context.setCurrentVehiculo(null)
    context.setIdPersona("")
    context.setIdVehiculo("")
  }

  // Función para manejar el éxito de la carga masiva
  const handleCargaMasivaSuccess = () => {
    context.fetchPersonas()
    context.setIsCargaMasivaOpen(false)
    context.setShowCargaMasivaSuccess(true)
    
    // Ocultar la notificación después de 5 segundos
    setTimeout(() => {
      context.setShowCargaMasivaSuccess(false)
    }, 5000)
  }

  // Función para manejar el éxito de la carga PILA
  const handlePILASuccess = () => {
    context.fetchPersonas()
    context.setIsPILAOpen(false)
    context.setShowPILASuccess(true)
    
    // Ocultar la notificación después de 5 segundos
    setTimeout(() => {
      context.setShowPILASuccess(false)
    }, 5000)
  }

  // Función para mostrar el diálogo de terminar solicitud
  const handleShowTerminarDialog = () => {
    context.setShowTerminarDialog(true)
  }

  return {
    ...context,
    handleLogout,
    handleOpenDialog,
    handleOpenCargaMasiva,
    handleOpenPILA,
    handleEditPersona,
    handleEditVehiculo,
    handleCloseDialog,
    handleCargaMasivaSuccess,
    handlePILASuccess,
    handleShowTerminarDialog,
  }
}