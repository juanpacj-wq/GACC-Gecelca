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
    sameSite: 'strict',
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
 * Modificado para usar la API route en lugar de llamar directamente al servicio externo
 */
export const login = async (credentials: LoginCredentials): Promise<{success: boolean, message?: string}> => {
  try {
    // Ahora llamamos a nuestra API route local en lugar del servicio externo
    const response = await fetch('/api/auth/login', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    // Verificar respuesta
    if (response.ok && !data.error) {
      // Generar un token de sesión (en producción, este token vendría del backend)
      const sessionToken = btoa(JSON.stringify({ 
        userId: data.id || 'default-id',
        exp: Date.now() + TOKEN_DURATION * 1000
      }));
      
      // Guardar el token en una cookie
      setCookie(AUTH_TOKEN_KEY, sessionToken, { 
        maxAge: TOKEN_DURATION,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Guardar datos básicos del usuario
      const userData: AuthUser = {
        id: data.id || 'default-id',
        name: data.nombre || credentials.usuario,
        email: data.email || `${credentials.usuario}@example.com`,
        role: data.role || 'user'
      };
      
      setCookie(USER_DATA_KEY, JSON.stringify(userData));
      
      return { success: true };
    } else {
      return { 
        success: false, 
        message: data.message || 'Error de autenticación. Verifique sus credenciales.'
      };
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
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
    
    return true;
  } catch (error) {
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