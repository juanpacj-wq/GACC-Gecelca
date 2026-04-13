// app/api/vehiculos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_solicitud } = body;

    if (!id_solicitud) {
      return NextResponse.json(
        { error: true, message: 'ID de solicitud es requerido' },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('VEHICULOS');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas para VEHICULOS');
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
          message: data.mensaje || 'Error al consultar vehículos' 
        },
        { status: response.status }
      );
    }

    // Si se provee un id_vehiculo, filtrar y devolver solo ese vehículo
    if (body.id_vehiculo && Array.isArray(data)) {
      const vehiculo = data.find((v: any) => v.id_vehiculo === body.id_vehiculo);
      if (vehiculo) {
        return NextResponse.json(vehiculo);
      } else {
        return NextResponse.json({ error: true, message: 'Vehículo no encontrado' }, { status: 404 });
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en el endpoint de vehículos:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}