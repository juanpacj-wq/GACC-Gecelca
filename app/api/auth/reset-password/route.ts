// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';

// Función para agregar delay aleatorio (prevención de timing attacks)
const addRandomDelay = () => {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * 100) + 50; // 50-150ms
    setTimeout(resolve, delay);
  });
};

export async function POST(request: NextRequest) {
  // Agregar delay aleatorio para prevenir timing attacks
  await addRandomDelay();
  
  try {
    // Verificar Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid Content-Type' 
        },
        { status: 400 }
      );
    }
    
    // Obtener los datos del cuerpo de la petición
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid request body' 
        },
        { status: 400 }
      );
    }
    
    const { id_nit } = body;

    // Validar que se recibió el ID/NIT
    if (!id_nit) {
      console.log('Missing ID/NIT');
      return NextResponse.json(
        { 
          success: false,
          message: 'Usuario (ID/NIT) es requerido' 
        },
        { status: 400 }
      );
    }

    // Validar longitud del campo (prevención de ataques)
    const idNitStr = String(id_nit).trim();
    if (idNitStr.length > 100 || idNitStr.length < 1) {
      console.warn('ID/NIT too long or empty, possible attack');
      return NextResponse.json(
        { 
          success: false,
          message: 'ID/NIT inválido' 
        },
        { status: 400 }
      );
    }

    // Log para debugging (sin exponer información sensible)
    console.log(`Password reset attempt for user: ${idNitStr.substring(0, 3)}***`);

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('AUTH_TOKEN_RESET_PSW');

    if (!url || !token) {
      console.error('Reset password API credentials not configured');
      return NextResponse.json(
        { 
          success: false,
          message: 'Error de configuración del servidor' 
        },
        { status: 500 }
      );
    }

    console.log('Calling external reset password service...');
    
    // Hacer la petición al servicio externo con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
    
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-auth-token': token,
          'User-Agent': 'ControlAcceso/1.0',
          'X-Request-ID': crypto.randomUUID() // Para tracking
        },
        body: JSON.stringify({ id_nit: idNitStr }),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('External reset password service timeout');
        return NextResponse.json(
          { 
            success: false,
            message: 'El servicio de recuperación no responde. Intente más tarde.' 
          },
          { status: 504 }
        );
      }
      
      console.error('Error calling external reset password service:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Error al conectar con el servicio de recuperación' 
        },
        { status: 502 }
      );
    }
    
    clearTimeout(timeoutId);

    // Obtener el texto de la respuesta primero
    let responseText;
    try {
      responseText = await response.text();
    } catch (textError) {
      console.error('Error reading response text:', textError);
      return NextResponse.json(
        { 
          success: false,
          message: 'Respuesta inválida del servicio' 
        },
        { status: 502 }
      );
    }

    // Intentar parsear como JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Error parsing reset password service response:', jsonError);
      console.log('Raw response:', responseText);
      
      // Si no es JSON, devolver error
      return NextResponse.json(
        { 
          success: false,
          message: 'Respuesta inválida del servicio de recuperación' 
        },
        { status: 502 }
      );
    }

    // Verificar la respuesta
    if (!response.ok) {
      console.log(`Reset password failed with status ${response.status}`);
      
      // No exponer mensajes de error internos al usuario
      const userMessage = response.status === 404 
        ? 'Usuario no encontrado' 
        : response.status === 400
        ? 'Datos inválidos'
        : 'Error en la solicitud de recuperación';
      
      return NextResponse.json(
        { 
          success: false,
          message: userMessage 
        },
        { status: response.status }
      );
    }

    // Verificar que la respuesta tenga el formato esperado
    // Basado en el HTML de referencia, esperamos "Correcto" con el mensaje específico
    const REQUIRED_MESSAGE = "El correo electrónico ha sido enviado correctamente";
    
    if (data && typeof data === 'object' && data.Correcto === REQUIRED_MESSAGE) {
      console.log('Password reset successful');
      
      // Preparar la respuesta con los correos si están disponibles
      const responseData: any = {
        success: true,
        message: REQUIRED_MESSAGE
      };
      
      // Si hay correos en la respuesta, incluirlos
      if (data.Correos) {
        responseData.emails = data.Correos;
      }
      
      // Crear respuesta con headers de seguridad adicionales
      const successResponse = NextResponse.json(responseData);
      
      // Agregar headers de seguridad
      successResponse.headers.set('X-Content-Type-Options', 'nosniff');
      successResponse.headers.set('X-Frame-Options', 'DENY');
      successResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      successResponse.headers.set('Pragma', 'no-cache');
      
      return successResponse;
    } else {
      // La respuesta no tiene el formato esperado
      console.log('Unexpected response format:', data);
      
      // Verificar otros posibles formatos de respuesta exitosa
      if (data && data.success === true) {
        // Formato alternativo de éxito
        return NextResponse.json({
          success: true,
          message: data.message || REQUIRED_MESSAGE,
          emails: data.Correos || data.emails || null
        });
      }
      
      return NextResponse.json(
        { 
          success: false,
          message: 'Este nit no es válido' 
        },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in reset password endpoint:', error);
    
    // No exponer detalles del error al usuario
    return NextResponse.json(
      { 
        success: false,
        message: 'Error interno del servidor. Por favor, intente más tarde.' 
      },
      { status: 500 }
    );
  }
}

// Manejar método OPTIONS para CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}