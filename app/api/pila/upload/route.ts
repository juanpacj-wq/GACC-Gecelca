// app/api/pila/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_solicitud, id_persona, tipo_documento, archivoNombre, archivoBase64 } = body;

    // Validar campos requeridos
    if (!id_solicitud || !id_persona || !tipo_documento || !archivoNombre || !archivoBase64) {
      return NextResponse.json(
        { error: true, message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Asegurarse de que el tipo de documento sea PILA
    if (tipo_documento !== "PILA") {
      return NextResponse.json(
        { error: true, message: 'El tipo de documento debe ser PILA' },
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

    // El id_persona es en realidad la fecha de corte para poder identificar el documento
    const requestBody = {
      id_solicitud,
      id_persona,
      tipo_documento,
      archivoNombre,
      archivoBase64
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
          message: data.mensaje || 'Error al subir documento PILA' 
        },
        { status: response.status }
      );
    }

    // Agregar información de fecha de corte a la respuesta
    return NextResponse.json({
      success: true,
      mensaje: 'Documento PILA cargado correctamente',
      fecha_corte: id_persona,
      ...data
    });

  } catch (error) {
    console.error('Error en el endpoint de upload PILA:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}