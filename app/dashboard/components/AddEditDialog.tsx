// app/dashboard/components/AddEditDialog.tsx
"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PersonaForm from "../modules/personas/PersonaForm"
import PersonaDocumentos from "../modules/personas/PersonaDocumentos"
import PersonaNovedades from "../modules/personas/PersonaNovedades"
import VehiculoForm from "../modules/vehiculos/VehiculoForm"
import VehiculoDocumentos from "../modules/vehiculos/VehiculoDocumentos"
import { useDashboardData } from "../hooks/useDashboardData"

export default function AddEditDialog() {
  const {
    tipoIngreso,
    idSolicitud,
    idPersona,
    setIdPersona,
    idVehiculo,
    setIdVehiculo,
    isDialogOpen,
    setIsDialogOpen,
    activeTab,
    setActiveTab,
    editMode,
    currentPersona,
    currentVehiculo,
    personas,
    fetchPersonas,
    fetchVehiculos,
    handleCloseDialog
  } = useDashboardData()

  
  return (
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
          }
          // No mostrar novedades para vehículos
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
                onSetTab={setActiveTab}
                onSetPersonaId={setIdPersona}
              />
            ) : (
              <VehiculoForm 
                idSolicitud={idSolicitud}
                idVehiculo={idVehiculo}
                vehiculoData={currentVehiculo}
                isEdit={editMode}
                onSuccess={fetchVehiculos}
                onClose={handleCloseDialog}
                onSetTab={setActiveTab}
                onSetVehiculoId={setIdVehiculo}
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
                  isEdit={editMode} // Pasar el modo de edición
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
                  isEdit={editMode} // Pasar el modo de edición
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
  )
}