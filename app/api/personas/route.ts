// app/api/personas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_solicitud, id_persona } = body;

    if (!id_solicitud) {
      return NextResponse.json(
        { error: true, message: 'ID de solicitud es requerido' },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('PERSONAS');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas para PERSONAS');
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
      body: JSON.stringify({ id_solicitud }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.mensaje || 'Error al consultar personas' 
        },
        { status: response.status }
      );
    }
    
    // Si se provee un id_persona, filtrar y devolver solo esa persona
    if (id_persona && Array.isArray(data)) {
        const persona = data.find(p => p.id_persona === id_persona || p.guid0 === id_persona || p.Title === id_persona);
        if (persona) {
            return NextResponse.json(persona);
        } else {
            // Si no se encuentra la persona específica, puedes devolver un 404 o un array vacío.
            // En este caso, devolver un error parece más apropiado.
            return NextResponse.json({ error: true, message: 'Persona no encontrada' }, { status: 404 });
        }
    }


    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en el endpoint de personas:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}