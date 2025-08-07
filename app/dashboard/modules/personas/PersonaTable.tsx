// app/dashboard/modules/personas/PersonaTable.tsx
"use client"

import { Loader2, Edit } from "lucide-react"
import { PersonaRegistro } from "../../types"
import { PersonaStatusBadge } from "../utils/StatusBadges"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface PersonaTableProps {
 personas: PersonaRegistro[];
 loading: boolean;
 filtroNombre: string;
 filtroEstado: string;
 onEdit: (persona: PersonaRegistro) => void;
}

export default function PersonaTable({ 
 personas, 
 loading, 
 filtroNombre, 
 filtroEstado,
 onEdit
}: PersonaTableProps) {
 if (loading) {
   return (
     <div className="bg-white rounded-lg shadow-sm overflow-hidden">
       <table className="min-w-full text-sm">
         <thead className="bg-gray-50 text-gray-700 font-medium border-b sticky top-0 h-2">
           <tr>
             <th className="px-4 py-1.5 text-left text-xs">Nombres</th>
             <th className="px-4 py-1.5 text-left text-xs">Apellidos</th>
             <th className="px-4 py-1.5 text-left text-xs">Cédula</th>
             <th className="px-4 py-1.5 text-left text-xs">Cargo</th>
             <th className="px-4 py-1.5 text-left text-xs">Empresa</th>
             <th className="px-4 py-1.5 text-left text-xs">Estado</th>
             <th className="px-4 py-1.5 text-center text-xs">Acciones</th>
           </tr>
         </thead>
         <tbody>
           <tr>
             <td colSpan={7} className="px-6 py-12 text-center">
               <div className="flex flex-col items-center gap-2">
                 <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                 <span className="text-gray-500">Cargando datos...</span>
               </div>
             </td>
           </tr>
         </tbody>
       </table>
     </div>
   )
 }

 // Aplicar filtros a las personas
 const personasFiltradas = personas.filter(persona => {
   // Filtro por nombre o apellido
   const nombreMatch = !filtroNombre || 
     persona.Nombre?.toLowerCase().includes(filtroNombre.toLowerCase()) ||
     persona.Apellidos?.toLowerCase().includes(filtroNombre.toLowerCase());
   
   // Filtro por estado
   const estadoMatch = filtroEstado === "todos" || 
     persona.ESTADO_ACTIVIDAD === filtroEstado;
   
   return nombreMatch && estadoMatch;
 });

 if (personasFiltradas.length === 0) {
   return (
     <div className="bg-white rounded-lg shadow-sm overflow-hidden">
       <table className="min-w-full text-sm">
         <thead className="bg-gray-50 text-gray-700 font-medium border-b sticky top-0 h-2">
           <tr>
             <th className="px-4 py-1.5 text-left text-xs">Nombres</th>
             <th className="px-4 py-1.5 text-left text-xs">Apellidos</th>
             <th className="px-4 py-1.5 text-left text-xs">Cédula</th>
             <th className="px-4 py-1.5 text-left text-xs">Cargo</th>
             <th className="px-4 py-1.5 text-left text-xs">Empresa</th>
             <th className="px-4 py-1.5 text-left text-xs">Estado</th>
             <th className="px-4 py-1.5 text-center text-xs">Acciones</th>
           </tr>
         </thead>
         <tbody>
           <tr>
             <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
               {filtroNombre || filtroEstado !== "todos" 
                 ? "No se encontraron registros con los filtros aplicados"
                 : "No se encontraron registros"
               }
             </td>
           </tr>
         </tbody>
       </table>
     </div>
   )
 }

 return (
   <div className="bg-white rounded-lg shadow-sm max-h-[45vh] overflow-auto">
     <div className="h-full flex flex-col">
       <div className="overflow-x-auto">
         <table className="min-w-full text-sm">
           <thead className="bg-gray-50 text-gray-700 font-medium border-b sticky top-0 h-2">
             <tr>
               <th className="px-4 py-1.5 text-left text-xs">Nombres</th>
               <th className="px-4 py-1.5 text-left text-xs">Apellidos</th>
               <th className="px-4 py-1.5 text-left text-xs">Cédula</th>
               <th className="px-4 py-1.5 text-left text-xs">Cargo</th>
               <th className="px-4 py-1.5 text-left text-xs">Empresa</th>
               <th className="px-4 py-1.5 text-left text-xs">Estado</th>
               <th className="px-4 py-1.5 text-center text-xs">Acciones</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-200">
             {personasFiltradas.map((persona, i) => (
               <tr key={i} className="hover:bg-gray-50 transition-colors h-0">
                 <td className="px-4 py-2 text-sm font-medium">{persona.Nombre || '-'}</td>
                 <td className="px-4 py-2 text-sm">{persona.Apellidos || '-'}</td>
                 <td className="px-4 py-2 text-sm">{persona.C_x002e_C || '-'}</td>
                 <td className="px-4 py-2 text-sm text-gray-600">{persona.Cargo || '-'}</td>
                 <td className="px-4 py-2 text-sm">
                   <span className="font-medium text-gray-900">{persona.empresa || '-'}</span>
                 </td>
                 <td className="px-4 py-2">
                   <PersonaStatusBadge 
                     estado={persona.Estado} 
                     estadoActividad={persona.ESTADO_ACTIVIDAD} 
                   />
                 </td>
                 <td className="px-4 py-2 text-center">
                   <div className="flex gap-1 justify-center">
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                           onClick={() => onEdit(persona)}
                         >
                           <Edit className="h-4 w-4" />
                           <span className="sr-only">Editar</span>
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent side="left">
                         <p className="text-xs">Editar persona</p>
                       </TooltipContent>
                     </Tooltip>
                   </div>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     </div>
   </div>
 )
}