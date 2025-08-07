// app/dashboard/modules/personas/PersonaMasiva.tsx
"use client"

import { useState, useRef } from "react"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Download, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchFromApi } from "@/lib/api-tokens"

interface PersonaMasivaProps {
  idSolicitud: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PersonaMasiva({ 
  idSolicitud, 
  onClose,
  onSuccess
}: PersonaMasivaProps) {
  // Estados para manejar el archivo y la carga
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error' | 'info'; texto: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  
  // URL de la plantilla Excel y API para carga
  const PLANTILLA_URL = "https://docs.google.com/spreadsheets/d/1-UhdVjPmRlbRqEYetB5Oon9RNtnVbe58/edit?usp=sharing&ouid=100763250007424131804&rtpof=true&sd=true";
  // URL para descargar directamente (se debe reemplazar con la URL correcta de descarga directa)
  const PLANTILLA_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1-UhdVjPmRlbRqEYetB5Oon9RNtnVbe58";
  
  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'xls' || fileExt === 'xlsx') {
        setArchivo(file);
      } else {
        setArchivo(null);
        setMensaje({
          tipo: 'error',
          texto: 'Por favor seleccione un archivo Excel válido (.xls o .xlsx)'
        });
      }
    }
  };

  // Función para descargar la plantilla directamente
  const handleDescargarPlantilla = () => {
    // Utilizamos un elemento <a> oculto para forzar la descarga
    if (downloadLinkRef.current) {
      downloadLinkRef.current.click();
    }
  };

  // Convertir archivo a base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Extraer solo la parte base64 sin el prefijo
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Error al convertir archivo a Base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Enviar archivo para carga masiva
  const handleEnviarArchivo = async () => {
    if (!archivo) {
      setMensaje({
        tipo: 'error',
        texto: 'Por favor seleccione un archivo Excel primero'
      });
      return;
    }

    setLoading(true);
    setMensaje(null);

    try {
      // Convertir archivo a base64
      const base64String = await convertFileToBase64(archivo);
      
      // Preparar datos para envío según el formato requerido
      const datos = {
        id_solicitud: idSolicitud,
        archivoNombre: archivo.name,
        archivoBase64: base64String
      };
      
      // Enviar a la API usando la función centralizada
      await fetchFromApi<any>('CARGA_MASIVA', datos);
      
      setMensaje({
        tipo: 'success',
        texto: 'Cargue masivo realizado correctamente. Para ver las personas cargadas debes esperar unos minutos antes de actualizar la tabla.'
      });
      
      // Resetear el formulario
      setArchivo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notificar al componente padre después de un breve delay
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Error al cargar archivo:", error);
      setMensaje({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'Error al cargar el archivo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
      <DialogHeader className="pb-2">
        <DialogTitle>Carga masiva de personas</DialogTitle>
      </DialogHeader>
      
      <div className="mt-4 space-y-4 mx-3">
        {/* Mensaje informativo */}
        <Alert className="bg-blue-50 border-blue-200 py-2">
          <AlertDescription className="text-blue-700 text-sm">
            Utilice esta herramienta para cargar múltiples personas a la vez mediante un archivo Excel.
            Por favor descargue la plantilla, llénela con la información requerida y luego cárguela.
          </AlertDescription>
        </Alert>
        
        {/* Botón para descargar plantilla */}
        <div className="flex justify-center mx-3">
          <Button 
            onClick={handleDescargarPlantilla}
            variant="outline"
            className="flex items-center gap-2 h-10 px-4"
          >
            <Download className="w-4 h-4" />
            <span>Descargar plantilla Excel</span>
          </Button>
          
          {/* Enlace oculto para la descarga directa */}
          <a 
            ref={downloadLinkRef}
            href={PLANTILLA_DOWNLOAD_URL}
            download="Plantilla_Carga_Masiva_Personas.xlsx"
            className="hidden"
          >
            Descargar
          </a>
        </div>
        
        {/* Separador */}
        <div className="relative my-6 mx-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Carga de archivo</span>
          </div>
        </div>
        
        {/* Input para seleccionar archivo */}
        <div className="space-y-2 mx-3">
          <Label htmlFor="excel-file" className="text-sm">Seleccionar archivo Excel</Label>
          <div className="flex items-center gap-2">
            <Input 
              ref={fileInputRef}
              id="excel-file" 
              type="file" 
              accept=".xls,.xlsx" 
              onChange={handleFileChange}
              className="flex-1"
            />
          </div>
        </div>
        
        {/* Información del archivo seleccionado */}
        {archivo && (
          <div className="flex items-center mx-3 gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
            <FileText className="w-4 h-4" />
            <span>Archivo seleccionado: {archivo.name} ({(archivo.size / 1024).toFixed(2)} KB)</span>
          </div>
        )}
        
        {/* Mensaje de estado */}
        {mensaje && (
          <Alert className={`py-2 ${
            mensaje.tipo === 'success' ? 'bg-green-50 border-green-200' : 
            mensaje.tipo === 'error' ? 'bg-red-50 border-red-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            {mensaje.tipo === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : mensaje.tipo === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-blue-600" />
            )}
            <AlertDescription className={`text-sm ${
              mensaje.tipo === 'success' ? 'text-green-700' : 
              mensaje.tipo === 'error' ? 'text-red-700' : 
              'text-blue-700'
            }`}>
              {mensaje.texto}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-2 border-t mt-3 ">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEnviarArchivo}
            disabled={!archivo || loading}
            className="bg-green-600 hover:bg-green-700 text-white h-9"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Cargar archivo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}