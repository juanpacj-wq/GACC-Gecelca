// app/dashboard/providers/DashboardProvider.tsx
"use client"

import { ReactNode, useState, useEffect } from "react"
import { DashboardContext } from "../contexts/DashboardContext"
import { PersonaRegistro, VehiculoRegistro, TipoIngreso } from "../types"
import { fetchFromApi } from "@/lib/api-tokens"

interface DashboardProviderProps {
  children: ReactNode
  idSolicitud: string
}

export function DashboardProvider({ children, idSolicitud }: DashboardProviderProps) {
  // Estados principales
  const [tipoIngreso, setTipoIngreso] = useState<TipoIngreso>("persona")
  const [idPersona, setIdPersona] = useState<string>("")
  const [idVehiculo, setIdVehiculo] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  
  // Estados para los datos
  const [personas, setPersonas] = useState<PersonaRegistro[]>([])
  const [vehiculos, setVehiculos] = useState<VehiculoRegistro[]>([])
  const [solicitudData, setSolicitudData] = useState<any>(null)
  
  // Estados para filtros
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  
  // Estado para la edición
  const [editMode, setEditMode] = useState(false)
  const [currentPersona, setCurrentPersona] = useState<PersonaRegistro | null>(null)
  const [currentVehiculo, setCurrentVehiculo] = useState<VehiculoRegistro | null>(null)
  
  // Estado para el popup de carga masiva
  const [isCargaMasivaOpen, setIsCargaMasivaOpen] = useState(false)
  
  // Estado para el popup de carga PILA (nuevo)
  const [isPILAOpen, setIsPILAOpen] = useState(false)
  
  // Estado para mostrar notificación después de carga masiva
  const [showCargaMasivaSuccess, setShowCargaMasivaSuccess] = useState(false)
  
  // Estado para mostrar notificación después de carga PILA (nuevo)
  const [showPILASuccess, setShowPILASuccess] = useState(false)
  
  // Estados para manejar la terminación de solicitud
  const [isSolicitudTerminada, setIsSolicitudTerminada] = useState(false)
  const [showTerminarDialog, setShowTerminarDialog] = useState(false)
  const [terminandoSolicitud, setTerminandoSolicitud] = useState(false)
  const [fechaTerminacion, setFechaTerminacion] = useState<string>("")

  // Cargar datos de la solicitud
  useEffect(() => {
    if (idSolicitud) {
      fetchSolicitudData(idSolicitud)
    }
  }, [idSolicitud])

  // Cargar datos cuando se tenga el id_solicitud
  useEffect(() => {
    if (idSolicitud) {
      fetchPersonas()
      if (tipoIngreso === "vehiculo") {
        fetchVehiculos()
      }
    }
  }, [idSolicitud, tipoIngreso])

  // Consultar datos de la solicitud
  const fetchSolicitudData = async (id: string) => {
    setLoading(true)
    try {
      // Usar la función centralizada para obtener los datos de la solicitud
      const data = await fetchFromApi<any>('SOLICITUD', { id_solicitud: id });
      
      console.log("Datos de solicitud recibidos:", data);
      setSolicitudData(data);
      
      // Verificar si la solicitud está terminada
      if (data && data.Datos && data.Datos.length > 0) {
        // Usar toLowerCase para hacer la comparación insensible a mayúsculas/minúsculas
        const terminada = data.Datos[0].terminada?.toUpperCase() === "SI";
        console.log("Estado de terminación:", terminada, "Valor original:", data.Datos[0].terminada);
        setIsSolicitudTerminada(terminada);
        
        if (data.Datos[0].FechaTerminacion) {
          const fechaFormateada = formatearFecha(data.Datos[0].FechaTerminacion);
          console.log("Fecha de terminación:", fechaFormateada);
          setFechaTerminacion(fechaFormateada);
        } else if (terminada && data.Datos[0].Modified) {
          // Si está terminada pero no tiene fecha de terminación específica, usar la fecha de modificación
          const fechaFormateada = formatearFecha(data.Datos[0].Modified);
          console.log("Usando fecha de modificación como terminación:", fechaFormateada);
          setFechaTerminacion(fechaFormateada);
        }
      } else {
        // Si no hay datos, establecer como no terminada
        setIsSolicitudTerminada(false);
      }
    } catch (error) {
      console.error("Error al consultar solicitud:", error);
      setError("Error al consultar datos de la solicitud");
      setIsSolicitudTerminada(false); // Por defecto, no terminada en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Funciones para buscar datos
  const fetchPersonas = async () => {
    if (!idSolicitud) return
    
    setLoading(true)
    setError("")
    
    try {
      // Usar la función centralizada para obtener las personas
      const data = await fetchFromApi<any>('PERSONAS', { id_solicitud: idSolicitud });
      
      // Transformar los datos para incluir id_persona
      const personasData = Array.isArray(data) ? data : [data]
      const personasConId = personasData.map((persona: any) => ({
        ...persona,
        id_persona: persona.guid0 || persona.Title || persona.id_persona // Mapear guid0 o Title a id_persona
      }))
      
      setPersonas(personasConId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los datos")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehiculos = async () => {
    if (!idSolicitud) return
    
    setLoading(true)
    setError("")
    
    try {
      // Usar la función centralizada para obtener los vehículos
      const data = await fetchFromApi<any>('VEHICULOS', { id_solicitud: idSolicitud });
      
      // Transformar la respuesta al formato esperado
      const vehiculosData = Array.isArray(data) ? data : [data]
      const vehiculosTransformados: VehiculoRegistro[] = vehiculosData.map((v: any) => ({
        id_vehiculo: v.ID_VEHICULO || '',
        placa: v.PLACA || '-',
        marca: v.MARCA || '-',
        modelo: v.MODELO || '-',
        color: v.COLOR || '-',
        conductores: v.CONDUCTORES || '-'
      }))
      
      setVehiculos(vehiculosTransformados)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los vehículos")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Formatear fecha
  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return '';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-CO') + ' ' + fecha.toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'});
  };

  // Función para terminar la solicitud
  const handleTerminarSolicitud = async () => {
    if (!idSolicitud || isSolicitudTerminada) return;

    setTerminandoSolicitud(true);
    try {
      // Usar la función centralizada para terminar la solicitud
      await fetchFromApi<any>('TERMINAR_SOLICITUD', { id_solicitud: idSolicitud });

      // Actualizar estado local inmediatamente
      const fechaActual = formatearFecha(new Date().toISOString());
      console.log("Actualizando estado a terminada:", fechaActual);
      
      setIsSolicitudTerminada(true);
      setFechaTerminacion(fechaActual);
      setShowTerminarDialog(false);

      // Mostrar notificación de éxito
      alert("Solicitud terminada correctamente");

      // Refrescar datos
      fetchSolicitudData(idSolicitud);
    } catch (error) {
      console.error("Error al terminar solicitud:", error);
      alert("Error al terminar la solicitud. Por favor intente nuevamente.");
    } finally {
      setTerminandoSolicitud(false);
    }
  }

  const handleRefresh = () => {
    if (tipoIngreso === "persona") {
      fetchPersonas()
    } else {
      fetchVehiculos()
    }
    // Refrescar también los datos de la solicitud
    fetchSolicitudData(idSolicitud);
  }

  return (
    <DashboardContext.Provider value={{
      tipoIngreso,
      setTipoIngreso,
      idSolicitud,
      idPersona,
      setIdPersona,
      idVehiculo,
      setIdVehiculo,
      loading,
      error,
      isDialogOpen,
      setIsDialogOpen,
      activeTab,
      setActiveTab,
      personas,
      vehiculos,
      solicitudData,
      filtroNombre,
      setFiltroNombre,
      filtroEstado,
      setFiltroEstado,
      editMode,
      setEditMode,
      currentPersona,
      setCurrentPersona,
      currentVehiculo,
      setCurrentVehiculo,
      isCargaMasivaOpen,
      setIsCargaMasivaOpen,
      isPILAOpen,
      setIsPILAOpen,
      showCargaMasivaSuccess,
      setShowCargaMasivaSuccess,
      showPILASuccess,
      setShowPILASuccess,
      isSolicitudTerminada,
      showTerminarDialog,
      setShowTerminarDialog,
      terminandoSolicitud,
      fechaTerminacion,
      handleTerminarSolicitud,
      handleRefresh,
      fetchPersonas,
      fetchVehiculos,
      fetchSolicitudData
    }}>
      {children}
    </DashboardContext.Provider>
  )
}