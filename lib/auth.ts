// lib/auth.ts
import { NextRequest } from 'next/server';
import { parse, serialize } from 'cookie';

// Tipo para el usuario autenticado
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Tipo para las credenciales de inicio de sesión
export interface LoginCredentials {
  usuario: string;
  password: string;
  recaptchaToken?: string;
}

// Token de autenticación en cookies
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Duración del token (7 días)
const TOKEN_DURATION = 60 * 60 * 24 * 7;

// Función para establecer una cookie
export const setCookie = (name: string, value: string, options: any = {}) => {
  if (typeof window === 'undefined') return;
  
  const cookieOptions = {
    path: '/',
    maxAge: TOKEN_DURATION,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    ...options
  };
  
  document.cookie = serialize(name, String(value), cookieOptions);
};

// Función para obtener una cookie
export const getCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  const cookies = parse(document.cookie);
  return cookies[name];
};

// Función para eliminar una cookie
export const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  
  document.cookie = serialize(name, '', {
    maxAge: -1,
    path: '/'
  });
};

/**
 * Iniciar sesión y guardar el token en cookies
 * Modificado para incluir verificación de reCAPTCHA mejorada
 */
export const login = async (
  usuario: string, 
  password: string, 
  recaptchaToken?: string
): Promise<{success: boolean, message?: string}> => {
  try {
    // Validaciones básicas
    if (!usuario || !password) {
      return { 
        success: false, 
        message: 'Usuario y contraseña son requeridos' 
      };
    }

    // Verificar si se proporcionó un token de reCAPTCHA
    if (!recaptchaToken) {
      console.error('No reCAPTCHA token provided');
      return { 
        success: false, 
        message: 'Verificación de seguridad requerida. Por favor, recargue la página.' 
      };
    }

    console.log('Attempting login with reCAPTCHA token');

    // Llamamos a nuestra API route local que incluye la verificación de reCAPTCHA
    const response = await fetch('/api/auth/login', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        usuario, 
        password, 
        recaptchaToken 
      }),
      // Añadir credenciales para cookies
      credentials: 'same-origin'
    });
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      return { 
        success: false, 
        message: 'Error en la respuesta del servidor' 
      };
    }
    
    // Verificar respuesta
    if (response.ok && !data.error) {
      console.log('Login successful, setting cookies');
      
      // Generar un token de sesión (en producción, este token vendría del backend)
      const sessionToken = btoa(JSON.stringify({ 
        userId: data.id || 'default-id',
        timestamp: Date.now(),
        exp: Date.now() + TOKEN_DURATION * 1000
      }));
      
      // Guardar el token en una cookie con opciones seguras
      setCookie(AUTH_TOKEN_KEY, sessionToken, { 
        maxAge: TOKEN_DURATION,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        httpOnly: false // No podemos usar httpOnly desde el cliente
      });
      
      // Guardar datos básicos del usuario
      const userData: AuthUser = {
        id: data.id || 'default-id',
        name: data.nombre || usuario,
        email: data.email || `${usuario}@example.com`,
        role: data.role || 'user'
      };
      
      setCookie(USER_DATA_KEY, JSON.stringify(userData), {
        maxAge: TOKEN_DURATION,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return { success: true };
    } else {
      console.error('Login failed:', data);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error de autenticación';
      
      if (data.message) {
        errorMessage = data.message;
      } else if (response.status === 400) {
        errorMessage = 'Solicitud inválida. Por favor, verifique sus datos.';
      } else if (response.status === 401) {
        errorMessage = 'Credenciales incorrectas.';
      } else if (response.status === 429) {
        errorMessage = 'Demasiados intentos. Por favor, espere un momento.';
      } else if (response.status >= 500) {
        errorMessage = 'Error del servidor. Por favor, intente más tarde.';
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  } catch (error) {
    console.error('Error durante el proceso de login:', error);
    
    // Verificar si es un error de red
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return { 
        success: false, 
        message: 'Error de conexión. Por favor, verifique su conexión a internet.'
      };
    }
    
    return { 
      success: false, 
      message: 'Error al conectar con el servidor. Intente nuevamente más tarde.'
    };
  }
};

/**
 * Cerrar sesión y eliminar el token
 */
export const logout = () => {
  deleteCookie(AUTH_TOKEN_KEY);
  deleteCookie(USER_DATA_KEY);
  
  // Limpiar cualquier dato en localStorage o sessionStorage si existe
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      sessionStorage.clear();
    } catch (e) {
      // Ignorar errores si el storage no está disponible
    }
  }
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  const token = getCookie(AUTH_TOKEN_KEY);
  if (!token) return false;
  
  try {
    // Decodificar el token para verificar su validez
    const decoded = JSON.parse(atob(token));
    
    // Verificar si el token ha expirado
    if (decoded.exp && decoded.exp < Date.now()) {
      logout(); // Eliminar token expirado
      return false;
    }
    
    // Verificar que el token tenga los campos necesarios
    if (!decoded.userId || !decoded.timestamp) {
      logout(); // Token inválido
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    logout(); // Eliminar token inválido
    return false;
  }
};

/**
 * Obtener datos del usuario autenticado
 */
export const getAuthUser = (): AuthUser | null => {
  if (!isAuthenticated()) return null;
  
  const userData = getCookie(USER_DATA_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Verificar si el usuario tiene un rol específico
 */
export const hasRole = (role: string): boolean => {
  const user = getAuthUser();
  return user?.role === role;
};

/**
 * Obtener el token de autenticación para las peticiones
 */
export const getAuthToken = (): string | null => {
  return getCookie(AUTH_TOKEN_KEY) || null;
};

/**
 * Función para obtener el token desde el servidor
 */
export const getServerAuthToken = (request: NextRequest): string | undefined => {
  return request.cookies.get(AUTH_TOKEN_KEY)?.value;
};

/**
 * Función para refrescar el token (extender la sesión)
 */
export const refreshToken = (): boolean => {
  const token = getCookie(AUTH_TOKEN_KEY);
  const userData = getCookie(USER_DATA_KEY);
  
  if (!token || !userData) return false;
  
  try {
    // Decodificar el token actual
    const decoded = JSON.parse(atob(token));
    
    // Crear un nuevo token con tiempo extendido
    const newToken = btoa(JSON.stringify({
      ...decoded,
      timestamp: Date.now(),
      exp: Date.now() + TOKEN_DURATION * 1000
    }));
    
    // Actualizar el token
    setCookie(AUTH_TOKEN_KEY, newToken, {
      maxAge: TOKEN_DURATION,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Refrescar también los datos del usuario
    setCookie(USER_DATA_KEY, userData, {
      maxAge: TOKEN_DURATION,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};