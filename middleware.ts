// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { 
  withSecurityHeaders, 
  validateRequestHeaders, 
  checkRateLimit,
  addTimingProtection 
} from './middleware/security-headers'

// Definir las rutas protegidas y las rutas de autenticación
const protectedPaths = ['/dashboard']
const authPaths = ['/', '/code']

// Rutas excluidas del rate limiting (archivos estáticos, etc.)
const rateLimitExcludedPaths = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/logo.png',
  '/nav.png',
  '/fondo.png'
]

export function middleware(request: NextRequest) {
  // Verificar si la ruta está excluida del rate limiting
  const isExcludedFromRateLimit = rateLimitExcludedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Aplicar rate limiting solo a rutas no excluidas
  if (!isExcludedFromRateLimit && !checkRateLimit(request)) {
    // Retornar respuesta 429 Too Many Requests con headers de seguridad
    const response = NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
    
    // Aplicar headers de seguridad incluso en respuestas de error
    const secureResponse = withSecurityHeaders(request);
    
    // Copiar headers de seguridad a la respuesta de error
    secureResponse.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    // Agregar header Retry-After
    response.headers.set('Retry-After', '60');
    
    return response;
  }

  // Validar headers de la petición
  if (!validateRequestHeaders(request)) {
    const response = NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
    
    // Aplicar headers de seguridad
    const secureResponse = withSecurityHeaders(request);
    secureResponse.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // Obtener la ruta actual
  const path = request.nextUrl.pathname

  // Verificar si hay un token en las cookies (indicativo de sesión)
  const authToken = request.cookies.get('auth_token')?.value
  const isAuthenticated = !!authToken

  // Si intenta acceder a una ruta protegida sin autenticación
  if (protectedPaths.some(route => path.startsWith(route)) && !isAuthenticated) {
    // Redirigir al login con la URL original como parámetro de retorno
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('returnUrl', path)
    const response = NextResponse.redirect(redirectUrl)
    
    // Aplicar headers de seguridad a la redirección
    return withSecurityHeaders(request);
  }

  // Para todas las demás rutas, continuar con headers de seguridad
  let response = NextResponse.next()
  
  // Aplicar headers de seguridad
  response = withSecurityHeaders(request);
  
  // Agregar protección de timing para rutas sensibles
  if (path.startsWith('/api/auth') || path.startsWith('/api/solicitud')) {
    response = addTimingProtection(response);
  }

  // Headers adicionales para rutas específicas
  if (path.startsWith('/api/')) {
    // Deshabilitar caché para API routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
  } else {
    // Para páginas HTML, establecer caché apropiado
    if (path === '/' || authPaths.includes(path)) {
      // Páginas públicas pueden tener un caché corto
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400')
    } else if (protectedPaths.some(route => path.startsWith(route))) {
      // Páginas protegidas no deben ser cacheadas
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }
  }

  // Protección CSRF para métodos que modifican estado
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    // Verificar que el origin coincida con el host esperado
    if (origin && host) {
      const expectedOrigins = [
        `https://${host}`,
        `http://${host}`,
        process.env.NEXT_PUBLIC_APP_URL
      ].filter(Boolean)
      
      if (!expectedOrigins.some(expected => origin === expected)) {
        console.warn(`CSRF protection: Invalid origin ${origin} for host ${host}`)
        
        // En producción, podrías querer bloquear estas peticiones
        if (process.env.NODE_ENV === 'production') {
          const response = NextResponse.json(
            { error: 'Invalid request origin' },
            { status: 403 }
          )
          
          // Aplicar headers de seguridad
          const secureResponse = withSecurityHeaders(request);
          secureResponse.headers.forEach((value, key) => {
            response.headers.set(key, value);
          });
          
          return response;
        }
      }
    }
  }

  // Log de seguridad para monitoreo (en producción, usar un servicio de logging)
  if (process.env.NODE_ENV === 'production') {
    // Log básico de acceso
    console.log({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.nextUrl.pathname,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      authenticated: isAuthenticated
    })
  }

  return response
}

// Configurar el middleware para que se ejecute en todas las rutas
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas incluyendo:
     * - API routes (/api/)
     * - Rutas de aplicación
     * - Archivos estáticos cuando sea necesario aplicar headers
     */
    '/((?!_next/static|_next/image).*)',
  ],
}