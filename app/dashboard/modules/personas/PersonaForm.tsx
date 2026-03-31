// app/dashboard/modules/personas/PersonaForm.tsx
"use client"

import { useState, useEffect } from "react"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar, XCircle, CheckCircle } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PersonaFormData, PersonaRegistro } from "../../types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// Importar la función fetchFromApi
import { fetchFromApi } from "@/lib/api-tokens"

interface PersonaFormProps {
 idSolicitud: string;
 idPersona?: string;
 personaData?: PersonaRegistro | null;
 isEdit?: boolean;
 onSuccess: () => void;
 onClose: () => void;
 onSetTab: (tab: string) => void;
 onSetPersonaId: (id: string) => void;
}

export default function PersonaForm({ 
 idSolicitud, 
 idPersona = "",
 personaData = null,
 isEdit = false,
 onSuccess, 
 onClose, 
 onSetTab,
 onSetPersonaId
}: PersonaFormProps) {
 // Estado para el formulario
 const [formData, setFormData] = useState<PersonaFormData>({
   nombre: '',
   apellidos: '',
   cedula: '',
   correo: '',
   cargo: '',
   arl: '',
   eps: '',
   afp: '',
   certificadoConfinados: '',
   certificadoAltura: '',
   conceptoAltura: '',
   conceptoIngreso: '',
   lugarNacimiento: '',
   lugarResidencia: '',
   genero: '',
   fechaNacimiento: ''
 });

 // Estado para opciones de NA en campos de fecha
 const [usarNA, setUsarNA] = useState({
   certificadoConfinados: false,
   certificadoAltura: false,
   conceptoAltura: false,
   conceptoIngreso: false
 });

 // Estados para manejar el proceso
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
 const [showConfirmation, setShowConfirmation] = useState(false);

 // Cargar datos si estamos en modo edición
 useEffect(() => {
   if (isEdit && personaData) {
     const certConfNA = personaData.CERTIFICADOESPACIOSCONFINADO === "NA";
     const certAltNA = personaData.CERTIFICADO_TRABAJO_EN_ALTURA === "NA";
     const concAltNA = personaData.CONCEPTO_MEDICO_PARA_TRABAJO_EN_ === "NA";
     const concIngNA = personaData.CONCEPTO_APTITUD_MEDICO_INGRESO_ === "NA";
     
     setFormData({
       nombre: personaData.Nombre || '',
       apellidos: personaData.Apellidos || '',
       cedula: personaData.C_x002e_C || '',
       correo: personaData.Correo || '',
       cargo: personaData.Cargo || '',
       arl: personaData.ARL || '',
       eps: personaData.EPS || '',
       afp: personaData.AFP || '',
       certificadoConfinados: certConfNA ? '' : formatDateForInput(personaData.CERTIFICADOESPACIOSCONFINADO),
       certificadoAltura: certAltNA ? '' : formatDateForInput(personaData.CERTIFICADO_TRABAJO_EN_ALTURA),
       conceptoAltura: concAltNA ? '' : formatDateForInput(personaData.CONCEPTO_MEDICO_PARA_TRABAJO_EN_),
       conceptoIngreso: concIngNA ? '' : formatDateForInput(personaData.CONCEPTO_APTITUD_MEDICO_INGRESO_),
       lugarNacimiento: personaData.LugarNacimiento || '',
       lugarResidencia: personaData.LugarResidencia || '',
       genero: personaData.Genero || '',
       fechaNacimiento: formatDateForInput(personaData.FechaNacimiento)
     });
     
     setUsarNA({
       certificadoConfinados: certConfNA,
       certificadoAltura: certAltNA,
       conceptoAltura: concAltNA,
       conceptoIngreso: concIngNA
     });
     
     if (idPersona) {
       onSetPersonaId(idPersona);
     } else if (personaData.id_persona) {
       onSetPersonaId(personaData.id_persona);
     } else if (personaData.Title) {
       onSetPersonaId(personaData.Title);
     }
   }
 }, [isEdit, personaData, idPersona, onSetPersonaId]);

 // Normaliza fechas al formato YYYY-MM-DD requerido por input[type="date"]
 const formatDateForInput = (dateStr: string | undefined): string => {
   if (!dateStr || dateStr === 'NA') return '';
   if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
   if (dateStr.includes('T')) return dateStr.split('T')[0];
   const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr);
   if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
   return dateStr;
 };

 // Manejador de cambios en el formulario
 const handlePersonaChange = (field: string, value: string) => {
   setFormData(prev => ({
     ...prev,
     [field]: value
   }));
   
   // Limpiar error de validación cuando se ingresa un valor
   if (formErrors[field]) {
     setFormErrors(prev => {
       const newErrors = {...prev};
       delete newErrors[field];
       return newErrors;
     });
   }
 };
 
 // Manejador para alternar NA en campos de fecha
 const handleToggleNA = (field: string) => {
   setUsarNA(prev => {
     const newState = {
       ...prev,
       [field]: !prev[field as keyof typeof prev]
     };
     
     // Si se activa NA, limpiar el campo de fecha
     if (newState[field as keyof typeof newState]) {
       setFormData(prevData => ({
         ...prevData,
         [field]: ''
       }));
     }
     
     return newState;
   });
   
   // Limpiar error de validación
   if (formErrors[field]) {
     setFormErrors(prev => {
       const newErrors = {...prev};
       delete newErrors[field];
       return newErrors;
     });
   }
 };

 // Validar el formulario
 const validateForm = () => {
   const newErrors: {[key: string]: string} = {};
   
   // Validar campos obligatorios
   if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
   if (!formData.apellidos.trim()) newErrors.apellidos = "Los apellidos son obligatorios";
   if (!formData.cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
   if (!formData.correo.trim()) newErrors.correo = "El correo es obligatorio";
   if (!formData.cargo.trim()) newErrors.cargo = "El cargo es obligatorio";
   if (!formData.arl.trim()) newErrors.arl = "La ARL es obligatoria";
   if (!formData.eps.trim()) newErrors.eps = "La EPS es obligatoria";
   if (!formData.afp.trim()) newErrors.afp = "La AFP es obligatoria";
   if (!formData.lugarNacimiento.trim()) newErrors.lugarNacimiento = "El lugar de nacimiento es obligatorio";
   if (!formData.lugarResidencia.trim()) newErrors.lugarResidencia = "El lugar de residencia es obligatorio";
   if (!formData.genero) newErrors.genero = "El género es obligatorio";
   if (!formData.fechaNacimiento) newErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria";

   // Validar campos de fecha o NA
   if (!usarNA.certificadoConfinados && !formData.certificadoConfinados) {
     newErrors.certificadoConfinados = "Seleccione una fecha o marque NA";
   }
   
   if (!usarNA.certificadoAltura && !formData.certificadoAltura) {
     newErrors.certificadoAltura = "Seleccione una fecha o marque NA";
   }
   
   if (!usarNA.conceptoAltura && !formData.conceptoAltura) {
     newErrors.conceptoAltura = "Seleccione una fecha o marque NA";
   }
   
   if (!usarNA.conceptoIngreso && !formData.conceptoIngreso) {
     newErrors.conceptoIngreso = "Seleccione una fecha o marque NA";
   }
   
   // Validar formato de correo electrónico
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (formData.correo && !emailRegex.test(formData.correo)) {
     newErrors.correo = "El formato de correo electrónico no es válido";
   }
   
   setFormErrors(newErrors);
   return Object.keys(newErrors).length === 0;
 };

 // Mostrar diálogo de confirmación
 const handleGuardarPersona = () => {
   if (validateForm()) {
     setShowConfirmation(true);
   } else {
     // Mostrar mensaje de error general
     setError("Por favor complete todos los campos obligatorios correctamente");
   }
 };

 // Enviar datos del formulario
 const handleConfirmRegistrarPersona = async () => {
   // En modo edición, usar el idPersona existente; en creación, generar uno nuevo
   let personaId: string;
   
   if (isEdit && idPersona) {
     // En modo edición, mantener el ID existente
     personaId = idPersona;
   } else {
     // En modo creación, generar un nuevo ID
     personaId = crypto.randomUUID();
   }
   
   console.log(`ID de persona en modo ${isEdit ? 'edición' : 'creación'}: ${personaId}`);
  
   const personaDataToSend = {
     id_solicitud: idSolicitud,
     id_persona: personaId, // Usar el ID correcto
     cedula: formData.cedula,
     nombre: formData.nombre,
     apellido: formData.apellidos,
     correo: formData.correo,
     cargo: formData.cargo,
     estado_actividad: "ACTIVO",
     arl: formData.arl,
     eps: formData.eps,
     afp: formData.afp,
     cert_espacios_conf: usarNA.certificadoConfinados ? "NA" : formData.certificadoConfinados,
     cert_trab_alt: usarNA.certificadoAltura ? "NA" : formData.certificadoAltura,
     conc_med_trab_alt: usarNA.conceptoAltura ? "NA" : formData.conceptoAltura,
     conc_med_ingreso: usarNA.conceptoIngreso ? "NA" : formData.conceptoIngreso,
     lugar_nacimiento: formData.lugarNacimiento,
     lugar_residencia: formData.lugarResidencia,
     genero: formData.genero,
     fecha_nacimiento: formData.fechaNacimiento
   };

   try {
     setLoading(true);
     
     // Usar la función fetchFromApi en lugar de fetch directo
     await fetchFromApi('REGISTER_PERSONA', personaDataToSend);

     console.log(`✅ Persona ${isEdit ? 'actualizada' : 'registrada'}`);
     console.log(`📌 ID de persona utilizado: ${personaId}`);
     
     // Guardar el ID de la persona para usarlo en la carga de archivos
     onSetPersonaId(personaId);
     
     // Limpiar formulario solo si no estamos en modo edición
     if (!isEdit) {
       setFormData({
         nombre: '',
         apellidos: '',
         cedula: '',
         correo: '',
         cargo: '',
         arl: '',
         eps: '',
         afp: '',
         certificadoConfinados: '',
         certificadoAltura: '',
         conceptoAltura: '',
         conceptoIngreso: '',
         lugarNacimiento: '',
         lugarResidencia: '',
         genero: '',
         fechaNacimiento: ''
       });
       
       setUsarNA({
         certificadoConfinados: false,
         certificadoAltura: false,
         conceptoAltura: false,
         conceptoIngreso: false
       });
     }
     
     setShowConfirmation(false); // Cerrar diálogo de confirmación
     onSuccess(); // Notificar al componente padre
     
     // Cambiar a la pestaña de adjuntos
     onSetTab("adjuntos");
   } catch (error) {
     console.error("❌ Error al registrar persona:", error);
     setError(error instanceof Error ? error.message : "Error al registrar persona");
   } finally {
     setLoading(false);
   }
 };

 return (
   <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
     <DialogHeader className="pb-2">
       <DialogTitle>{isEdit ? 'Editar información personal' : 'Información personal'}</DialogTitle>
     </DialogHeader>
     
     {error && (
       <Alert className="mt-2 bg-red-50 border-red-200 text-red-700">
         <XCircle className="h-4 w-4 text-red-600" />
         <AlertDescription>
           {error}
         </AlertDescription>
       </Alert>
     )}
     
     <div className="space-y-3 mt-2 px-3">
       {/* Fila 1: Nombre, Apellidos, Cédula */}
       <div className="grid grid-cols-3 gap-3">
         <div>
           <Label htmlFor="nombre" className="text-xs">* Nombre</Label>
           <Input 
             id="nombre" 
             placeholder="Ej. JADER MANUEL" 
             value={formData.nombre}
             onChange={(e) => handlePersonaChange('nombre', e.target.value)}
             className={`h-8 text-sm ${formErrors.nombre ? 'border-red-500' : ''}`}
           />
           {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
         </div>
         <div>
           <Label htmlFor="apellidos" className="text-xs">* Apellidos</Label>
           <Input 
             id="apellidos" 
             value={formData.apellidos}
             onChange={(e) => handlePersonaChange('apellidos', e.target.value)}
             className={`h-8 text-sm ${formErrors.apellidos ? 'border-red-500' : ''}`}
           />
           {formErrors.apellidos && <p className="text-xs text-red-500 mt-1">{formErrors.apellidos}</p>}
         </div>
         <div>
           <Label htmlFor="cedula" className="text-xs">* Cédula</Label>
           <Input 
             id="cedula" 
             placeholder="Ej. 123456789" 
             value={formData.cedula}
             onChange={(e) => handlePersonaChange('cedula', e.target.value)}
             className={`h-8 text-sm ${formErrors.cedula ? 'border-red-500' : ''}`}
           />
           {formErrors.cedula && <p className="text-xs text-red-500 mt-1">{formErrors.cedula}</p>}
         </div>
       </div>

       {/* Fila 2: Correo y Cargo */}
       <div className="grid grid-cols-2 gap-3">
         <div>
           <Label htmlFor="correo" className="text-xs">* Correo</Label>
           <Input 
             id="correo" 
             placeholder="Ej. persona@empresa.com" 
             value={formData.correo}
             onChange={(e) => handlePersonaChange('correo', e.target.value)}
             className={`h-8 text-sm ${formErrors.correo ? 'border-red-500' : ''}`}
           />
           {formErrors.correo && <p className="text-xs text-red-500 mt-1">{formErrors.correo}</p>}
         </div>
         <div>
           <Label htmlFor="cargo" className="text-xs">* Cargo</Label>
           <Input 
             id="cargo" 
             placeholder="Ej. ALBAÑIL" 
             value={formData.cargo}
             onChange={(e) => handlePersonaChange('cargo', e.target.value)}
             className={`h-8 text-sm ${formErrors.cargo ? 'border-red-500' : ''}`}
           />
           {formErrors.cargo && <p className="text-xs text-red-500 mt-1">{formErrors.cargo}</p>}
         </div>
       </div>

       {/* Fila 3: ARL, EPS, AFP */}
       <div className="grid grid-cols-3 gap-3">
         <div>
           <Label htmlFor="arl" className="text-xs">* ARL</Label>
           <Input 
             id="arl" 
             placeholder="Ej. SURA" 
             value={formData.arl}
             onChange={(e) => handlePersonaChange('arl', e.target.value)}
             className={`h-8 text-sm ${formErrors.arl ? 'border-red-500' : ''}`}
           />
           {formErrors.arl && <p className="text-xs text-red-500 mt-1">{formErrors.arl}</p>}
         </div>
         <div>
           <Label htmlFor="eps" className="text-xs">* EPS</Label>
           <Input 
             id="eps" 
             value={formData.eps}
             onChange={(e) => handlePersonaChange('eps', e.target.value)}
             className={`h-8 text-sm ${formErrors.eps ? 'border-red-500' : ''}`}
           />
           {formErrors.eps && <p className="text-xs text-red-500 mt-1">{formErrors.eps}</p>}
         </div>
         <div>
           <Label htmlFor="afp" className="text-xs">* AFP</Label>
           <Input 
             id="afp" 
             value={formData.afp}
             onChange={(e) => handlePersonaChange('afp', e.target.value)}
             className={`h-8 text-sm ${formErrors.afp ? 'border-red-500' : ''}`}
           />
           {formErrors.afp && <p className="text-xs text-red-500 mt-1">{formErrors.afp}</p>}
         </div>
       </div>

       {/* Fila 4: Lugar de nacimiento, Lugar de residencia, Género, Fecha de nacimiento */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="lugar-nacimiento" className="text-xs">* Lugar de nacimiento</Label>
          <Input
            id="lugar-nacimiento"
            placeholder="Ej. Bogotá"
            value={formData.lugarNacimiento}
            onChange={(e) => handlePersonaChange('lugarNacimiento', e.target.value)}
            className={`h-8 text-sm ${formErrors.lugarNacimiento ? 'border-red-500' : ''}`}
          />
          {formErrors.lugarNacimiento && <p className="text-xs text-red-500 mt-1">{formErrors.lugarNacimiento}</p>}
        </div>
        <div>
          <Label htmlFor="lugar-residencia" className="text-xs">* Lugar de residencia</Label>
          <Input
            id="lugar-residencia"
            placeholder="Ej. Medellín"
            value={formData.lugarResidencia}
            onChange={(e) => handlePersonaChange('lugarResidencia', e.target.value)}
            className={`h-8 text-sm ${formErrors.lugarResidencia ? 'border-red-500' : ''}`}
          />
          {formErrors.lugarResidencia && <p className="text-xs text-red-500 mt-1">{formErrors.lugarResidencia}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="genero" className="text-xs">* Género</Label>
          <Select value={formData.genero} onValueChange={(value) => handlePersonaChange('genero', value)}>
            <SelectTrigger id="genero" className={`h-8 text-sm ${formErrors.genero ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MASCULINO">Masculino</SelectItem>
              <SelectItem value="FEMENINO">Femenino</SelectItem>
              <SelectItem value="OTRO">Otro</SelectItem>
            </SelectContent>
          </Select>
          {formErrors.genero && <p className="text-xs text-red-500 mt-1">{formErrors.genero}</p>}
        </div>
        <div>
          <Label htmlFor="fecha-nacimiento" className="text-xs">* Fecha de nacimiento</Label>
          <Input
            id="fecha-nacimiento"
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => handlePersonaChange('fechaNacimiento', e.target.value)}
            className={`h-8 text-sm w-full ${formErrors.fechaNacimiento ? 'border-red-500' : ''}`}
          />
          {formErrors.fechaNacimiento && <p className="text-xs text-red-500 mt-1">{formErrors.fechaNacimiento}</p>}
        </div>
      </div>

      {/* Fila 5: Certificados con opción NA */}
       <div className="grid grid-cols-2 gap-3">
         <div>
           <div className="flex justify-between items-center">
             <Label htmlFor="certificado-confinados" className="text-xs">* Certificado espacios confinados</Label>
             <Button
               type="button"
               variant="ghost"
               size="sm"
               onClick={() => handleToggleNA('certificadoConfinados')}
               className={`h-6 text-xs ${usarNA.certificadoConfinados ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
             >
               {usarNA.certificadoConfinados ? (
                 <><CheckCircle className="w-3 h-3 mr-1" /> NA</>
               ) : (
                 'Marcar NA'
               )}
             </Button>
           </div>
           <div className="relative">
             <Input 
               id="certificado-confinados" 
               type="date"
               value={formData.certificadoConfinados}
               onChange={(e) => handlePersonaChange('certificadoConfinados', e.target.value)}
               className={`h-8 text-sm w-full ${formErrors.certificadoConfinados ? 'border-red-500' : ''}`}
               disabled={usarNA.certificadoConfinados}
             />
           </div>
           {formErrors.certificadoConfinados && <p className="text-xs text-red-500 mt-1">{formErrors.certificadoConfinados}</p>}
         </div>
         <div>
           <div className="flex justify-between items-center">
             <Label htmlFor="certificado-altura" className="text-xs">* Certificado trabajo en altura</Label>
             <Button
               type="button"
               variant="ghost"
               size="sm"
               onClick={() => handleToggleNA('certificadoAltura')}
               className={`h-6 text-xs ${usarNA.certificadoAltura ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
             >
               {usarNA.certificadoAltura ? (
                 <><CheckCircle className="w-3 h-3 mr-1" /> NA</>
               ) : (
                 'Marcar NA'
               )}
             </Button>
           </div>
           <div className="relative">
             <Input 
               id="certificado-altura" 
               type="date"
               value={formData.certificadoAltura}
               onChange={(e) => handlePersonaChange('certificadoAltura', e.target.value)}
               className={`h-8 text-sm w-full ${formErrors.certificadoAltura ? 'border-red-500' : ''}`}
               disabled={usarNA.certificadoAltura}
             />
           </div>
           {formErrors.certificadoAltura && <p className="text-xs text-red-500 mt-1">{formErrors.certificadoAltura}</p>}
         </div>
       </div>

       {/* Fila 5: Conceptos médicos con opción NA */}
       <div className="grid grid-cols-2 gap-3">
         <div>
           <div className="flex justify-between items-center">
             <Label htmlFor="concepto-altura" className="text-xs">* Concepto médico trabajo en altura</Label>
             <Button
               type="button"
               variant="ghost"
               size="sm"
               onClick={() => handleToggleNA('conceptoAltura')}
               className={`h-6 text-xs ${usarNA.conceptoAltura ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
             >
               {usarNA.conceptoAltura ? (
                 <><CheckCircle className="w-3 h-3 mr-1" /> NA</>
               ) : (
                 'Marcar NA'
               )}
             </Button>
           </div>
           <div className="relative">
             <Input 
               id="concepto-altura" 
               type="date"
               value={formData.conceptoAltura}
               onChange={(e) => handlePersonaChange('conceptoAltura', e.target.value)}
               className={`h-8 text-sm w-full ${formErrors.conceptoAltura ? 'border-red-500' : ''}`}
               disabled={usarNA.conceptoAltura}
             />
           </div>
           {formErrors.conceptoAltura && <p className="text-xs text-red-500 mt-1">{formErrors.conceptoAltura}</p>}
         </div>
         <div>
           <div className="flex justify-between items-center">
             <Label htmlFor="concepto-ingreso" className="text-xs">* Concepto médico ingreso/periódico</Label>
             <Button
               type="button"
               variant="ghost"
               size="sm"
               onClick={() => handleToggleNA('conceptoIngreso')}
               className={`h-6 text-xs ${usarNA.conceptoIngreso ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}
             >
               {usarNA.conceptoIngreso ? (
                 <><CheckCircle className="w-3 h-3 mr-1" /> NA</>
               ) : (
                 'Marcar NA'
               )}
             </Button>
           </div>
           <div className="relative">
             <Input 
               id="concepto-ingreso" 
               type="date"
               value={formData.conceptoIngreso}
               onChange={(e) => handlePersonaChange('conceptoIngreso', e.target.value)}
               className={`h-8 text-sm w-full ${formErrors.conceptoIngreso ? 'border-red-500' : ''}`}
               disabled={usarNA.conceptoIngreso}
             />
           </div>
           {formErrors.conceptoIngreso && <p className="text-xs text-red-500 mt-1">{formErrors.conceptoIngreso}</p>}
         </div>
       </div>
     </div>

     <div className="flex justify-end mt-4 pt-2 border-t px-3">
       <Button 
         onClick={handleGuardarPersona}
         className="bg-green-600 hover:bg-green-700 text-white font-medium h-8 px-4 text-sm"
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
             Se {isEdit ? 'actualizará' : 'enviará'} la información de la persona a la base de datos. Esta acción no se puede deshacer.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel>No, editar datos</AlertDialogCancel>
           <AlertDialogAction 
             onClick={handleConfirmRegistrarPersona}
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