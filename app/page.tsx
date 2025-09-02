// app/page.tsx
"use client"
import Image from "next/image"
import { Lock, AlertCircle, KeyRound, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import Script from "next/script"
import { getRecaptchaSiteKey, isRecaptchaConfigured } from "@/lib/recaptcha"
import ForgotPasswordDialog from "@/components/ui/forgot-password-dialog"

// Declaración de tipos para window
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      reset?: () => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string>("")
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  
  // Nuevos estados para el control del flujo
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false)
  const [tokenRequested, setTokenRequested] = useState(false)
  const [requestedNit, setRequestedNit] = useState("")

  // Verificar configuración de reCAPTCHA al cargar el componente
  useEffect(() => {
    try {
      if (isRecaptchaConfigured()) {
        const siteKey = getRecaptchaSiteKey();
        setRecaptchaSiteKey(siteKey);
        console.log("reCAPTCHA configurado correctamente");
      } else {
        console.error("reCAPTCHA no está configurado correctamente");
        setError("Error de configuración de seguridad. Por favor, contacte al administrador.");
      }
    } catch (err) {
      console.error("Error al obtener la configuración de reCAPTCHA:", err);
      setError("Error de configuración de seguridad.");
    }
  }, []);

  // Callback para cuando reCAPTCHA está listo
  const onRecaptchaLoad = useCallback(() => {
    console.log("reCAPTCHA script loaded");
    setRecaptchaLoaded(true);
    
    // Esperar a que grecaptcha esté completamente listo
    if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
      window.grecaptcha.ready(() => {
        console.log("reCAPTCHA is ready");
        setRecaptchaReady(true);
      });
    }
  }, []);

  // Configurar el callback global antes de cargar el script
  useEffect(() => {
    // Definir el callback global
    window.onRecaptchaLoad = onRecaptchaLoad;

    // Si grecaptcha ya está cargado (por ejemplo, en hot reload)
    if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
      onRecaptchaLoad();
    }

    return () => {
      // Limpiar al desmontar
      delete window.onRecaptchaLoad;
    };
  }, [onRecaptchaLoad]);

  const executeRecaptcha = async (): Promise<string | null> => {
    if (!window.grecaptcha) {
      console.error("reCAPTCHA not loaded");
      setError("Error al cargar reCAPTCHA. Por favor, recargue la página.");
      return null;
    }

    if (!recaptchaReady) {
      console.error("reCAPTCHA not ready");
      setError("reCAPTCHA aún no está listo. Por favor, espere un momento.");
      return null;
    }

    if (!recaptchaSiteKey) {
      console.error("reCAPTCHA site key not configured");
      setError("Error de configuración de seguridad.");
      return null;
    }

    try {
      console.log("Executing reCAPTCHA...");
      const token = await window.grecaptcha.execute(recaptchaSiteKey, {
        action: 'login'
      });
      console.log("reCAPTCHA token obtained successfully");
      return token;
    } catch (error) {
      console.error("reCAPTCHA execution error:", error);
      setError("Error al verificar reCAPTCHA. Por favor, intente nuevamente.");
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    
    // Validación de campos
    if (!user || !password) {
      setError("Por favor completa ambos campos.")
      return
    }

    // Verificar que se haya solicitado el token primero
    if (!tokenRequested || !isPasswordEnabled) {
      setError("Primero debe solicitar las credenciales con su NIT.")
      return
    }
    
    // Verificar que reCAPTCHA esté configurado
    if (!recaptchaSiteKey) {
      setError("Error de configuración de seguridad. Por favor, contacte al administrador.")
      return
    }
    
    // Verificar que reCAPTCHA esté listo
    if (!recaptchaReady) {
      setError("Por favor espere, verificando seguridad...")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      // Obtener token de reCAPTCHA
      const recaptchaToken = await executeRecaptcha();
      
      if (!recaptchaToken) {
        setIsLoading(false);
        return; // Error ya mostrado en executeRecaptcha
      }
      
      // Llamar a login con el token de reCAPTCHA
      const result = await login(user, password, recaptchaToken);
      
      if (result.success) {
        // Redirigir al usuario a la página de código
        router.push("/code")
      } else {
        setError(result.message || "Error de autenticación. Verifique sus credenciales.")
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError("Error al conectar con el servidor: " + (error instanceof Error ? error.message : "Error desconocido"))
    } finally {
      setIsLoading(false)
    }
  }

  // Callback para cuando se solicita exitosamente el token
  const handleTokenRequestSuccess = (nit: string) => {
    setTokenRequested(true)
    setIsPasswordEnabled(true)
    setRequestedNit(nit)
    setUser(nit) // Establecer automáticamente el NIT en el campo de usuario
    setError("") // Limpiar cualquier error previo
    
    // Enfocar el campo de contraseña después de un breve delay
    setTimeout(() => {
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
      if (passwordInput) {
        passwordInput.focus()
      }
    }, 100)
  }

  // Resetear el estado cuando cambia el usuario manualmente
  const handleUserChange = (value: string) => {
    setUser(value)
    // Si el usuario cambia el NIT después de solicitar el token, resetear el estado
    if (tokenRequested && value !== requestedNit) {
      setTokenRequested(false)
      setIsPasswordEnabled(false)
      setRequestedNit("")
      setPassword("") // Limpiar la contraseña
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* reCAPTCHA Script con callback mejorado - solo cargar si está configurado */}
      {recaptchaSiteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}&onload=onRecaptchaLoad`}
          strategy="afterInteractive"
          onLoad={() => {
            console.log("Script tag loaded");
          }}
          onError={(error) => {
            console.error("Error loading reCAPTCHA script:", error);
            setError("Error al cargar el sistema de seguridad. Por favor, recargue la página.");
          }}
        />
      )}
      
      {/* Fondo con gradiente */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/fondo.png')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/80 via-teal-500/60 to-blue-500/80" />
      </div>
      
      {/* Barra lateral */}
      <div className="relative z-10 w-16 md:w-20 flex-shrink-0">
        <div className="h-full w-full flex flex-col items-center py-4" style={{background: "linear-gradient(to bottom, #0d8517, rgba(12, 61, 114, 1)" }}>
          <div className="w-16 h-16 md:w-18 md:h-20 rounded-full flex items-center justify-center mb-4">
            <Image src="/nav.png" alt="Mini Logo" width={200} height={200} className="rounded-full object-cover w-14 h-14 md:w-16 md:h-16" />
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="relative flex-1">
        <div className="absolute inset-0 z-0">
          <Image src="/fondo.png" alt="Fondo" fill className="object-cover" priority />
        </div>
        <div className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center mb-4 md:mb-6">
              <Lock className="w-16 h-16 md:w-20 md:h-20 text-white mr-4 md:mr-6" />
              <div className="h-16 md:h-20 w-1 bg-white mr-4 md:mr-6" />
              <div className="text-left">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">Control de acceso</h1>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">a plantas</h2>
              </div>
            </div>
          </div>
          
          {/* Formulario */}
          <Card className="-mt-10 w-full max-w-md md:max-w-lg bg-white shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className=" text-2xl md:text-3xl font-bold text-gray-800">Iniciar sesión</CardTitle>
              <p className="text-sm md:text-base text-gray-600 mt-2">
                {!tokenRequested 
                  ? ""
                  : "Ingrese la contraseña recibida en su correo"}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Indicador de estado del proceso */}
                {!tokenRequested }

                {tokenRequested }

                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Usuario (NIT)" 
                    value={user} 
                    onChange={(e) => handleUserChange(e.target.value)} 
                    disabled={isLoading || !recaptchaSiteKey}
                    autoComplete="username"
                    className={tokenRequested ? "bg-green-50" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-colors ${
                      !tokenRequested 
                        ? "text-blue-600 hover:text-blue-700 animate-pulse" 
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    disabled={isLoading || !recaptchaSiteKey}
                    title="Solicitar contraseña"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="relative">
                  <Input 
                    type="password" 
                    placeholder={!isPasswordEnabled ? "Primero solicite las credenciales" : "Contraseña"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    disabled={!isPasswordEnabled || isLoading || !recaptchaSiteKey}
                    autoComplete="current-password"
                    className={`pr-12 ${!isPasswordEnabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {!isPasswordEnabled && (
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                {/* Indicador de estado de reCAPTCHA */}
                {recaptchaSiteKey && !recaptchaReady && (
                  <div className="text-xs text-gray-500 text-center">
                    <span className="inline-flex items-center">
                      <span className="animate-pulse mr-2">●</span>
                      Cargando sistema de seguridad...
                    </span>
                  </div>
                )}
                
                {/* Nota protegido por reCAPTCHA */}
                {recaptchaSiteKey && recaptchaReady && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Este sitio está protegido por reCAPTCHA y aplican la{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                      Política de Privacidad
                    </a>{' '}
                    y{' '}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                      Términos de Servicio
                    </a>{' '}
                    de Google.
                  </div>
                )}
                
                {/* Mensaje de error si reCAPTCHA no está configurado */}
                {!recaptchaSiteKey && (
                  <div className="text-xs text-red-500 text-center">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Sistema de seguridad no configurado. Contacte al administrador.
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
                
                <Button 
                  type="submit"
                  className={`w-full h-12 font-semibold text-lg mt-4 ${
                    !isPasswordEnabled 
                      ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                  disabled={!isPasswordEnabled || isLoading || !recaptchaReady || !recaptchaSiteKey}
                >
                  {isLoading ? "Procesando..." : !recaptchaReady ? "Cargando..." : !recaptchaSiteKey ? "No disponible" : !isPasswordEnabled ? "Solicite credenciales primero" : "Ingresar"}
                </Button>

                {/* Link para recuperar contraseña */}
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className={`text-sm hover:underline ${
                      !tokenRequested 
                        ? "text-blue-600 hover:text-blue-800 font-semibold" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    disabled={isLoading}
                  >
                    {!tokenRequested 
                      ? "Solicitar contraseña" 
                      : "Solicitar contraseña nuevamente"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Logo inferior */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20">
        <Image src="/logo.png" alt="Company Logo" width={120} height={40} className="opacity-90" />
      </div>
      
      {/* Badge de reCAPTCHA - posición fija para evitar problemas de CSP */}
      <div className="grecaptcha-badge" style={{ visibility: 'hidden' }}></div>

      {/* Diálogo de recuperación de contraseña con callback de éxito */}
      <ForgotPasswordDialog 
        open={isForgotPasswordOpen} 
        onOpenChange={setIsForgotPasswordOpen}
        defaultUser={user}
        onSuccess={handleTokenRequestSuccess}
      />
    </div>
  )
}