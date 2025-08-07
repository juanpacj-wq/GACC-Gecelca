// app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardProvider } from "./providers/DashboardProvider"
import DashboardContainer from "./components/DashboardContainer"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()
  const [idSolicitud, setIdSolicitud] = useState<string>("")

  // Verificar autenticación
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])
  
  // Obtener el id_solicitud de los query parameters
  useEffect(() => {
    const solicitudParam = searchParams.get("solicitud")
    if (solicitudParam) {
      setIdSolicitud(solicitudParam)
    } else if (!isLoading && isAuthenticated) {
      // Si no hay parámetro y el usuario está autenticado, redirigir a la página de código
      router.push("/code")
    }
  }, [searchParams, router, isLoading, isAuthenticated])

  // Si está cargando la autenticación, mostrar un indicador de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <DashboardProvider idSolicitud={idSolicitud}>
        <DashboardContainer />
      </DashboardProvider>
    </TooltipProvider>
  )
}