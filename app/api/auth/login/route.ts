// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del cuerpo de la petición
    const body = await request.json();
    const { usuario, password } = body;

    // Validar que se recibieron las credenciales
    if (!usuario || !password) {
      return NextResponse.json(
        { error: true, message: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('AUTH_LOGIN');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas');
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
      body: JSON.stringify({ usuario, password }),
    });

    const data = await response.json();

    // Si la respuesta no es exitosa, devolver el error
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.message || 'Error de autenticación' 
        },
        { status: response.status }
      );
    }

    // Devolver la respuesta exitosa
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en el endpoint de login:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}