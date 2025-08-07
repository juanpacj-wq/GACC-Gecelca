// app/dashboard/modules/layout/Header.tsx
"use client"

import { Loader2, Users, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TipoIngreso } from "../../types"
import { useState, useEffect } from "react"

interface HeaderProps {
  tipoIngreso: TipoIngreso;
  loading: boolean;
  onRefresh: () => void;
  onOpenDialog: () => void;
  idSolicitud?: string;
  solicitudData?: any; // Añadimos esta prop para recibir los datos de la solicitud
}

export default function Header({ 
  tipoIngreso, 
  loading, 
  onRefresh, 
  onOpenDialog,
  idSolicitud,
  solicitudData
}: HeaderProps) {
  // Estado para almacenar la información formateada de la solicitud
  const [infoSolicitud, setInfoSolicitud] = useState<{
    planta: string;
    empresa: string;
    epps: string;
    fechaInicio: string;
    fechaFin: string;
  }>({
    planta: "N/A",
    empresa: "N/A",
    epps: "N/A",
    fechaInicio: "",
    fechaFin: ""
  });

  // Formatear fecha ISO a formato local
  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return '';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-CO');
  };

  // Actualizar la información cuando cambian los datos de la solicitud
  useEffect(() => {
    if (solicitudData && solicitudData.Datos && solicitudData.Datos.length > 0) {
      const datos = solicitudData.Datos[0];
      setInfoSolicitud({
        planta: datos.Planta?.Value || "N/A",
        empresa: datos.Empresa || "N/A",
        epps: datos.epps_requeridos || "N/A",
        fechaInicio: formatearFecha(datos.Fechainicio),
        fechaFin: formatearFecha(datos.Fechafin)
      });
    }
  }, [solicitudData]);

  // Verificar si la solicitud está terminada
  const isSolicitudTerminada = solicitudData?.Datos?.[0]?.Terminada === "SI";

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3 -mt-4">
      <div className="flex items-start gap-4 pb-0">
        <div className="flex flex-col min-w-[180px] mt-4">
          <span className="text-xs text-gray-500">Nueva solicitud de ingreso a planta</span>
          <div className="flex items-center gap-2 mt-1">
            {tipoIngreso === "persona" ? (
              <>
                <Users className="w-12 h-12 text-gray-600" />
                <span className="text-4xl font-bold text-gray-600">Personas</span>
              </>
            ) : (
              <>
                <Car className="w-12 h-12 text-gray-600" />
                <span className="text-4xl font-bold text-gray-600">Vehículos</span>
              </>
            )}
          </div>
        </div>
        
        <div className="border-l border-gray-300 h-auto mx-2 -mr-6" />
        
        <div className="flex-1 text-sm text-gray-700 leading-relaxed">
          <div className="max-w-[580px]">
            Usted está realizando una solicitud de ingreso a planta <span className="font-semibold text-blue-600">{infoSolicitud.planta}</span> para visitantes de la empresa <span className="font-semibold text-blue-600">{infoSolicitud.empresa}</span>. Los EPPS necesarios para la labor son: <span className="font-semibold text-blue-600">{infoSolicitud.epps}</span>, y serán suministrados por la empresa visitante.
            <div className="mt-2 flex gap-6">
              <div>
                <span className="font-semibold">Inicio del Ingreso:</span> {infoSolicitud.fechaInicio}
              </div>
              <div>
                <span className="font-semibold">Fin del Ingreso:</span> {infoSolicitud.fechaFin}
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-end">
            <div className="flex gap-8 text-sm">
              {/* Espacio para metadatos adicionales si se necesitan */}
            </div>
            
            <div className="flex gap-2 -mt-36">
              <Button 
                onClick={onRefresh}
                variant="outline"
                disabled={loading}
                className="border-gray-300 h-8 px-3 text-xs"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar tabla"
                )}
              </Button>
              
              <Button
                onClick={onOpenDialog}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm h-8 px-3 text-xs"
                size="sm"
                disabled={isSolicitudTerminada}
              >
                {tipoIngreso === "persona" ? "Agregar persona" : "Agregar vehículo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar resumen de registros
export function RegistrosSummary({
  tipoIngreso,
  count,
  idSolicitud
}: {
  tipoIngreso: TipoIngreso;
  count: number;
  idSolicitud?: string;
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {tipoIngreso === "persona" ? (
          <Users className="w-4 h-4 text-blue-600" />
        ) : (
          <Car className="w-4 h-4 text-blue-600" />
        )}
        <span className="text-xs font-medium text-blue-900">
          Total de {tipoIngreso === "persona" ? "personas" : "vehículos"} registrados: 
          <span className="text-sm font-bold ml-1">
            {count}
          </span>
        </span>
      </div>
      {idSolicitud && (
        <span className="text-xs text-blue-600">
          Solicitud: {idSolicitud}
        </span>
      )}
    </div>
  )
}