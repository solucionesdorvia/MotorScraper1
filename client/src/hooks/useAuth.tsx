import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

export interface User {
  id: number;
  email: string;
  nombre: string | null;
  apellido: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { email: string; password: string; nombre?: string; apellido?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Verificar si el usuario tiene sesión al cargar la página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        // Si hay un error, el usuario no está autenticado
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Función para iniciar sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };
  
  // Función para registrar un usuario
  const register = async (userData: { email: string; password: string; nombre?: string; apellido?: string }): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        setUser(response.data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };
  
  // Función para cerrar sesión
  const logout = async (): Promise<void> => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  
  const contextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
  return useContext(AuthContext);
}