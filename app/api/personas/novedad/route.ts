// app/api/personas/novedad/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_solicitud, id_persona, fecha_inicio, fecha_fin, novedad, observaciones } = body;

    // Validar campos requeridos
    if (!id_solicitud || !id_persona || !fecha_inicio || !novedad) {
      return NextResponse.json(
        { error: true, message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('NOVEDAD_PERSONA');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas para NOVEDAD_PERSONA');
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
        id_persona,
        fecha_inicio,
        fecha_fin: fecha_fin || fecha_inicio,
        novedad,
        observaciones: observaciones || ''
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.mensaje || 'Error al reportar novedad' 
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en el endpoint de novedad persona:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}