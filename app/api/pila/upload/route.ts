// app/api/pila/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id_solicitud, 
      id_persona, 
      id_vehiculo, // Nuevo campo (estará vacío)
      tipo_documento, 
      archivoNombre, 
      archivoBase64,
      info_pila // Nuevo campo con la información extraída del PDF
    } = body;

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

    // Validar que info_pila esté presente
    if (!info_pila) {
      return NextResponse.json(
        { error: true, message: 'La información extraída del PDF es requerida' },
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
      id_vehiculo: "", // Campo vacío como se solicitó
      tipo_documento,
      archivoNombre,
      archivoBase64,
      info_pila // Incluir el nuevo campo en la petición
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

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error al parsear respuesta:', error);
      return NextResponse.json(
        { 
          error: true, 
          message: 'Error al procesar la respuesta del servicio' 
        },
        { status: 500 }
      );
    }

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
      info_pila_length: info_pila.length, // Incluir longitud para referencia
      ...data
    });

  } catch (error) {
    console.error('Error en el endpoint de upload PILA:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor, por favor revise su conexión' 
      },
      { status: 500 }
    );
  }
}