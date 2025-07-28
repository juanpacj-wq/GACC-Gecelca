// app/api/vehiculos/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['id_solicitud', 'id_vehiculo', 'placa', 'marca', 'modelo', 'color'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: true, message: `Campo ${field} es requerido` },
          { status: 400 }
        );
      }
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('REGISTER_VEHICULO');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas para REGISTER_VEHICULO');
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
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.mensaje || 'Error al registrar vehículo' 
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en el endpoint de registrar vehículo:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}