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
  login: (username: string, password: string) => Promise<{success: boolean, message?: string}>;
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
      const isUserAuthenticated = checkAuth();
      setIsAuthenticated(isUserAuthenticated);
      
      if (isUserAuthenticated) {
        setUser(getAuthUser());
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };

    checkAuthentication();
    
    // También verificar cuando la ventana recibe el foco
    // (útil para detectar cuando expira el token en otra pestaña)
    const handleFocus = () => {
      checkAuthentication();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Función de login
  const login = async (username: string, password: string) => {
    const result = await authLogin({ usuario: username, password });
    
    if (result.success) {
      setIsAuthenticated(true);
      setUser(getAuthUser());
    }
    
    return result;
  };

  // Función de logout
  const logout = () => {
    authLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}