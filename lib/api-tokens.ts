// lib/api-tokens.ts
interface ApiEndpoint {
  url: string;
  token: string;
}
const isServer = typeof window === 'undefined';
const API_ENDPOINTS: Record<string, ApiEndpoint> = {
  // Auth endpoints
  AUTH_LOGIN: {
    url: isServer ? (process.env.AUTH_LOGIN_URL || '') : '/api/auth/login',
    token: isServer ? (process.env.AUTH_LOGIN_TOKEN || '') : '',
  },
  
  // Solicitud endpoints
  SOLICITUD: {
    url: isServer ? (process.env.SOLICITUD_URL || '') : '/api/solicitud',
    token: isServer ? (process.env.SOLICITUD_TOKEN || '') : '',
  },
  
  // Personas endpoints
  PERSONAS: {
    url: isServer ? (process.env.PERSONAS_URL || '') : '/api/personas',
    token: isServer ? (process.env.PERSONAS_TOKEN || '') : '',
  },
  REGISTER_PERSONA: {
    url: isServer ? (process.env.REGISTER_PERSONA_URL || '') : '/api/personas/register',
    token: isServer ? (process.env.REGISTER_PERSONA_TOKEN || '') : '',
  },
  
  // Vehiculos endpoints
  VEHICULOS: {
    url: isServer ? (process.env.VEHICULOS_URL || '') : '/api/vehiculos',
    token: isServer ? (process.env.VEHICULOS_TOKEN || '') : '',
  },
  REGISTER_VEHICULO: {
    url: isServer ? (process.env.REGISTER_VEHICULO_URL || '') : '/api/vehiculos/register',
    token: isServer ? (process.env.REGISTER_VEHICULO_TOKEN || '') : '',
  },
  
  // Documentos endpoints
  UPLOAD_DOCUMENTO: {
    url: isServer ? (process.env.UPLOAD_DOCUMENTO_URL || '') : '/api/documentos/upload',
    token: isServer ? (process.env.UPLOAD_DOCUMENTO_TOKEN || '') : '',
  },
  
  // Ver adjuntos endpoint - NUEVO
  VER_ADJUNTOS: {
    url: isServer ? (process.env.VER_ADJUNTOS_PERSONA_URL || '') : '/api/documentos/consultar',
    token: isServer ? (process.env.VER_ADJUNTOS_PERSONA_TOKEN || '') : '',
  },
  
  // Ver adjuntos vehículo endpoint
  VER_ADJUNTOS_VEHICULO: {
    url: isServer ? (process.env.VER_ADJUNTOS_VEHICULO_URL || '') : '/api/documentos/consultar',
    token: isServer ? (process.env.VER_ADJUNTOS_VEHICULO_TOKEN || '') : '',
  },
  
  // Carga masiva endpoints
  CARGA_MASIVA: {
    url: isServer ? (process.env.CARGA_MASIVA_URL || '') : '/api/personas/carga-masiva',
    token: isServer ? (process.env.CARGA_MASIVA_TOKEN || '') : '',
  },
  
  // Novedades endpoints
  NOVEDAD_PERSONA: {
    url: isServer ? (process.env.NOVEDAD_PERSONA_URL || '') : '/api/personas/novedad',
    token: isServer ? (process.env.NOVEDAD_PERSONA_TOKEN || '') : '',
  },
  
  // Terminar solicitud endpoints
  TERMINAR_SOLICITUD: {
    url: isServer ? (process.env.TERMINAR_SOLICITUD_URL || '') : '/api/solicitud/terminar',
    token: isServer ? (process.env.TERMINAR_SOLICITUD_TOKEN || '') : '',
  },
};

/**
 * Obtiene la información de un endpoint de API por su clave
 * @param key - Clave del endpoint en el objeto API_ENDPOINTS
 * @returns Objeto con la URL y el token del endpoint
 */
export const getApiEndpoint = (key: string): ApiEndpoint => {
  if (!API_ENDPOINTS[key]) {
    console.error(`Endpoint API no encontrado: ${key}`);
    return { url: '', token: '' };
  }
  return API_ENDPOINTS[key];
};

