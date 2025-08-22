// app/unauthorized/page.tsx
"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { Ban , Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex  bg-gray-100 pt-20 relative pl-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gray-100" />
      </div>

      <div className="relative z-20 flex place-items-start gap-8">
        <div className=" rounded-full p-4">
          <Lock className="w-40 h-40 text-gray-500 pb-10 mb-10 -mt-3 -mr-8" />
        </div>
        <div>
          <CardHeader className="p-0">
            <CardTitle className="text-3xl font-medium text-gray-600">
              Error 403: Acceso Denegado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <p className="text-gray-500 mb-6">
              No se ha autenticado o no tiene permiso para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Será redirigido a la página de inicio en 5 segundos.
            </p>
            <Button
              onClick={() => router.push("/")}
              className="w-4/12 h-10 bg-blue-400 hover:bg-blue-500 text-white font-normal text-lg"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-0">
        <Image
            src="/logo-color.png"
            alt="Company Logo"
            width={0}
            height={0}
            sizes="100vw"
            className="w-10/12 h-auto opacity-5"
        />
      </div>

    </div>
  );
}
