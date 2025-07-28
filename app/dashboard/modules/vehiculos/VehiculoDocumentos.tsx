// app/dashboard/modules/vehiculos/VehiculoDocumentos.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, FileCheck, XCircle, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

interface VehiculoDocumentosProps {
  idSolicitud: string;
  idVehiculo: string;
  onClose: () => void;
}

// Definir documentos obligatorios para vehículo
const DOCUMENTOS_OBLIGATORIOS = ["TARJETA DE PROPIEDAD"];

export default function VehiculoDocumentos({ 
  idSolicitud, 
  idVehiculo,
  onClose 
}: VehiculoDocumentosProps) {
  // Estado para el formulario de documentos
  const [tipoDocumento, setTipoDocumento] = useState<string>("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error' | 'info' | 'warning'; texto: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Estado para documentos subidos
  const [documentosSubidos, setDocumentosSubidos] = useState<{tipo: string; nombre: string}[]>([]);
  
  // Estado para tracking de documentos obligatorios
  const [documentosObligatoriosFaltantes, setDocumentosObligatoriosFaltantes] = useState<string[]>([...DOCUMENTOS_OBLIGATORIOS]);

  // Actualizar documentos faltantes cuando se agregan nuevos documentos
  useEffect(() => {
    const tiposSubidos = documentosSubidos.map(doc => doc.tipo);
    const faltantes = DOCUMENTOS_OBLIGATORIOS.filter(doc => !tiposSubidos.includes(doc));
    setDocumentosObligatoriosFaltantes(faltantes);
  }, [documentosSubidos]);

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  // Manejar envío de documento
  const handleSubirDocumento = async () => {
    // Validaciones
    if (!tipoDocumento) {
      setMensaje({tipo: 'error', texto: 'Por favor seleccione un tipo de documento'});
      return;
    }
    
    if (!archivo) {
      setMensaje({tipo: 'error', texto: 'Por favor seleccione un archivo'});
      return;
    }
    
    // Preparar datos para envío
    setLoading(true);
    setMensaje(null);
    
    try {
      // Convertir archivo a base64
      const base64String = await convertFileToBase64(archivo);
      
      // Preparar datos para la API según la estructura requerida
      const datos = {
        id_solicitud: idSolicitud,
        id_vehiculo: idVehiculo,
        tipo_documento: tipoDocumento,
        archivoNombre: archivo.name,
        archivoBase64: base64String
      };
      
      // Verificar que idVehiculo no esté vacío
      if (!idVehiculo) {
        throw new Error("ID de vehículo no disponible");
      }
      
      // Log para depuración
      console.log("🚗 ID del vehículo:", idVehiculo);
      
      // Enviar a la API usando la función centralizada
      const responseData = await fetchFromApi<any>('UPLOAD_DOCUMENTO', datos);
      
      // Log para debugging
      console.log("📥 Response data:", responseData);
      
      // Agregar documento a la lista de subidos
      setDocumentosSubidos(prev => [...prev, {
        tipo: tipoDocumento,
        nombre: archivo.name
      }]);
      
      // Resetear formulario
      setTipoDocumento("");
      setArchivo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      setMensaje({
        tipo: 'success', 
        texto: `Documento "${tipoDocumento}" subido correctamente`
      });
    } catch (error) {
      console.error("Error al subir documento de vehículo:", error);
      setMensaje({
        tipo: 'error', 
        texto: error instanceof Error ? error.message : 'Error al subir el documento'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar si se pueden finalizar los documentos
  const verificarDocumentosCompletos = () => {
    if (documentosObligatoriosFaltantes.length > 0) {
      setMensaje({
        tipo: 'warning',
        texto: `Faltan documentos obligatorios: ${documentosObligatoriosFaltantes.join(', ')}`
      });
      return false;
    }
    return true;
  };
  
  // Manejar finalización
  const handleFinalizar = () => {
    if (verificarDocumentosCompletos()) {
      setShowConfirmDialog(true);
    }
  };
  
  // Confirmar finalización
  const confirmarFinalizacion = () => {
    setShowConfirmDialog(false);
    onClose();
  };
  
  // Función para convertir archivo a base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Extraer solo la parte base64 sin el prefijo (data:application/pdf;base64,)
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Error al convertir archivo a Base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
      <DialogHeader className="pb-2">
        <DialogTitle>Documentos del vehículo</DialogTitle>
      </DialogHeader>
      
      <div className="mt-3 space-y-3">
        {/* Mensaje de información inicial */}
        <Alert className="bg-blue-50 border-blue-200 py-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 text-sm">
            Por favor suba los documentos requeridos para el vehículo. Los documentos marcados con (*) son obligatorios.
          </AlertDescription>
        </Alert>
        
        {/* Estado de documentos obligatorios */}
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium mb-2">Documentos obligatorios:</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {DOCUMENTOS_OBLIGATORIOS.map((doc) => {
              const isUploaded = !documentosObligatoriosFaltantes.includes(doc);
              return (
                <div key={doc} className="flex items-center">
                  {isUploaded ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-1.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 mr-1.5" />
                  )}
                  <span className={`text-xs ${isUploaded ? 'text-green-700' : 'text-amber-700'}`}>
                    {doc} {!isUploaded && "(*)"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Formulario de carga */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="tipo-documento" className="text-xs">Tipo de documento</Label>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
              <SelectTrigger id="tipo-documento" className="w-full h-8 text-sm">
                <SelectValue placeholder="Seleccione tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENTOS_OBLIGATORIOS.map((doc) => (
                  <SelectItem 
                    key={doc} 
                    value={doc} 
                    className={documentosObligatoriosFaltantes.includes(doc) ? "font-medium" : ""}
                  >
                    {doc} {documentosObligatoriosFaltantes.includes(doc) && "(*)"} 
                  </SelectItem>
                ))}
                <SelectItem value="SOAT">SOAT</SelectItem>
                <SelectItem value="Póliza todo riesgo">Póliza todo riesgo</SelectItem>
                <SelectItem value="RUNT">RUNT</SelectItem>
                <SelectItem value="Revisión técnico mecánica">Revisión técnico mecánica</SelectItem>
                <SelectItem value="Licencia de tránsito">Licencia de tránsito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="archivo" className="text-xs">Seleccionar archivo (.pdf, .jpg, .png)</Label>
            <Input 
              ref={fileInputRef}
              id="archivo" 
              type="file" 
              accept=".pdf,.jpg,.png,.jpeg" 
              onChange={handleFileChange}
              className="h-8 text-sm py-1"
            />
          </div>
        </div>
        
        {/* Botón de carga */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSubirDocumento}
            disabled={loading || !tipoDocumento || !archivo}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 mr-1.5" />
                Subir documento
              </>
            )}
          </Button>
        </div>
        
        {/* Mensaje de resultado */}
        {mensaje && (
          <Alert className={`py-2 ${
            mensaje.tipo === 'success' ? 'bg-green-50 border-green-200' : 
            mensaje.tipo === 'error' ? 'bg-red-50 border-red-200' : 
            mensaje.tipo === 'warning' ? 'bg-amber-50 border-amber-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            {mensaje.tipo === 'success' ? (
              <FileCheck className="h-4 w-4 text-green-600" />
            ) : mensaje.tipo === 'error' ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : mensaje.tipo === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-blue-600" />
            )}
            <AlertDescription className={`text-sm ${
              mensaje.tipo === 'success' ? 'text-green-700' : 
              mensaje.tipo === 'error' ? 'text-red-700' : 
              mensaje.tipo === 'warning' ? 'text-amber-700' :
              'text-blue-700'
            }`}>
              {mensaje.texto}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Lista de documentos subidos */}
        {documentosSubidos.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Documentos subidos:</h3>
            <div className="bg-gray-50 rounded-md p-2 border border-gray-200 max-h-32 overflow-y-auto">
              <ul className="space-y-1">
                {documentosSubidos.map((doc, index) => (
                  <li key={index} className="flex items-center text-xs">
                    <FileCheck className="w-3 h-3 mr-1.5 text-green-600" />
                    <span className="font-medium">{doc.tipo}:</span>
                    <span className="ml-1 text-gray-600 truncate">{doc.nombre}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-between pt-3 border-t mt-4">
          <div className="text-xs text-gray-500">
            {documentosObligatoriosFaltantes.length > 0 
              ? `Faltan ${documentosObligatoriosFaltantes.length} documentos obligatorios` 
              : "Todos los documentos obligatorios han sido cargados"}
          </div>
          <Button 
            onClick={handleFinalizar}
            className={`${
              documentosObligatoriosFaltantes.length === 0 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gray-400 cursor-not-allowed"
            } text-white h-8 px-4 text-sm`}
            disabled={documentosObligatoriosFaltantes.length > 0}
          >
            Finalizar
          </Button>
        </div>
      </div>
      
      {/* Diálogo de confirmación de finalización */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar finalización</AlertDialogTitle>
            <AlertDialogDescription>
              Se han cargado todos los documentos obligatorios. ¿Desea finalizar el proceso?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarFinalizacion}
              className="bg-green-600 hover:bg-green-700"
            >
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}