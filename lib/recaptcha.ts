// lib/recaptcha.ts
/**
 * Constantes para la configuración de reCAPTCHA
 * Usando variables de entorno de forma segura
 */

// Para debugging - ver qué variables están disponibles
if (typeof window !== 'undefined') {
  console.log('Cliente - Variables de entorno disponibles:', {
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? 'Configurada' : 'NO configurada',
    NODE_ENV: process.env.NODE_ENV
  });
} else {
  console.log('Servidor - Variables de entorno disponibles:', {
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? 'Configurada' : 'NO configurada',
    RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY ? 'Configurada' : 'NO configurada',
    NODE_ENV: process.env.NODE_ENV
  });
}

// Usar las variables de entorno - sin valores por defecto hardcodeados
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
export const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Validar que las claves estén configuradas
if (!RECAPTCHA_SITE_KEY && typeof window !== 'undefined') {
  console.error('NEXT_PUBLIC_RECAPTCHA_SITE_KEY no está configurada en las variables de entorno');
}

if (!RECAPTCHA_SECRET_KEY && typeof window === 'undefined') {
  console.error('RECAPTCHA_SECRET_KEY no está configurada en las variables de entorno');
}

/**
 * Interfaz para la respuesta de verificación de reCAPTCHA
 */
export interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  error_codes?: string[];
  'error-codes'?: string[]; // Google a veces usa este formato
}

/**
 * Verifica un token de reCAPTCHA v3 con la API de Google
 * Esta función es para uso del cliente (llama al endpoint local)
 * * @param token - Token generado por reCAPTCHA en el cliente
 * @param action - Acción esperada para la verificación
 * @param minScore - Puntuación mínima aceptable (0.0 a 1.0)
 * @returns Objeto con el resultado de la verificación
 */
export async function verifyRecaptchaToken(
  token: string,
  action: string = 'login',
  minScore?: number
): Promise<{ 
  success: boolean; 
  score?: number; 
  message?: string; 
}> {
  try {
    // Usar la puntuación mínima de las variables de entorno si no se especifica
    const minimumScore = minScore ?? (process.env.RECAPTCHA_MIN_SCORE ? parseFloat(process.env.RECAPTCHA_MIN_SCORE) : 0.5);
    
    // Hacer la petición al endpoint local que se comunicará con Google
    const response = await fetch('/api/auth/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from verify endpoint:', errorText);
      throw new Error(`Error en la verificación de reCAPTCHA: ${response.status}`);
    }

    const data: RecaptchaVerifyResponse = await response.json();

    // Verificar la respuesta de Google
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data.error_codes || data['error-codes']);
      return { 
        success: false, 
        message: 'Verificación de reCAPTCHA fallida' 
      };
    }

    // Verificar puntuación y acción
    const score = data.score || 0;
    if (score < minimumScore) {
      console.warn(`reCAPTCHA score too low: ${score} (minimum required: ${minimumScore})`);
      return { 
        success: false, 
        score,
        message: 'La puntuación de seguridad es demasiado baja' 
      };
    }

    if (data.action && data.action !== action) {
      console.warn(`reCAPTCHA action mismatch: expected=${action}, got=${data.action}`);
      return { 
        success: false, 
        score,
        message: 'La acción de verificación no coincide' 
      };
    }

    // Todo correcto
    return { 
      success: true, 
      score 
    };
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error desconocido al verificar reCAPTCHA' 
    };
  }
}

/**
 * Verifica un token de reCAPTCHA directamente desde el servidor
 * Esta función debe ser llamada solo desde el servidor (API routes)
 * * @param token - Token generado por reCAPTCHA en el cliente
 * @param secretKey - Clave secreta de reCAPTCHA (requerida)
 * @returns Respuesta completa de la API de reCAPTCHA
 */
