// contexts/AuthContext.tsx
"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  AuthUser, 
  getAuthUser, 
  isAuthenticated as checkAuth, 
  login as authLogin,
  logout as authLogout
} from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, recaptchaToken?: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
}

// Valor por defecto del contexto
const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
};

// Crear el contexto
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar el estado de autenticación al montar el componente
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const isUserAuthenticated = checkAuth();
        setIsAuthenticated(isUserAuthenticated);
        
        if (isUserAuthenticated) {
          const userData = getAuthUser();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
    
    // También verificar cuando la ventana recibe el foco
    // (útil para detectar cuando expira el token en otra pestaña)
    const handleFocus = () => {
      if (!isLoading) {
        checkAuthentication();
      }
    };
    
    // Verificar cambios en el storage (para sincronizar entre pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'user_data') {
        checkAuthentication();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Función de login con soporte para reCAPTCHA token
  const login = async (
    username: string, 
    password: string, 
    recaptchaToken?: string
  ): Promise<{success: boolean, message?: string}> => {
    try {
      // Validaciones básicas
      if (!username || !password) {
        return {
          success: false,
          message: 'Usuario y contraseña son requeridos'
        };
      }

      // Verificar que se haya proporcionado el token de reCAPTCHA
      if (!recaptchaToken) {
        console.warn('No reCAPTCHA token provided to login function');
        return {
          success: false,
          message: 'Token de verificación de seguridad requerido'
        };
      }

      console.log('Attempting login with username:', username.substring(0, 3) + '***');
      
      // Llamar a la función de login del módulo auth
      const result = await authLogin(username, password, recaptchaToken);
      
      if (result.success) {
        console.log('Login successful, updating context');
        
        // Actualizar el estado del contexto
        setIsAuthenticated(true);
        const userData = getAuthUser();
        setUser(userData);
        
        // Disparar evento personalizado para notificar a otros componentes
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-login', { 
            detail: { user: userData } 
          }));
        }
      } else {
        console.log('Login failed:', result.message);
        setIsAuthenticated(false);
        setUser(null);
      }
      
      return result;
    } catch (error) {
      console.error('Unexpected error in login:', error);
      
      // Resetear estado en caso de error
      setIsAuthenticated(false);
      setUser(null);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error inesperado al iniciar sesión'
      };
    }
  };

  // Función de logout
  const logout = () => {
    try {
      console.log('Logging out user');
      
      // Llamar a la función de logout del módulo auth
      authLogout();
      
      // Actualizar el estado del contexto
      setIsAuthenticated(false);
      setUser(null);
      
      // Disparar evento personalizado para notificar a otros componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-logout'));
      }
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Asegurar que el estado se resetee incluso si hay un error
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Valor del contexto
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}