/**
 * Crea los headers para una petición a la API
 * @param key - Clave del endpoint en el objeto API_ENDPOINTS
 * @param additionalHeaders - Headers adicionales para la petición
 * @returns Objeto con los headers para la petición
 */
export const createApiHeaders = (key: string, additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  const { token } = getApiEndpoint(key);
  
  // En el cliente, no incluimos el x-auth-token ya que será manejado por el servidor
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  // Solo agregar el token si estamos en el servidor
  if (isServer && token) {
    headers['x-auth-token'] = token;
  }
  
  return headers;
};

/**
 * Función para realizar una petición a la API
 * Modificada para funcionar tanto en cliente como servidor
 * @param key - Clave del endpoint en el objeto API_ENDPOINTS
 * @param data - Datos a enviar en la petición
 * @param additionalHeaders - Headers adicionales para la petición
 * @returns Promesa con la respuesta de la petición
 */
export const fetchFromApi = async <T>(
  key: string, 
  data: any, 
  additionalHeaders: Record<string, string> = {}
): Promise<T> => {
  const { url } = getApiEndpoint(key);
  const headers = createApiHeaders(key, additionalHeaders);
  
  // Si estamos en el cliente, agregar el endpoint key para que el servidor sepa qué API llamar
  const bodyData = isServer ? data : { ...data, _endpoint: key };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la petición: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error al realizar la petición a ${key}:`, error);
    throw error;
  }
};

/**
 * Función específica para uso en el servidor
 * Obtiene directamente las credenciales de las variables de entorno
 */
export const getServerApiCredentials = (key: string): ApiEndpoint => {
  const endpoints: Record<string, ApiEndpoint> = {
    AUTH_LOGIN: {
      url: process.env.AUTH_LOGIN_URL || '',
      token: process.env.AUTH_LOGIN_TOKEN || '',
    },
    SOLICITUD: {
      url: process.env.SOLICITUD_URL || '',
      token: process.env.SOLICITUD_TOKEN || '',
    },
    PERSONAS: {
      url: process.env.PERSONAS_URL || '',
      token: process.env.PERSONAS_TOKEN || '',
    },
    REGISTER_PERSONA: {
      url: process.env.REGISTER_PERSONA_URL || '',
      token: process.env.REGISTER_PERSONA_TOKEN || '',
    },
    VEHICULOS: {
      url: process.env.VEHICULOS_URL || '',
      token: process.env.VEHICULOS_TOKEN || '',
    },
    REGISTER_VEHICULO: {
      url: process.env.REGISTER_VEHICULO_URL || '',
      token: process.env.REGISTER_VEHICULO_TOKEN || '',
    },
    UPLOAD_DOCUMENTO: {
      url: process.env.UPLOAD_DOCUMENTO_URL || '',
      token: process.env.UPLOAD_DOCUMENTO_TOKEN || '',
    },
    VER_ADJUNTOS: {
      url: process.env.VER_ADJUNTOS_PERSONA_URL || '',
      token: process.env.VER_ADJUNTOS_PERSONA_TOKEN || '',
    },
    VER_ADJUNTOS_VEHICULO: {
      url: process.env.VER_ADJUNTOS_VEHICULO_URL || '',
      token: process.env.VER_ADJUNTOS_VEHICULO_TOKEN || '',
    },
    CARGA_MASIVA: {
      url: process.env.CARGA_MASIVA_URL || '',
      token: process.env.CARGA_MASIVA_TOKEN || '',
    },
    NOVEDAD_PERSONA: {
      url: process.env.NOVEDAD_PERSONA_URL || '',
      token: process.env.NOVEDAD_PERSONA_TOKEN || '',
    },
    TERMINAR_SOLICITUD: {
      url: process.env.TERMINAR_SOLICITUD_URL || '',
      token: process.env.TERMINAR_SOLICITUD_TOKEN || '',
    },
  };
  
  return endpoints[key] || { url: '', token: '' };
};

export default API_ENDPOINTS;