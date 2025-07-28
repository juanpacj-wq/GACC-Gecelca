"use client";

import { CheckCircle2, XCircle, FileText, Calendar, AlertCircle } from "lucide-react";

export function getEstadoBadge(
  estado: string | undefined,
  estadoActividad: string | undefined
) {
  const isApproved = estado === "APROBADO";

  switch (estadoActividad) {
    case "ACTIVO":
      if (isApproved) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Activo
          </span>
        );
      }
      break;
    case "TERMINACIÓN DE CONTRATO":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          <XCircle className="w-3 h-3" />
          Terminación de contrato
        </span>
      );
    case "LICENCIA":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          <FileText className="w-3 h-3" />
          Licencia
        </span>
      );
    case "VACACIONES":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          <Calendar className="w-3 h-3" />
          Vacaciones
        </span>
      );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Activo
          </span>
  );
}
