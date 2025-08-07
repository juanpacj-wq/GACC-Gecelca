// app/dashboard/modules/personas/PersonaPILA.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2, Calendar, ChevronRight, Clock, Trash2, Download, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchFromApi } from "@/lib/api-tokens"
import type { FechaCorte } from "@/types/pila"

interface PersonaPILAProps {
  idSolicitud: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface DocumentoPILA {
  name: string;
  tipo_adjunto: string;
  content: string;
  fecha_corte: string;
}

export default function PersonaPILA({ 
  idSolicitud, 
  onClose,
  onSuccess
}: PersonaPILAProps) {
  // Estados para manejar el archivo y la carga
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error' | 'info'; texto: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<number | null>(null);
  const [loadingFechas, setLoadingFechas] = useState(true);
  const [fechasCorte, setFechasCorte] = useState<FechaCorte[]>([]);
  const [fechasCargadas, setFechasCargadas] = useState(false);
  
  // Estado para los documentos adjuntos
  const [documentos, setDocumentos] = useState<{[key: number]: DocumentoPILA | null}>({});
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);

  // Función para calcular días entre fechas
  const calcularDiasHastaFecha = (fechaStr: string): number => {
    // Parseamos la fecha en formato DD/MM/YYYY
    const [dia, mes, año] = fechaStr.split('/').map(Number);
    const fechaCorte = new Date(año, mes - 1, dia); // mes - 1 porque Date usa 0-11
    const fechaActual = new Date();
    
    // Calculamos la diferencia en milisegundos y convertimos a días
    const diferenciaMilisegundos = fechaCorte.getTime() - fechaActual.getTime();
    const diferenciaDias = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    
    return diferenciaDias;
  };

  // Función para determinar el estado de una fecha
  const determinarEstadoFecha = (fecha: FechaCorte, tieneDocumento: boolean): "success" | "warning" | "normal" => {
    if (tieneDocumento) {
      return "success";
    }
    
    const diasHastaFecha = calcularDiasHastaFecha(fecha.fecha);
    
    if (diasHastaFecha <= 10 ) {
      return "warning";
    }
    
    return "normal";
  };

  // Función para truncar nombres de archivo
  const truncateFileName = (fileName: string, maxLength: number = 20): string => {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop() || '';
    const nameWithoutExt = fileName.substring(0, fileName.length - extension.length - 1);
    
    // Calcular cuántos caracteres podemos usar para el nombre
    const extensionLength = extension.length + 1; // +1 por el punto
    const availableLength = maxLength - 3 - extensionLength; // -3 por los puntos suspensivos
    
    if (availableLength <= 0) {
      // Si el nombre es muy corto, solo mostrar los puntos suspensivos y la extensión
      return `...${extension ? '.' + extension : ''}`;
    }
    
    // Truncar el nombre y agregar puntos suspensivos
    return `${nameWithoutExt.substring(0, availableLength)}...${extension ? '.' + extension : ''}`;
  };
  
