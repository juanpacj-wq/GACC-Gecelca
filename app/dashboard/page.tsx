// app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PersonaRegistro, VehiculoRegistro, VehiculoResponse, TipoIngreso } from "./types"
import { FileSpreadsheet, Loader2, LogOut } from "lucide-react" 
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
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
import { useAuth } from "@/contexts/AuthContext"
import { fetchFromApi } from "@/lib/api-tokens"

// Importando los componentes modulares
import Sidebar from "./modules/layout/Sidebar"
import Header, { RegistrosSummary } from "./modules/layout/Header"
import Filters from "./modules/utils/Filters"
import PersonaTable from "./modules/personas/PersonaTable"
import PersonaForm from "./modules/personas/PersonaForm"
import PersonaDocumentos from "./modules/personas/PersonaDocumentos"
import VehiculoTable from "./modules/vehiculos/VehiculoTable"
import VehiculoForm from "./modules/vehiculos/VehiculoForm"
import VehiculoDocumentos from "./modules/vehiculos/VehiculoDocumentos"
import PersonaMasiva from "./modules/personas/PersonaMasiva"
import PersonaNovedades from "./modules/personas/PersonaNovedades"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading, logout: authLogout } = useAuth()
  
  // Estados principales
  const [tipoIngreso, setTipoIngreso] = useState<TipoIngreso>("persona")
  const [idSolicitud, setIdSolicitud] = useState<string>("")
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
  
  // Nuevo estado para el popup de carga masiva
  const [isCargaMasivaOpen, setIsCargaMasivaOpen] = useState(false)
  
  // Nuevo estado para mostrar notificación después de carga masiva
  const [showCargaMasivaSuccess, setShowCargaMasivaSuccess] = useState(false)
  
  // Estados para manejar la terminación de solicitud
  const [isSolicitudTerminada, setIsSolicitudTerminada] = useState(false)
  const [showTerminarDialog, setShowTerminarDialog] = useState(false)
  const [terminandoSolicitud, setTerminandoSolicitud] = useState(false)
  const [fechaTerminacion, setFechaTerminacion] = useState<string>("")

  // Verificar autenticación
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])
  
  // Obtener el id_solicitud de los query parameters
  useEffect(() => {
    const solicitudParam = searchParams.get("solicitud")
    if (solicitudParam) {
      setIdSolicitud(solicitudParam)
      fetchSolicitudData(solicitudParam)
    } else if (!isLoading && isAuthenticated) {
      // Si no hay parámetro y el usuario está autenticado, redirigir a la página de código
      router.push("/code")
    }
  }, [searchParams, router, isLoading, isAuthenticated])

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
      const vehiculosTransformados: VehiculoRegistro[] = vehiculosData.map((v: VehiculoResponse) => ({
        id_vehiculo: v.ID_VEHICULO || '',
        placa: v.PLACA || '-',
        marca: v.MARCA || '-',
        modelo: v.MODELO || '-',
        color: v.COLOR || '-',
        conductores: v.CONDUCTORES || '-'
        // Se elimina el campo estado
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

  // Manejadores de eventos
  const handleLogout = () => {
    authLogout();
    router.push("/")
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

  const handleOpenDialog = () => {
    setEditMode(false)
    setCurrentPersona(null)
    setCurrentVehiculo(null)
    setIdPersona("") // Resetear el ID de persona al abrir el diálogo
    setIdVehiculo("") // Resetear el ID de vehículo al abrir el diálogo
    setActiveTab("general")
    setIsDialogOpen(true)
  }

  // Manejador para abrir el diálogo de carga masiva
  const handleOpenCargaMasiva = () => {
    setIsCargaMasivaOpen(true)
  }

  // Manejador para editar una persona
  const handleEditPersona = (persona: PersonaRegistro) => {
    setEditMode(true)
    setCurrentPersona(persona)
    // Usar el id_persona si está disponible, o guid0, o Title como fallback
    if (persona.id_persona) {
      setIdPersona(persona.id_persona)
    } else if (persona.Title) {
      setIdPersona(persona.Title)
    }
    setActiveTab("general")
    setIsDialogOpen(true)
  }

  // Manejador para editar un vehículo
  const handleEditVehiculo = (vehiculo: VehiculoRegistro) => {
    setEditMode(true)
    setCurrentVehiculo(vehiculo)
    if (vehiculo.id_vehiculo) {
      setIdVehiculo(vehiculo.id_vehiculo)
    }
    setActiveTab("general")
    setIsDialogOpen(true)
  }

  // Manejador para cambiar de pestaña
  const handleSetTab = (tab: string) => {
    setActiveTab(tab)
  }

  // Manejador para guardar el ID de la persona registrada
  const handleSetPersonaId = (id: string) => {
    setIdPersona(id)
  }

  // Manejador para guardar el ID del vehículo registrado
  const handleSetVehiculoId = (id: string) => {
    setIdVehiculo(id)
  }

  // Función para limpiar el formulario después de cerrar el diálogo
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditMode(false)
    setCurrentPersona(null)
    setCurrentVehiculo(null)
    setIdPersona("")
    setIdVehiculo("")
  }

  // Función para manejar el éxito de la carga masiva
  const handleCargaMasivaSuccess = () => {
    fetchPersonas();
    setIsCargaMasivaOpen(false);
    setShowCargaMasivaSuccess(true);
    
    // Ocultar la notificación después de 5 segundos
    setTimeout(() => {
      setShowCargaMasivaSuccess(false);
    }, 5000);
  }

  // Función para mostrar el diálogo de terminar solicitud
  const handleShowTerminarDialog = () => {
    setShowTerminarDialog(true);
  }

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

  // Asegurarnos de que tenemos personas cargadas para el combobox de conductores
  useEffect(() => {
    if (tipoIngreso === "vehiculo" && isDialogOpen && personas.length === 0) {
      fetchPersonas()
    }
  }, [tipoIngreso, isDialogOpen])

  // Si está cargando la autenticación, mostrar un indicador de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-gradient-to-r from-green-600 to-blue-600">
        {/* Sidebar */}
        <Sidebar 
          tipoIngreso={tipoIngreso} 
          setTipoIngreso={setTipoIngreso} 
          onLogout={handleLogout} 
        />

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 p-4 overflow-hidden -mt-1">
          <div className="max-w-7xl mx-auto mt-0">
            {/* Encabezado */}
            <Header 
              tipoIngreso={tipoIngreso}
              loading={loading}
              onRefresh={handleRefresh}
              onOpenDialog={handleOpenDialog}
              idSolicitud={idSolicitud}
              solicitudData={solicitudData}
            />

            {/* Notificación de carga masiva exitosa */}
            {showCargaMasivaSuccess && (
              <Alert className="bg-green-50 border-green-200 mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Cargue masivo realizado correctamente. Para ver las personas cargadas debes esperar unos minutos.
                </AlertDescription>
              </Alert>
            )}

            {/* Contador de registros */}
            {!loading && ((tipoIngreso === "persona" && personas.length > 0) || 
                         (tipoIngreso === "vehiculo" && vehiculos.length > 0)) && (
              <RegistrosSummary 
                tipoIngreso={tipoIngreso} 
                count={tipoIngreso === "persona" ? personas.length : vehiculos.length}
                idSolicitud={idSolicitud}
              />
            )}

            {/* Filtros - Se condiciona para mostrar filtro de estado solo en persona */}
            <Filters 
              tipoIngreso={tipoIngreso}
              filtroNombre={filtroNombre}
              setFiltroNombre={setFiltroNombre}
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
            />

            {/* Mensaje de error */}
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 mb-2">
                <p className="font-medium text-sm">Error al cargar los datos</p>
                <p className="text-xs">{error}</p>
              </div>
            )}

         {/* Contenedor con altura fija para la tabla */}
          <div className="max-h-[calc(100vh-330px)] overflow-hidden">
            {/* Tabla correspondiente según el tipo de ingreso */}
            {tipoIngreso === "persona" ? (
              <PersonaTable 
                personas={personas}
                loading={loading}
                filtroNombre={filtroNombre}
                filtroEstado={filtroEstado}
                onEdit={handleEditPersona}
              />
            ) : (
              <VehiculoTable 
                vehiculos={vehiculos}
                loading={loading}
                filtroNombre={filtroNombre}
                onEdit={handleEditVehiculo}
              />
            )}
          </div>


            {/* Footer: botón a la izq. y texto a la der. + botón de carga masiva */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Botón de carga masiva - solo visible en la sección de personas */}
                {tipoIngreso === "persona" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs flex items-center gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={handleOpenCargaMasiva}
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    Carga masiva
                  </Button>
                )}
                <span className="text-xs text-gray-600">
                  {isSolicitudTerminada ? 
                    `La solicitud fue marcada como terminada el ${fechaTerminacion}` : 
                    "La solicitud está activa"}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleShowTerminarDialog}
                disabled={isSolicitudTerminada || loading}
              >
                {isSolicitudTerminada ? "Solicitud terminada" : "Terminar solicitud"}
              </Button>
            </div>
          </div>
        </main>
      </div>
      
      {/* Diálogo para agregar o editar persona o vehículo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header con título */}
          <div className="flex justify-between items-center -mt-2 -mb-2">
            <h2 className="text-4xl font-bold">
              {editMode 
                ? `${tipoIngreso === "persona" ? "Editar Persona" : "Editar Vehículo"}`
                : `${tipoIngreso === "persona" ? "Agregar Persona" : "Agregar Vehículo"}`
              }
            </h2>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => {
            // Validar que exista un ID antes de permitir cambiar a la pestaña de adjuntos o novedades
            if (value === "adjuntos" || value === "novedades") {
              if ((tipoIngreso === "persona" && !idPersona) || 
                  (tipoIngreso === "vehiculo" && !idVehiculo)) {
                // Si no hay ID, mantener la pestaña actual
                return;
              }
            } // No mostrar novedades para vehículos
            if (value === "novedades" && tipoIngreso === "vehiculo") {
              return;
            }
            setActiveTab(value);
          }} className="w-full">
            <TabsList className={`grid w-full ${tipoIngreso === "persona" && editMode ? "grid-cols-3" : "grid-cols-2"}`}>
              <TabsTrigger value="general">
                {tipoIngreso === "persona" ? "Información Personal" : "Información del Vehículo"}
              </TabsTrigger>
              
              <TabsTrigger 
                value="adjuntos" 
                disabled={(tipoIngreso === "persona" && !idPersona) || 
                        (tipoIngreso === "vehiculo" && !idVehiculo)}
                className={((tipoIngreso === "persona" && !idPersona) || 
                         (tipoIngreso === "vehiculo" && !idVehiculo)) ? 
                         "opacity-50 cursor-not-allowed" : ""}
              >
                Adjuntos
              </TabsTrigger>
              
              {/* Nueva pestaña de novedades (solo visible para edición de personas) */}
              {tipoIngreso === "persona" && editMode && (
                <TabsTrigger 
                  value="novedades" 
                  disabled={!idPersona}
                  className={!idPersona ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Novedades
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* TAB GENERAL */}
            <TabsContent value="general" className="mt-2">
              {tipoIngreso === "persona" ? (
                <PersonaForm 
                  idSolicitud={idSolicitud}
                  idPersona={idPersona}
                  personaData={currentPersona}
                  isEdit={editMode}
                  onSuccess={fetchPersonas}
                  onClose={handleCloseDialog}
                  onSetTab={handleSetTab}
                  onSetPersonaId={handleSetPersonaId}
                />
              ) : (
                <VehiculoForm 
                  idSolicitud={idSolicitud}
                  idVehiculo={idVehiculo}
                  vehiculoData={currentVehiculo}
                  isEdit={editMode}
                  onSuccess={fetchVehiculos}
                  onClose={handleCloseDialog}
                  onSetTab={handleSetTab}
                  onSetVehiculoId={handleSetVehiculoId}
                  personas={personas} // Pasar las personas registradas
                />
              )}
            </TabsContent>
            
            {/* TAB ADJUNTOS */}
            <TabsContent value="adjuntos" className="mt-2">
              {tipoIngreso === "persona" ? (
                idPersona ? (
                  <PersonaDocumentos
                    idSolicitud={idSolicitud}
                    idPersona={idPersona}
                    onClose={() => setIsDialogOpen(false)}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Primero debe registrar la información básica de la persona
                    </p>
                  </div>
                )
              ) : (
                idVehiculo ? (
                  <VehiculoDocumentos
                    idSolicitud={idSolicitud}
                    idVehiculo={idVehiculo}
                    onClose={() => setIsDialogOpen(false)}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Primero debe registrar la información básica del vehículo
                    </p>
                  </div>
                )
              )}
            </TabsContent>
            <TabsContent value="novedades" className="mt-2">
              {tipoIngreso === "persona" && idPersona ? (
                <PersonaNovedades
                  idSolicitud={idSolicitud}
                  idPersona={idPersona}
                  onClose={() => setIsDialogOpen(false)}
                  onSuccess={fetchPersonas}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Esta sección solo está disponible para edición de personas
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para carga masiva de personas */}
      <Dialog open={isCargaMasivaOpen} onOpenChange={setIsCargaMasivaOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <PersonaMasiva 
            idSolicitud={idSolicitud}
            onClose={() => setIsCargaMasivaOpen(false)}
            onSuccess={handleCargaMasivaSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar terminación de solicitud */}
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
    </TooltipProvider>
  )
}