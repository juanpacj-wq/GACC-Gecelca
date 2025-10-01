// app/dashboard/hooks/useDashboardData.ts
"use client"

import { useRouter } from "next/navigation"
import { useDashboard } from "../contexts/DashboardContext"
import { useAuth } from "@/contexts/AuthContext"
import { PersonaRegistro, VehiculoRegistro } from "../types"
import { fetchFromApi } from "@/lib/api-tokens"

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

  // Manejador para abrir el diálogo de notificación de cambios
  const handleOpenNotificacion = () => {
    context.setIsNotificacionOpen(true);
  };

  // Manejador para editar una persona
  const handleEditPersona = async (persona: PersonaRegistro) => {
    context.setEditMode(true);
    context.setActiveTab("general");
    context.setIsDialogOpen(true);
    context.setLoading(true);

    try {
      const personaId = persona.id_persona || persona.guid0 || persona.Title;
      if (personaId) {
        const fullPersonaData = await fetchFromApi<PersonaRegistro>('PERSONAS', {
          id_solicitud: context.idSolicitud,
          id_persona: personaId
        });
        context.setCurrentPersona(fullPersonaData);
        context.setIdPersona(personaId);
      } else {
        throw new Error("No se pudo encontrar un ID único para la persona.");
      }
    } catch (error) {
      console.error("Error fetching full persona data:", error);
      // Fallback to the partial data from the table if the fetch fails
      context.setCurrentPersona(persona);
      const personaId = persona.id_persona || persona.guid0 || persona.Title;
      if (personaId) {
        context.setIdPersona(personaId);
      }
    } finally {
      context.setLoading(false);
    }
  };

  // Manejador para editar un vehículo
  const handleEditVehiculo = async (vehiculo: VehiculoRegistro) => {
    context.setEditMode(true);
    context.setActiveTab("general");
    context.setIsDialogOpen(true);
    context.setLoading(true);
    try {
      if (vehiculo.id_vehiculo) {
        const fullVehiculoData = await fetchFromApi<VehiculoRegistro>('VEHICULOS', {
          id_solicitud: context.idSolicitud,
          id_vehiculo: vehiculo.id_vehiculo
        });
        context.setCurrentVehiculo(fullVehiculoData);
        context.setIdVehiculo(vehiculo.id_vehiculo);
      } else {
        throw new Error("No se pudo encontrar un ID único para el vehículo.");
      }
    } catch (error) {
      console.error("Error fetching full vehiculo data:", error);
      context.setCurrentVehiculo(vehiculo);
      if(vehiculo.id_vehiculo) {
        context.setIdVehiculo(vehiculo.id_vehiculo)
      }
    } finally {
      context.setLoading(false);
    }
  };


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
    handleOpenNotificacion,
    handleEditPersona,
    handleEditVehiculo,
    handleCloseDialog,
    handleCargaMasivaSuccess,
    handlePILASuccess,
    handleShowTerminarDialog,
  }
}