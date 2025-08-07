// app/api/personas/carga-masiva/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_solicitud, archivoNombre, archivoBase64 } = body;

    // Validar campos requeridos
    if (!id_solicitud || !archivoNombre || !archivoBase64) {
      return NextResponse.json(
        { error: true, message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('CARGA_MASIVA');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas para CARGA_MASIVA');
      return NextResponse.json(
        { error: true, message: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Hacer la petición al servicio externo
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        id_solicitud,
        archivoNombre,
        archivoBase64
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.mensaje || 'Error en carga masiva' 
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en el endpoint de carga masiva:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}