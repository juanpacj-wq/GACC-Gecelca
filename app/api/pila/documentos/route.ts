// app/api/pila/documentos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const idSolicitud = searchParams.get('id_solicitud');
    const fechaCorte = searchParams.get('fecha_corte');

    // Validar que se tengan los parámetros necesarios
    if (!idSolicitud || !fechaCorte) {
      return NextResponse.json(
        { error: true, message: 'ID de solicitud y fecha de corte son requeridos' },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('VER_ADJUNTOS');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas para VER_ADJUNTOS');
      return NextResponse.json(
        { error: true, message: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // La fecha de corte se está usando como id_persona para identificar el documento
    const requestBody = {
      id_solicitud: idSolicitud,
      id_persona: fechaCorte
    };

    // Hacer la petición al servicio externo
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Si la respuesta no es exitosa, devolver el error
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.mensaje || 'Error al consultar documentos PILA' 
        },
        { status: response.status }
      );
    }

    // Filtrar solo documentos de tipo "PILA"
    let documentosPILA = [];
    
    if (data.Datos && Array.isArray(data.Datos)) {
      documentosPILA = data.Datos.filter((doc: any) => doc.tipo_adjunto === "PILA").map((doc: any) => ({
        ...doc,
        fecha_corte: fechaCorte
      }));
    } else if (data.documentos && Array.isArray(data.documentos)) {
      // Formato alternativo de respuesta según la implementación en /api/documentos/consultar
      documentosPILA = data.documentos.filter((doc: any) => doc.tipo_adjunto === "PILA").map((doc: any) => ({
        ...doc,
        fecha_corte: fechaCorte
      }));
    }

    return NextResponse.json({
      success: true,
      documentos: documentosPILA
    });

  } catch (error) {
    console.error('Error en el endpoint de consultar documentos PILA:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}