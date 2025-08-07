// app/dashboard/components/DashboardContainer.tsx
"use client"

import { useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, FileSpreadsheet, FileUp } from "lucide-react"
import { useDashboardData } from "../hooks/useDashboardData"
import Sidebar from "../modules/layout/Sidebar"
import Header, { RegistrosSummary } from "../modules/layout/Header"
import Filters from "../modules/utils/Filters"
import PersonaTable from "../modules/personas/PersonaTable"
import VehiculoTable from "../modules/vehiculos/VehiculoTable"
import TerminarSolicitudDialog from "./TerminarSolicitudDialog"
import CargaMasivaDialog from "./CargaMasivaDialog"
import CargaPILADialog from "./CargaPILADialog"
import AddEditDialog from "./AddEditDialog"

export default function DashboardContainer() {
  const {
    tipoIngreso,
    setTipoIngreso, // Añadido esta línea para corregir el error
    idSolicitud,
    personas,
    vehiculos,
    solicitudData,
    loading,
    error,
    filtroNombre,
    setFiltroNombre,
    filtroEstado,
    setFiltroEstado,
    showCargaMasivaSuccess,
    showPILASuccess,
    isSolicitudTerminada,
    fechaTerminacion,
    handleLogout,
    handleRefresh,
    handleOpenDialog,
    handleEditPersona,
    handleEditVehiculo,
    handleOpenCargaMasiva,
    handleOpenPILA,
    handleShowTerminarDialog
  } = useDashboardData()

  // Asegurarnos de que tenemos personas cargadas para el combobox de conductores
  useEffect(() => {
    // Esto queda vacío porque el useEffect se maneja ahora en DashboardProvider
  }, [])

  return (
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

          {/* Notificación de carga PILA exitosa */}
          {showPILASuccess && (
            <Alert className="bg-green-50 border-green-200 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                PILA cargado correctamente. La planilla estará disponible una vez finalice el procesamiento.
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
              {/* Botones solo visibles en la sección de personas */}
              {tipoIngreso === "persona" && (
                <>
                  {/* Botón de carga masiva */}
                  <button
                    onClick={handleOpenCargaMasiva}
                    className="h-6 px-2 text-xs flex items-center gap-1 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    Carga masiva
                  </button>
                  
                  {/* Botón de carga PILA (nuevo) */}
                  <button
                    onClick={handleOpenPILA}
                    className="h-6 px-2 text-xs flex items-center gap-1 border border-green-300 rounded-md text-green-700 hover:bg-green-50"
                  >
                    <FileUp className="w-3 h-3" />
                    Cargar PILA
                  </button>
                </>
              )}
              <span className="text-xs text-gray-600">
                {isSolicitudTerminada ? 
                  `La solicitud fue marcada como terminada el ${fechaTerminacion}` : 
                  "La solicitud está activa"}
              </span>
            </div>
            <button
              onClick={handleShowTerminarDialog}
              disabled={isSolicitudTerminada || loading}
              className="h-6 px-2 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSolicitudTerminada ? "Solicitud terminada" : "Terminar solicitud"}
            </button>
          </div>
        </div>
      </main>

      {/* Diálogos */}
      <AddEditDialog />
      <CargaMasivaDialog />
      <CargaPILADialog />
      <TerminarSolicitudDialog />
    </div>
  )
}