export async function verifyRecaptchaTokenServer(
  token: string,
  secretKey?: string
): Promise<RecaptchaVerifyResponse> {
  if (!token) {
    console.error('No token provided for reCAPTCHA verification');
    return {
      success: false,
      error_codes: ['missing-token'],
    };
  }

  // Usar la clave secreta del parámetro o de la variable de entorno
  const finalSecretKey = secretKey || RECAPTCHA_SECRET_KEY;

  if (!finalSecretKey) {
    console.error('No secret key configured for reCAPTCHA');
    return {
      success: false,
      error_codes: ['missing-secret-key'],
    };
  }

  // Construir el cuerpo de la petición con URLSearchParams
  const formData = new URLSearchParams();
  formData.append('secret', finalSecretKey);
  formData.append('response', token);
  
  try {
    console.log('Calling Google reCAPTCHA API...');
    
    // Hacer la petición a la API de Google con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ControlAcceso/1.0',
      },
      body: formData.toString(),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Google reCAPTCHA API error: ${response.status} ${response.statusText}`);
      throw new Error(`Error en la API de reCAPTCHA: ${response.status}`);
    }

    // Procesar la respuesta
    const data: RecaptchaVerifyResponse = await response.json();
    
    // Log para debugging (sin exponer el token completo)
    console.log('reCAPTCHA API response:', {
      success: data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
      error_codes: data.error_codes || data['error-codes']
    });
    
    // Normalizar error_codes (Google a veces usa error-codes con guión)
    if (!data.error_codes && data['error-codes']) {
      data.error_codes = data['error-codes'];
    }
    
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Timeout calling Google reCAPTCHA API');
      return {
        success: false,
        error_codes: ['timeout'],
      };
    }
    
    console.error('Error contacting reCAPTCHA API:', error);
    return {
      success: false,
      error_codes: ['server_error'],
    };
  }
}

/**
 * Función auxiliar para validar el formato de un token reCAPTCHA
 * * @param token - Token a validar
 * @returns true si el token tiene un formato válido
 */
export function isValidRecaptchaToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Los tokens de reCAPTCHA v3 son strings largos (típicamente > 100 caracteres)
  // y contienen solo caracteres alfanuméricos, guiones y guiones bajos
  if (token.length < 20 || token.length > 2000) {
    return false;
  }
  
  // Verificar que solo contenga caracteres válidos
  const validTokenRegex = /^[A-Za-z0-9_-]+$/;
  return validTokenRegex.test(token);
}

/**
 * Función para obtener información del dominio desde el hostname
 * Útil para verificar que el token viene del dominio correcto
 * * @param hostname - Hostname reportado por reCAPTCHA
 * @returns true si el hostname es válido para esta aplicación
 */
export function isValidHostname(hostname?: string): boolean {
  if (!hostname) {
    return false;
  }
  
  // Lista de hostnames válidos desde variables de entorno
  const validHostnames = [
    'localhost',
    process.env.NEXT_PUBLIC_APP_DOMAIN,
    // Extraer dominio de NEXT_PUBLIC_APP_URL si existe
    process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : null,
  ].filter(Boolean) as string[];
  
  // En desarrollo, aceptar localhost
  if (process.env.NODE_ENV === 'development' && hostname === 'localhost') {
    return true;
  }
  
  // En producción, verificar contra la lista de dominios válidos
  return validHostnames.some(valid => 
    hostname === valid || hostname.endsWith(`.${valid}`)
  );
}

/**
 * Configuración de reCAPTCHA para diferentes entornos
 */
export const getRecaptchaConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const minScoreFromEnv = process.env.RECAPTCHA_MIN_SCORE ? parseFloat(process.env.RECAPTCHA_MIN_SCORE) : null;
  
  return {
    siteKey: RECAPTCHA_SITE_KEY || '',
    secretKey: RECAPTCHA_SECRET_KEY || '',
    minScore: minScoreFromEnv ?? (isDevelopment ? 0.3 : 0.5), // Score más bajo en desarrollo
    timeout: isDevelopment ? 10000 : 5000, // Timeout más largo en desarrollo
    actions: {
      login: 'login',
      register: 'register',
      submit: 'submit'
    }
  };
};

/**
 * Función para verificar si reCAPTCHA está configurado correctamente.
 * Se adapta para verificar solo la clave pública en el cliente.
 */
export function isRecaptchaConfigured(): boolean {
  if (typeof window !== 'undefined') {
    // En el lado del cliente, solo necesitamos la SITE KEY
    return !!RECAPTCHA_SITE_KEY;
  }
  // En el lado del servidor, necesitamos ambas claves
  return !!(RECAPTCHA_SITE_KEY && RECAPTCHA_SECRET_KEY);
}

/**
 * Función para obtener el site key de forma segura
 */
export function getRecaptchaSiteKey(): string {
  if (!RECAPTCHA_SITE_KEY) {
    console.error('reCAPTCHA site key no está configurada');
    return '';
  }
  return RECAPTCHA_SITE_KEY;
}