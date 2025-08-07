// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';
import { verifyRecaptchaTokenServer } from '@/lib/recaptcha';

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
        { error: true, message: 'Invalid Content-Type' },
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
        { error: true, message: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { usuario, password, recaptchaToken } = body;

    // Validar que se recibieron las credenciales
    if (!usuario || !password) {
      console.log('Missing credentials');
      return NextResponse.json(
        { error: true, message: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar longitud de los campos (prevención de ataques)
    if (usuario.length > 100 || password.length > 100) {
      console.warn('Credentials too long, possible attack');
      return NextResponse.json(
        { error: true, message: 'Credenciales inválidas' },
        { status: 400 }
      );
    }

    // Validar que se recibió el token de reCAPTCHA
    if (!recaptchaToken) {
      console.log('Missing reCAPTCHA token');
      return NextResponse.json(
        { error: true, message: 'Verificación reCAPTCHA requerida' },
        { status: 400 }
      );
    }

    // Log para debugging (sin exponer información sensible)
    console.log(`Login attempt for user: ${usuario.substring(0, 3)}***`);
    console.log('reCAPTCHA token received:', recaptchaToken.substring(0, 20) + '...');

    // Verificar el token de reCAPTCHA
    console.log('Verifying reCAPTCHA token...');
    const recaptchaVerification = await verifyRecaptchaTokenServer(recaptchaToken);
    
    console.log('reCAPTCHA verification result:', {
      success: recaptchaVerification.success,
      score: recaptchaVerification.score,
      action: recaptchaVerification.action,
      hostname: recaptchaVerification.hostname
    });
    
    if (!recaptchaVerification.success) {
      console.error('reCAPTCHA verification failed:', recaptchaVerification.error_codes);
      return NextResponse.json(
        { 
          error: true, 
          message: 'Error en la verificación de seguridad. Por favor, intente nuevamente.' 
        },
        { status: 400 }
      );
    }

    // Verificar la puntuación de reCAPTCHA (0.0 a 1.0)
    const score = recaptchaVerification.score || 0;
    const minScore = process.env.RECAPTCHA_MIN_SCORE ? parseFloat(process.env.RECAPTCHA_MIN_SCORE) : 0.5;
    
    if (score < minScore) {
      console.warn(`Posible actividad sospechosa: reCAPTCHA score=${score}, user=${usuario.substring(0, 3)}***`);
      
      // No revelar el score exacto al usuario por seguridad
      return NextResponse.json(
        { 
          error: true, 
          message: 'Verificación de seguridad fallida. Por favor, intente nuevamente.' 
        },
        { status: 400 }
      );
    }

    // Verificar que la acción sea la correcta
    if (recaptchaVerification.action && recaptchaVerification.action !== 'login') {
      console.warn(`reCAPTCHA action mismatch: expected=login, got=${recaptchaVerification.action}`);
      return NextResponse.json(
        { 
          error: true, 
          message: 'Error de verificación. Por favor, recargue la página.' 
        },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('AUTH_LOGIN');

    if (!url || !token) {
      console.error('API credentials not configured');
      return NextResponse.json(
        { error: true, message: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    console.log('Calling external auth service...');
    
    // Hacer la petición al servicio externo con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
          'User-Agent': 'ControlAcceso/1.0',
          'X-Request-ID': crypto.randomUUID() // Para tracking
        },
        body: JSON.stringify({ usuario, password }),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('External auth service timeout');
        return NextResponse.json(
          { 
            error: true, 
            message: 'El servicio de autenticación no responde. Intente más tarde.' 
          },
          { status: 504 }
        );
      }
      
      console.error('Error calling external auth service:', fetchError);
      return NextResponse.json(
        { 
          error: true, 
          message: 'Error al conectar con el servicio de autenticación' 
        },
        { status: 502 }
      );
    }
    
    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Error parsing auth service response:', jsonError);
      return NextResponse.json(
        { 
          error: true, 
          message: 'Respuesta inválida del servicio de autenticación' 
        },
        { status: 502 }
      );
    }

    // Si la respuesta no es exitosa, devolver el error
    if (!response.ok) {
      console.log(`Auth failed with status ${response.status}`);
      
      // No exponer mensajes de error internos al usuario
      const userMessage = response.status === 401 
        ? 'Usuario o contraseña incorrectos' 
        : 'Error de autenticación';
      
      return NextResponse.json(
        { 
          error: true, 
          message: userMessage 
        },
        { status: response.status }
      );
    }

    console.log('Authentication successful');
    
    // Sanitizar los datos antes de devolverlos
    const sanitizedData = {
      id: data.id || 'default-id',
      nombre: data.nombre || usuario,
      email: data.email || `${usuario}@example.com`,
      role: data.role || 'user',
      // No incluir datos sensibles
    };

    // Crear respuesta con headers de seguridad adicionales
    const successResponse = NextResponse.json(sanitizedData);
    
    // Agregar headers de seguridad
    successResponse.headers.set('X-Content-Type-Options', 'nosniff');
    successResponse.headers.set('X-Frame-Options', 'DENY');
    successResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    successResponse.headers.set('Pragma', 'no-cache');
    
    return successResponse;

  } catch (error) {
    console.error('Unexpected error in login endpoint:', error);
    
    // No exponer detalles del error al usuario
    return NextResponse.json(
      { 
        error: true, 
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