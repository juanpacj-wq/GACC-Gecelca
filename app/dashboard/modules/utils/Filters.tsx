// app/dashboard/modules/utils/Filters.tsx
"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TipoIngreso } from "../../types"

interface FiltersProps {
  tipoIngreso: TipoIngreso;
  filtroNombre: string;
  setFiltroNombre: (value: string) => void;
  filtroEstado: string;
  setFiltroEstado: (value: string) => void;
}

export default function Filters({
  tipoIngreso,
  filtroNombre,
  setFiltroNombre,
  filtroEstado,
  setFiltroEstado
}: FiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-2 mb-2">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Label htmlFor="buscar" className="text-xs mb-0.5">
            {tipoIngreso === "persona" 
              ? "Buscar por nombre o apellido" 
              : "Buscar por placa o marca"}
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              id="buscar"
              type="text"
              placeholder="Buscar..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Solo mostrar el filtro de estado para personas */}
        {tipoIngreso === "persona" && (
          <div className="w-40">
            <Label htmlFor="estado" className="text-xs mb-0.5">Filtrar por estado</Label>
            <select
              id="estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="TERMINACIÓN DE CONTRATO">Terminado</option>
              <option value="LICENCIA">Licencia</option>
              <option value="VACACIONES">Vacaciones</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}