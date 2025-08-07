// app/api/documentos/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_solicitud, tipo_documento, archivoNombre, archivoBase64, id_persona, id_vehiculo } = body;

    // Validar campos requeridos básicos
    if (!id_solicitud || !tipo_documento || !archivoNombre || !archivoBase64) {
      return NextResponse.json(
        { error: true, message: 'Campos requeridos faltantes' },
        { status: 400 }
      );
    }

    // Validar que se envíe id_persona o id_vehiculo
    if (!id_persona && !id_vehiculo) {
      return NextResponse.json(
        { error: true, message: 'Se requiere id_persona o id_vehiculo' },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('UPLOAD_DOCUMENTO');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas para UPLOAD_DOCUMENTO');
      return NextResponse.json(
        { error: true, message: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Construir el body según si es persona o vehículo
    const requestBody: any = {
      id_solicitud,
      tipo_documento,
      archivoNombre,
      archivoBase64
    };

    if (id_persona) {
      requestBody.id_persona = id_persona;
    } else {
      requestBody.id_vehiculo = id_vehiculo;
    }

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

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.mensaje || 'Error al subir documento' 
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en el endpoint de upload documento:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}