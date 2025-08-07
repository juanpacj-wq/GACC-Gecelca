// app/api/documentos/consultar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_solicitud, id_persona, id_vehiculo } = body;

    // Validar que se tenga id_solicitud
    if (!id_solicitud) {
      return NextResponse.json(
        { error: true, message: 'ID de solicitud es requerido' },
        { status: 400 }
      );
    }

    // Validar que se tenga id_persona o id_vehiculo
    if (!id_persona && !id_vehiculo) {
      return NextResponse.json(
        { error: true, message: 'Se requiere ID de persona o ID de vehículo' },
        { status: 400 }
      );
    }

    // Determinar qué endpoint usar basado en si es persona o vehículo
    const endpointKey = id_persona ? 'VER_ADJUNTOS' : 'VER_ADJUNTOS_VEHICULO';
    
    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials(endpointKey);

    if (!url || !token) {
      console.error(`Credenciales de API no configuradas para ${endpointKey}`);
      return NextResponse.json(
        { error: true, message: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Construir el body según si es persona o vehículo
    const requestBody: any = {
      id_solicitud
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
          message: data.mensaje || 'Error al consultar documentos' 
        },
        { status: response.status }
      );
    }

    // Transformar la respuesta si es necesario
    // Asumiendo que la respuesta viene con una estructura similar a la del HTML de ejemplo
    if (data.Datos && Array.isArray(data.Datos)) {
      // Los datos ya vienen en el formato correcto con content (base64), name, y tipo_adjunto
      return NextResponse.json({
        success: true,
        documentos: data.Datos
      });
    }

    return NextResponse.json({
      success: true,
      documentos: []
    });

  } catch (error) {
    console.error('Error en el endpoint de consultar documentos:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}