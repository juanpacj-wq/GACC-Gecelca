// app/dashboard/modules/personas/PersonaNovedades.tsx
"use client"

import { useState } from "react"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar, AlertTriangle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { fetchFromApi } from "@/lib/api-tokens"

interface PersonaNovedadesProps {
  idSolicitud: string;
  idPersona: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PersonaNovedades({ 
  idSolicitud, 
  idPersona,
  onClose,
  onSuccess
}: PersonaNovedadesProps) {
  // Estados para el formulario
  const [novedad, setNovedad] = useState<string>("ACTIVO");
  const [observaciones, setObservaciones] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState<string>("");
  
  // Estados para manejo del proceso
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error'; texto: string} | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  // Tipos de novedades disponibles
  const TIPOS_NOVEDAD = ["ACTIVO", "VACACIONES", "LICENCIA", "TERMINACIÓN DE CONTRATO"];
  
  // Validar que se pueden enviar los datos
  const isValid = () => {
    if (!novedad) return false;
    
    // Si la novedad es diferente a ACTIVO, se requieren fechas
    if (novedad !== "ACTIVO") {
      if (!fechaInicio || !fechaFin) return false;
      
      // Validar que la fecha fin sea mayor o igual a la fecha inicio
      if (new Date(fechaFin) < new Date(fechaInicio)) return false;
    }
    
    return true;
  };
  
  // Mostrar diálogo de confirmación
  const handleReportarNovedad = () => {
    if (!isValid()) {
      setMensaje({
        tipo: 'error',
        texto: 'Por favor complete todos los campos correctamente'
      });
      return;
    }
    
    setShowConfirmation(true);
  };
  
  // Enviar novedad
  const handleConfirmReportarNovedad = async () => {
    setLoading(true);
    setMensaje(null);
    
    try {
      // Preparar datos para la API
      const datos = {
        id_solicitud: idSolicitud,
        id_persona: idPersona,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || fechaInicio, // Si no hay fecha fin, usar fecha inicio
        novedad: novedad,
        observaciones: observaciones
      };
      
      // Log para depuración
      console.log("📝 Enviando novedad:", datos);
      
      // Usar la función centralizada para enviar la novedad
      await fetchFromApi<any>('NOVEDAD_PERSONA', datos);
      
      console.log("✅ Novedad reportada correctamente");
      
      setMensaje({
        tipo: 'success',
        texto: 'Novedad reportada correctamente'
      });
      
      // Cerrar diálogo de confirmación
      setShowConfirmation(false);
      
      // Notificar al componente padre
      onSuccess();
      
      // Resetear formulario
      setNovedad("ACTIVO");
      setObservaciones("");
      setFechaInicio(new Date().toISOString().split('T')[0]);
      setFechaFin("");
      
      // Esperar un momento para mostrar el mensaje de éxito
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("❌ Error al reportar novedad:", error);
      
      // Mensaje específico para errores comunes
      let errorMessage = "Error al reportar la novedad. ";
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage += "La solicitud tomó demasiado tiempo. ";
        } else if (error.message.includes('502')) {
          errorMessage += "El servidor no está disponible en este momento. ";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Ocurrió un error inesperado.";
      }
      
      // Sugerir acción según el número de intentos
      if (retryAttempt < 2) {
        errorMessage += "Puede intentar nuevamente.";
      } else {
        errorMessage += "Por favor, inténtelo más tarde o contacte al administrador.";
      }
      
      setMensaje({
        tipo: 'error',
        texto: errorMessage
      });
      
      setRetryAttempt(prev => prev + 1);
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
      <DialogHeader className="pb-2">
        <DialogTitle>Novedades de personal</DialogTitle>
      </DialogHeader>
      
      <div className="mt-3 space-y-4">
        {/* Selector de novedad */}
        <div>
          <Label htmlFor="novedad" className="text-xs">* NOVEDAD</Label>
          <Select value={novedad} onValueChange={setNovedad}>
            <SelectTrigger id="novedad" className="w-full h-8 text-sm">
              <SelectValue placeholder="Seleccione tipo de novedad" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_NOVEDAD.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Fechas (mostrar solo si no es ACTIVO) */}
        {novedad !== "ACTIVO" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fecha-inicio" className="text-xs">* FECHA INICIO</Label>
              <div className="relative">
                <input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="fecha-fin" className="text-xs">* FECHA FIN</Label>
              <div className="relative">
                <input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  min={fechaInicio} // No permitir fechas anteriores a la fecha inicio
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
              </div>
            </div>
          </div>
        )}
        
        {/* Observaciones */}
        <div>
          <Label htmlFor="observaciones" className="text-xs">OBSERVACIONES</Label>
          <Textarea 
            id="observaciones"
            placeholder="Ingrese observaciones adicionales"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="min-h-[100px] text-sm"
          />
        </div>
        
        {/* Mensaje de resultado */}
        {mensaje && (
          <Alert className={`py-2 ${
            mensaje.tipo === 'success' ? 'bg-green-50 border-green-200' : 
            'bg-red-50 border-red-200'
          }`}>
            <AlertTriangle className={`h-4 w-4 ${
              mensaje.tipo === 'success' ? 'text-green-600' : 'text-red-600'
            }`} />
            <AlertDescription className={`text-sm ${
              mensaje.tipo === 'success' ? 'text-green-700' : 
              'text-red-700'
            }`}>
              {mensaje.texto}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-end pt-3 border-t mt-2">
          <Button 
            onClick={handleReportarNovedad}
            className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-sm"
            disabled={loading || !isValid()}
          >
            Reportar Novedad
          </Button>
        </div>
      </div>
      
      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar reporte de novedad</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de reportar la novedad "{novedad}" para esta persona?
              {novedad !== "ACTIVO" && fechaInicio && fechaFin && (
                <span className="block mt-2">
                  Esta novedad estará activa desde el {new Date(fechaInicio).toLocaleDateString()} 
                  hasta el {new Date(fechaFin).toLocaleDateString()}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReportarNovedad}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}