  // Cargar fechas de corte al iniciar
  useEffect(() => {
    const cargarFechasCorte = async () => {
      setLoadingFechas(true);
      try {
        // Llamar a la API para obtener las fechas de corte
        const response = await fetch(`/api/pila/fechas-corte?id_solicitud=${idSolicitud}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar fechas de corte');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.fechas)) {
          setFechasCorte(data.fechas);
          setFechasCargadas(true);
          
          // Inicializar el mapa de documentos con null para cada fecha
          const docMap: {[key: number]: DocumentoPILA | null} = {};
          data.fechas.forEach((fecha: FechaCorte) => {
            docMap[fecha.id] = null;
          });
          setDocumentos(docMap);
          
          // Cargar documentos para todas las fechas
          await cargarDocumentos(data.fechas);
        } else {
          // Usar fechas predeterminadas si hay un error
          const fechasPredeterminadas: FechaCorte[] = [
            { id: 1, fecha: "04/07/2025", estado: "normal" as "normal", mesTexto: "julio 2025" },
            { id: 2, fecha: "06/08/2025", estado: "normal" as "normal", mesTexto: "agosto 2025" },
            { id: 3, fecha: "04/09/2025", estado: "normal" as "normal", mesTexto: "septiembre 2025" }
          ];
          setFechasCorte(fechasPredeterminadas);
          setFechasCargadas(true);
          
          // Inicializar el mapa de documentos con null para cada fecha predeterminada
          const docMap: {[key: number]: DocumentoPILA | null} = {};
          fechasPredeterminadas.forEach(fecha => {
            docMap[fecha.id] = null;
          });
          setDocumentos(docMap);
          
          // Cargar documentos para las fechas predeterminadas
          await cargarDocumentos(fechasPredeterminadas);
        }
      } catch (error) {
        console.error("Error al cargar fechas de corte:", error);
        setFechasCargadas(false);
        // Fechas predeterminadas en caso de error
        const fechasPredeterminadas: FechaCorte[] = [
          { id: 1, fecha: "04/07/2025", estado: "normal" as "normal", mesTexto: "julio 2025" },
          { id: 2, fecha: "06/08/2025", estado: "normal" as "normal", mesTexto: "agosto 2025" },
          { id: 3, fecha: "04/09/2025", estado: "normal" as "normal", mesTexto: "septiembre 2025" }
        ];
        setFechasCorte(fechasPredeterminadas);
        
        // Inicializar el mapa de documentos con null para cada fecha predeterminada
        const docMap: {[key: number]: DocumentoPILA | null} = {};
        fechasPredeterminadas.forEach(fecha => {
          docMap[fecha.id] = null;
        });
        setDocumentos(docMap);
        
        // Cargar documentos para las fechas predeterminadas
        await cargarDocumentos(fechasPredeterminadas);
        
        setMensaje({
          tipo: 'error',
          texto: 'Error al cargar fechas de corte. Por favor, inténtelo de nuevo más tarde.'
        });
      } finally {
        setLoadingFechas(false);
      }
    };
    
    cargarFechasCorte();
  }, [idSolicitud]);
  
  // Función para cargar documentos de todas las fechas
  const cargarDocumentos = async (fechas: FechaCorte[]) => {
    setLoadingDocumentos(true);
    
    try {
      // Crear un mapa temporal para almacenar los documentos
      const documentosTemp: {[key: number]: DocumentoPILA | null} = {...documentos};
      
      // Cargar documentos para cada fecha
      for (const fecha of fechas) {
        try {
          const response = await fetch(`/api/pila/documentos?id_solicitud=${idSolicitud}&fecha_corte=${fecha.fecha}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.documentos && data.documentos.length > 0) {
              documentosTemp[fecha.id] = data.documentos[0];
            } else {
              documentosTemp[fecha.id] = null;
            }
          } else {
            documentosTemp[fecha.id] = null;
          }
        } catch (error) {
          console.error(`Error al cargar documento para fecha ${fecha.fecha}:`, error);
          documentosTemp[fecha.id] = null;
        }
      }
      
      // Actualizar el estado con todos los documentos cargados
      setDocumentos(documentosTemp);
      
      // Actualizar los estados de las fechas basado en si tienen documentos
      const fechasActualizadas = fechas.map(fecha => ({
        ...fecha,
        estado: determinarEstadoFecha(fecha, !!documentosTemp[fecha.id])
      }));
      
      setFechasCorte(fechasActualizadas);
      
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    } finally {
      setLoadingDocumentos(false);
    }
  };
  
  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'pdf') {
        setArchivo(file);
      } else {
        setArchivo(null);
        setMensaje({
          tipo: 'error',
          texto: 'Por favor seleccione un archivo PDF válido'
        });
      }
    }
  };

  // Función para eliminar el archivo seleccionado
  const handleEliminarArchivo = () => {
    setArchivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Función para seleccionar una fecha predefinida
  const handleSeleccionarFecha = (id: number) => {
    setFechaSeleccionada(id);
  };
  
  // Función para descargar un documento
  const handleDescargarDocumento = (documento: DocumentoPILA) => {
    try {
      // Crear un enlace de descarga con el contenido base64
      const link = document.createElement('a');
      
      // Determinar el tipo MIME basado en la extensión del archivo
      let mimeType = 'application/pdf';
      
      link.href = `data:${mimeType};base64,${documento.content}`;
      link.download = documento.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar documento:", error);
      setMensaje({
        tipo: 'error',
        texto: 'Error al descargar el documento'
      });
    }
  };
  
  // Función para visualizar un documento
  const handleVisualizarDocumento = (documento: DocumentoPILA) => {
    try {
      // Abrir en nueva ventana (para PDF)
      const dataUrl = `data:application/pdf;base64,${documento.content}`;
      window.open(dataUrl, '_blank');
    } catch (error) {
      console.error("Error al visualizar documento:", error);
      setMensaje({
        tipo: 'error',
        texto: 'Error al visualizar el documento'
      });
    }
  };

  // Enviar archivo para carga PILA
  const handleEnviarArchivo = async () => {
    if (!archivo) {
      setMensaje({
        tipo: 'error',
        texto: 'Por favor seleccione un archivo PDF primero'
      });
      return;
    }

    if (fechaSeleccionada === null) {
      setMensaje({
        tipo: 'error',
        texto: 'Por favor seleccione una fecha de corte'
      });
      return;
    }

    setLoading(true);
    setMensaje(null);

    try {
      // Convertir archivo a base64
      const base64String = await convertFileToBase64(archivo);
      
      // Obtener la fecha seleccionada
      const fechaCorte = fechasCorte.find(f => f.id === fechaSeleccionada);
      
      if (!fechaCorte) {
        throw new Error('Fecha de corte no válida');
      }
      
      // Preparar datos para el envío
      const formData = {
        id_solicitud: idSolicitud,
        id_persona: fechaCorte.fecha, // Usar la fecha como id_persona para identificar
        tipo_documento: "PILA",
        archivoNombre: archivo.name,
        archivoBase64: base64String
      };
      
      // Enviar a la API para subir el documento
      const response = await fetch('/api/pila/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el documento');
      }
      
      const responseData = await response.json();
      
      // Actualizar la lista de documentos
      if (responseData.success) {
        // Actualizar el documento en el estado local
        setDocumentos(prev => ({
          ...prev,
          [fechaSeleccionada]: {
            name: archivo.name,
            tipo_adjunto: "PILA",
            content: base64String,
            fecha_corte: fechaCorte.fecha
          }
        }));
        
        // Actualizar el estado de la fecha a "success"
        setFechasCorte(prev => prev.map(fecha => 
          fecha.id === fechaSeleccionada 
            ? { ...fecha, estado: "success" as "success" }
            : fecha
        ));
        
        setMensaje({
          tipo: 'success',
          texto: 'PILA cargado correctamente.'
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
      } else {
        throw new Error(responseData.message || 'Error al procesar la solicitud');
      }
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
  
  // Función para convertir archivo a base64
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

  // Función para obtener el tamaño formateado
  const formatFileSize = (sizeInBytes: number): string => {
    const kb = sizeInBytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    } else {
      return `${(kb / 1024).toFixed(2)} MB`;
    }
  };

  return (
    <div className="max-h-[calc(100vh-100px)] ">
      <DialogHeader className="pb-2">
        <DialogTitle>Cargar PILA</DialogTitle>
      </DialogHeader>
      
      <div className="mt-4 space-y-4 mx-3 ">
        {/* Mensaje informativo */}
        <Alert className="bg-blue-50 border-blue-200 py-2">
          <AlertDescription className="text-blue-700 text-sm">
            Le recordamos llenar correctamente la plantilla antes de cargarla en el aplicativo.
          </AlertDescription>
        </Alert>
        
        {/* Mostrar mensaje cuando hay error en cargar fechas */}
        {!fechasCargadas && !loadingFechas && (
          <Alert className="bg-red-50 border-red-200 py-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 text-sm">
              No se pudieron cargar las fechas de corte. Por favor, inténtelo de nuevo más tarde.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Interfaz de dos columnas */}
        <div className="grid grid-cols-12 gap-4">
          {/* Columna izquierda - Selector de fechas predefinidas */}
          <div className="col-span-5 border rounded-md p-2 h-fit bg-gray-50">
            <h3 className="font-medium mb-2 text-sm flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Fecha de corte
            </h3>
            
            {loadingFechas ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
                {fechasCorte.map((fecha) => (
                  <button
                    key={fecha.id}
                    onClick={() => handleSeleccionarFecha(fecha.id)}
                    className={`flex items-center justify-between w-full px-2 py-1.5 text-xs rounded-md transition-colors ${
                      fechaSeleccionada === fecha.id 
                        ? 'bg-blue-100 text-blue-800 font-medium' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      {fecha.estado === "success" && (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                      )}
                      {fecha.estado === "warning" && (
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                      )}
                      {fecha.estado === "normal" && (
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      )}
                      <span>{fecha.fecha}</span>
                      
                      {/* Indicador de documento existente */}
                      {documentos[fecha.id] && (
                        <FileText className="w-3 h-3 ml-1.5 text-blue-500" />
                      )}
                    </div>
                    {fechaSeleccionada === fecha.id && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
                
                {fechasCorte.length === 0 && (
                  <div className="text-center p-2 text-gray-500 text-xs">
                    No hay fechas de corte disponibles para este periodo
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Columna derecha - Formulario para carga de archivo y visualización de documentos */}
          <div className="col-span-7 space-y-4">
             {/* Mensaje informativo cuando se selecciona una fecha */}
            {fechaSeleccionada !== null && fechasCorte.find(f => f.id === fechaSeleccionada) && (
              <Alert className="bg-green-50 border-green-200 py-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 text-sm font-medium">
                  Fecha de corte seleccionada: <span className="font-bold">{fechasCorte.find(f => f.id === fechaSeleccionada)?.fecha}</span>
                  
                </AlertDescription>
              </Alert>
            )}
            
            {/* Documento existente si hay uno para la fecha seleccionada */}
            {fechaSeleccionada !== null && documentos[fechaSeleccionada] && (
              <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                <h3 className="text-sm font-medium mb-2 text-blue-700">Documento PILA ya cargado:</h3>
                <div className="flex items-center justify-between text-xs bg-white p-2 rounded mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium" title={documentos[fechaSeleccionada]?.name}>
                      {truncateFileName(documentos[fechaSeleccionada]?.name || '', 30)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => documentos[fechaSeleccionada] && handleVisualizarDocumento(documentos[fechaSeleccionada]!)}
                      title="Ver documento"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => documentos[fechaSeleccionada] && handleDescargarDocumento(documentos[fechaSeleccionada]!)}
                      title="Descargar documento"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-blue-600">
                  Puede reemplazar este documento subiendo uno nuevo.
                </p>
              </div>
            )}
            
            {/* Input para seleccionar archivo - solo habilitado si fechasCargadas es true */}
            <div className="space-y-2">
              <Label htmlFor="pila-file" className="text-sm">Adjunte un archivo en formato .pdf</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input 
                    ref={fileInputRef}
                    id="pila-file" 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileChange}
                    className={`w-full ${!fechasCargadas ? 'opacity-50 cursor-not-allowed' : 'opacity-0'} absolute inset-0 ${fechasCargadas ? 'cursor-pointer' : 'cursor-not-allowed'} z-10`}
                    disabled={!fechasCargadas || loadingFechas}
                  />
                  <div className={`w-full border rounded-md px-3 py-2 text-sm flex items-center ${!fechasCargadas || loadingFechas ? 'bg-gray-100' : ''}`}>
                    <span className={`text-gray-500 truncate ${!fechasCargadas || loadingFechas ? 'opacity-50' : ''}`}>
                      {archivo ? truncateFileName(archivo.name, 30) : "Examinar..."}
                    </span>
                  </div>
                </div>
              </div>
              {!fechasCargadas && !loadingFechas && (
                <p className="text-xs text-red-500">
                  No se pueden cargar archivos hasta que se carguen las fechas de corte.
                </p>
              )}
            </div>
            
            {/* Información del archivo seleccionado con botón para eliminar */}
            {archivo && fechasCargadas && (
              <div className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded-md">
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate max-w-[200px]" title={archivo.name}>
                    {truncateFileName(archivo.name, 25)} ({formatFileSize(archivo.size)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleEliminarArchivo}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar archivo</span>
                </Button>
              </div>
            )}
          </div>
        </div>
        
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
        <div className="flex justify-end gap-2 pt-2 border-t mt-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEnviarArchivo}
            disabled={!archivo || fechaSeleccionada === null || loading || !fechasCargadas}
            className={`${fechasCargadas ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white h-9`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Cargar PILA
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}