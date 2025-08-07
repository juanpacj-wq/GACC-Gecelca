// app/dashboard/modules/vehiculos/VehiculoForm.tsx
"use client"

import { useState, useEffect } from "react"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
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
import { VehiculoFormData, VehiculoRegistro, PersonaRegistro } from "../../types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchFromApi } from "@/lib/api-tokens"

interface VehiculoFormProps {
 idSolicitud: string;
 idVehiculo?: string;
 vehiculoData?: VehiculoRegistro | null;
 isEdit?: boolean;
 onSuccess: () => void;
 onClose: () => void;
 onSetTab?: (tab: string) => void;
 onSetVehiculoId?: (id: string) => void;
 personas?: PersonaRegistro[]; // Añadimos esta prop para recibir las personas
}

export default function VehiculoForm({ 
 idSolicitud,
 idVehiculo = "",
 vehiculoData = null,
 isEdit = false,
 onSuccess, 
 onClose,
 onSetTab,
 onSetVehiculoId,
 personas = [] // Valor por defecto
}: VehiculoFormProps) {
 // Estado para el formulario
 const [formData, setFormData] = useState<VehiculoFormData>({
   placa: '',
   marca: '',
   modelo: '',
   color: '',
   conductores: ''
 });

 // Estados para manejar el proceso
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [showConfirmation, setShowConfirmation] = useState(false);
 
 // Estado para los conductores seleccionados
 const [selectedConductores, setSelectedConductores] = useState<string[]>([]);

 // Cargar datos si estamos en modo edición
 useEffect(() => {
   if (isEdit && vehiculoData) {
     setFormData({
       placa: vehiculoData.placa || '',
       marca: vehiculoData.marca || '',
       modelo: vehiculoData.modelo || '',
       color: vehiculoData.color || '',
       conductores: vehiculoData.conductores || ''
     });
     
     // Si hay conductores, los convertimos a array para el multiselect
     if (vehiculoData.conductores) {
       setSelectedConductores(vehiculoData.conductores.split(';').map(c => c.trim()));
     }
     
     // Si tenemos un idVehiculo, lo usamos para establecer el ID
     if (idVehiculo && onSetVehiculoId) {
       onSetVehiculoId(idVehiculo);
     }
   }
 }, [isEdit, vehiculoData, idVehiculo, onSetVehiculoId]);

 // Manejador de cambios en el formulario
 const handleVehiculoChange = (field: string, value: string) => {
   setFormData(prev => ({
     ...prev,
     [field]: value
   }));
 };

 // Manejador para seleccionar/deseleccionar conductor
 const toggleConductor = (nombreCompleto: string) => {
   setSelectedConductores(prev => {
     if (prev.includes(nombreCompleto)) {
       // Si ya está seleccionado, lo quitamos
       const filtered = prev.filter(c => c !== nombreCompleto);
       // Actualizamos el campo conductores en el formData
       setFormData(prevData => ({
         ...prevData,
         conductores: filtered.join('; ')
       }));
       return filtered;
     } else {
       // Si no está seleccionado, lo añadimos
       const updated = [...prev, nombreCompleto];
       // Actualizamos el campo conductores en el formData
       setFormData(prevData => ({
         ...prevData,
         conductores: updated.join('; ')
       }));
       return updated;
     }
   });
 };

 // Remover un conductor seleccionado
 const removeConductor = (nombreCompleto: string) => {
   setSelectedConductores(prev => {
     const updated = prev.filter(c => c !== nombreCompleto);
     // Actualizamos el campo conductores en el formData
     setFormData(prevData => ({
       ...prevData,
       conductores: updated.join('; ')
     }));
     return updated;
   });
 };

 // Mostrar diálogo de confirmación
 const handleGuardarVehiculo = () => {
   setShowConfirmation(true);
 };

 // Enviar datos del formulario
 const handleConfirmRegistrarVehiculo = async () => {
   // Generar un nuevo ID sólo si no estamos en modo edición
   const vehiculoId = isEdit && idVehiculo ? idVehiculo : crypto.randomUUID();
   
   // Asegurarnos de que el campo conductores tiene el formato correcto
   const conductoresFormatted = selectedConductores.join('; ');
   
   const vehiculoDataToSend = {
     id_solicitud: idSolicitud,
     id_vehiculo: vehiculoId,
     placa: formData.placa,
     marca: formData.marca,
     modelo: formData.modelo,
     color: formData.color,
     conductores: conductoresFormatted
   };

   try {
     setLoading(true);
     
     // Usar la función centralizada fetchFromApi
     const result = await fetchFromApi<any>('REGISTER_VEHICULO', vehiculoDataToSend);

     console.log(`✅ Vehículo ${isEdit ? 'actualizado' : 'registrado'}:`, result);
     
     // Guardar el ID del vehículo para usarlo en la carga de archivos
     if (onSetVehiculoId) {
       onSetVehiculoId(vehiculoId);
     }
     
     // Limpiar formulario solo si no estamos en modo edición
     if (!isEdit) {
       setFormData({
         placa: '',
         marca: '',
         modelo: '',
         color: '',
         conductores: ''
       });
       setSelectedConductores([]);
     }
     
     setShowConfirmation(false); // Cerrar diálogo de confirmación
     onSuccess(); // Notificar al componente padre
     
     // Cambiar a la pestaña de adjuntos si está disponible
     if (onSetTab) {
       onSetTab("adjuntos");
     } else {
       onClose(); // Cerrar el diálogo principal
     }
     
   } catch (error) {
     console.error(`❌ Error al ${isEdit ? 'actualizar' : 'registrar'} vehículo:`, error);
     setError(error instanceof Error ? error.message : `Error al ${isEdit ? 'actualizar' : 'registrar'} vehículo`);
   } finally {
     setLoading(false);
   }
 };

 // Verificar si hay personas para seleccionar como conductores
 const hasPersonas = personas && personas.length > 0;

 return (
   <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
     <DialogHeader className="pb-2">
       <DialogTitle>{isEdit ? 'Editar información del vehículo' : 'Información del vehículo'}</DialogTitle>
     </DialogHeader>
     
     <div className="space-y-3 mt-2 mx-4">
       {/* Fila 1: Placa y Marca */}
       <div className="grid grid-cols-2 gap-3">
         <div>
           <Label htmlFor="placa" className="text-xs">* PLACA (Ejemplo: ACB-123)</Label>
           <Input 
             id="placa" 
             placeholder="ACB-123" 
             value={formData.placa}
             onChange={(e) => handleVehiculoChange('placa', e.target.value)}
             className="h-8 text-sm"
           />
         </div>
         <div>
           <Label htmlFor="marca" className="text-xs">* MARCA</Label>
           <Input 
             id="marca" 
             placeholder="Ej. Toyota, Chevrolet" 
             value={formData.marca}
             onChange={(e) => handleVehiculoChange('marca', e.target.value)}
             className="h-8 text-sm"
           />
         </div>
       </div>

       {/* Fila 2: Modelo y Color */}
       <div className="grid grid-cols-2 gap-3">
         <div>
           <Label htmlFor="modelo" className="text-xs">* MODELO</Label>
           <Input 
             id="modelo" 
             placeholder="Ej. Corolla, Spark"
             value={formData.modelo}
             onChange={(e) => handleVehiculoChange('modelo', e.target.value)}
             className="h-8 text-sm"
           />
         </div>
         <div>
           <Label htmlFor="color" className="text-xs">* COLOR</Label>
           <Input 
             id="color" 
             placeholder="Ej. Blanco, Azul"
             value={formData.color}
             onChange={(e) => handleVehiculoChange('color', e.target.value)}
             className="h-8 text-sm"
           />
         </div>
       </div>

       {/* Fila 3: Conductores (Nuevo componente multiselect) */}
       <div>
         <Label htmlFor="conductores" className="text-xs">* CONDUCTORES (seleccionar de la lista)</Label>
         
         {/* Lista de personas seleccionadas como conductores */}
         {selectedConductores.length > 0 && (
           <div className="flex flex-wrap gap-1 mb-2 mt-1">
             {selectedConductores.map((conductor, idx) => (
               <div 
                 key={idx} 
                 className="flex items-center bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs"
               >
                 <span>{conductor}</span>
                 <button 
                   type="button" 
                   onClick={() => removeConductor(conductor)}
                   className="ml-1 text-blue-500 hover:text-blue-700"
                 >
                   <X className="h-3 w-3" />
                 </button>
               </div>
             ))}
           </div>
         )}
         
         {/* Selector de conductores */}
         <Select
           value="placeholder" // Valor por defecto que no debe estar vacío
           onValueChange={(value) => {
             if (value && value !== "placeholder") toggleConductor(value);
           }}
         >
           <SelectTrigger className="w-full h-8 text-sm">
             <SelectValue placeholder="Seleccionar conductores" />
           </SelectTrigger>
           <SelectContent>
             {/* Agregamos un item placeholder */}
             <SelectItem value="placeholder" disabled>Seleccione conductor</SelectItem>
             
             {hasPersonas ? (
               personas.map((persona, idx) => {
                 // Crear nombre completo para mostrar
                 const nombreCompleto = `${persona.Nombre || ''} ${persona.Apellidos || ''}`.trim();
                 // Si el nombre está vacío (caso improbable), usar un placeholder
                 const personaValue = nombreCompleto || `persona-${idx}`;
                 // Verificar si ya está seleccionado
                 const isSelected = selectedConductores.includes(nombreCompleto);
                 
                 // Solo mostrar si hay un nombre válido
                 if (nombreCompleto) {
                   return (
                     <SelectItem 
                       key={idx} 
                       value={personaValue}
                       disabled={isSelected}
                       className={isSelected ? "opacity-50" : ""}
                     >
                       {nombreCompleto} {isSelected && "(Seleccionado)"}
                     </SelectItem>
                   );
                 }
                 return null;
               })
             ) : (
               <SelectItem value="no-personas-disponibles">
                 No hay personas registradas
               </SelectItem>
             )}
           </SelectContent>
         </Select>
         
         <p className="text-xs text-gray-500 mt-1">
           Seleccione las personas que conducirán el vehículo. Debe agregar al menos un conductor.
         </p>
       </div>

       {/* Mostrar error si existe */}
       {error && (
         <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
           {error}
         </div>
       )}
     </div>

     <div className="flex justify-end mt-4 mr-4 pt-2 border-t">
       <Button 
         onClick={handleGuardarVehiculo}
         className="bg-green-600 hover:bg-green-700 text-white font-medium h-8 px-4 text-sm"
         disabled={!formData.placa || !formData.marca || !formData.modelo || !formData.color || selectedConductores.length === 0}
       >
         {isEdit ? 'Actualizar y continuar' : 'Guardar y continuar'}
       </Button>
     </div>

     {/* Diálogo de confirmación */}
     <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
           <AlertDialogDescription>
             Se {isEdit ? 'actualizará' : 'enviará'} la información del vehículo a la base de datos. Esta acción no se puede deshacer.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel>No, editar datos</AlertDialogCancel>
           <AlertDialogAction 
             onClick={handleConfirmRegistrarVehiculo}
             className="bg-green-600 hover:bg-green-700"
             disabled={loading}
           >
             {loading ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Enviando...
               </>
             ) : (
               `Sí, ${isEdit ? 'actualizar' : 'enviar'} información`
             )}
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   </div>
 )
}