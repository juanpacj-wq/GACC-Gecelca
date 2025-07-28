// app/dashboard/modules/layout/Sidebar.tsx
"use client"

import { UserCircle, Car, LogOut } from "lucide-react"
import Image from "next/image"
import { TipoIngreso } from "../../types"

interface SidebarProps {
  tipoIngreso: TipoIngreso;
  setTipoIngreso: (tipo: TipoIngreso) => void;
  onLogout: () => void;
}

export default function Sidebar({ tipoIngreso, setTipoIngreso, onLogout }: SidebarProps) {
  return (
    <aside 
      className="w-20 flex flex-col items-center pt-4 text-white flex-shrink-0"
      style={{
        background: "linear-gradient(to bottom, #0d8517, rgba(12, 61, 114, 1))",
      }}
    >
      <img src="/nav.png" alt="Logo" className="w-16 h-16 mb-2" />
      
      {/* Botones de navegación para Vehículos y Personas */}
      <div className="flex flex-col gap-4 w-full px-2">
        <button
          onClick={() => setTipoIngreso("persona")}
          className={`flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${
            tipoIngreso === "persona" 
              ? "bg-white/20 text-white" 
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <UserCircle className="w-6 h-6" />
          <span className="text-xs font-medium">Personas</span>
        </button>
        <button
          onClick={() => setTipoIngreso("vehiculo")}
          className={`flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${
            tipoIngreso === "vehiculo" 
              ? "bg-white/20 text-white" 
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          <Car className="w-6 h-6" />
          <span className="text-xs font-medium">Vehículos</span>
        </button>
      </div>
      
      {/* Botón de salir con estilo similar a los otros botones de navegación */}
      <button
        onClick={onLogout}
        className="flex flex-col items-center gap-1 py-3 mt-auto mb-4 w-full  text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
      >
        <LogOut className="w-6 h-6" />
        <span className="text-xs font-medium">Salir</span>
      </button>
    </aside>
  )
}