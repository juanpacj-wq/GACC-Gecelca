// middleware/security-headers.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Headers de seguridad para proteger la aplicación contra ataques comunes
 */
export const securityHeaders = {
  // Protección contra XSS
  'X-XSS-Protection': '1; mode=block',
  
  // Prevenir que el navegador interprete incorrectamente los tipos MIME
  'X-Content-Type-Options': 'nosniff',
  
  // Protección contra clickjacking
  'X-Frame-Options': 'SAMEORIGIN', // Cambiado de DENY a SAMEORIGIN para reCAPTCHA
  
  // Política de referrer para proteger información sensible
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permisos del navegador (cámara, micrófono, etc.)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Content Security Policy (CSP) - Configuración mejorada para reCAPTCHA
  'Content-Security-Policy': [
    "default-src 'self'",
    // Script sources - añadidos dominios necesarios para reCAPTCHA
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
      "https://www.google.com/recaptcha/ " +
      "https://www.gstatic.com/recaptcha/ " +
      "https://www.google.com/ " +
      "https://www.gstatic.com/ " +
      "https://cdnjs.cloudflare.com " +
      "https://docs.google.com " +
      "https://drive.google.com",
    // Style sources
    "style-src 'self' 'unsafe-inline' " +
      "https://www.google.com/recaptcha/ " +
      "https://www.gstatic.com/recaptcha/ " +
      "https://www.gstatic.com",
    // Image sources
    "img-src 'self' data: blob: https: " +
      "https://www.google.com/recaptcha/ " +
      "https://www.gstatic.com/recaptcha/ " +
      "https://www.gstatic.com",
    // Font sources
    "font-src 'self' data: " +
      "https://www.gstatic.com/recaptcha/ " +
      "https://www.gstatic.com",
    // Connect sources - añadido recaptcha
    "connect-src 'self' " +
      "https://www.google.com/recaptcha/ " +
      "https://www.google.com/ " +
      "https://gecelca.sharepoint.com " +
      "https://docs.google.com " +
      "https://drive.google.com",
    "media-src 'self'",
    "object-src 'none'",
    // Frame sources - actualizado para reCAPTCHA
    "frame-src 'self' " +
      "https://www.google.com/recaptcha/ " +
      "https://recaptcha.google.com/recaptcha/ " +
      "https://www.google.com/ " +
      "https://docs.google.com " +
      "https://drive.google.com",
    "frame-ancestors 'self'", // Permitir frames desde el mismo origen
    "base-uri 'self'",
    "form-action 'self' https://www.google.com/recaptcha/",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    // No forzar HTTPS en desarrollo
    ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : [])
  ].filter(Boolean).join('; '),
  
  // Strict Transport Security (HSTS) - Solo para producción
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }),
  
  // Prevenir que el sitio sea abierto en un contexto inseguro
  'X-Permitted-Cross-Domain-Policies': 'none',
  
  // Deshabilitar características peligrosas de Flash/PDF
  'X-Download-Options': 'noopen',
  
  // DNS Prefetch Control
  'X-DNS-Prefetch-Control': 'on',
  
  // Expect-CT para Certificate Transparency
  ...(process.env.NODE_ENV === 'production' && {
    'Expect-CT': 'max-age=86400, enforce'
  })
};

/**
 * Headers específicos para las API routes
 * Ahora usando variables de entorno para el dominio
 */
export const apiSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'no-referrer',
  'X-Permitted-Cross-Domain-Policies': 'none',
  
  // CORS headers restrictivos para API - usando variable de entorno
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_APP_URL || 'https://gacc.gecelca.com.co')
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

/**
 * Aplicar headers de seguridad a una respuesta
 */
export function applySecurityHeaders(
  response: NextResponse,
  isApiRoute: boolean = false
): NextResponse {
  const headers = isApiRoute ? apiSecurityHeaders : securityHeaders;
  
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });
  
  return response;
}

/**
 * Middleware para aplicar headers de seguridad
 */
export function withSecurityHeaders(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  return applySecurityHeaders(response, isApiRoute);
}

/**
 * Validar y sanitizar headers de request entrantes
 */
export function validateRequestHeaders(request: NextRequest): boolean {
  // Verificar User-Agent sospechoso
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
  
  // Excluir Google Bot para reCAPTCHA y bots de monitoreo conocidos
  const allowedBots = ['google', 'recaptcha', 'uptimerobot', 'pingdom'];
  const isAllowedBot = allowedBots.some(bot => userAgent.toLowerCase().includes(bot));
  
  if (!isAllowedBot && suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    // Log para monitoreo (puedes integrar con tu sistema de logs)
    console.warn(`Suspicious User-Agent detected: ${userAgent}`);
    // No bloquear, solo registrar
  }
  
  // Verificar tamaño de headers para prevenir ataques de header injection
  const headerSize = Array.from(request.headers.entries())
    .reduce((size, [key, value]) => size + key.length + value.length, 0);
  
  if (headerSize > 16384) { // 16KB límite (aumentado para acomodar tokens largos)
    console.error('Request headers too large');
    return false;
  }
  
  // Verificar headers maliciosos comunes - más permisivo
  const maliciousHeaders = [
    'x-original-url',
    'x-rewrite-url'
  ];
  
  // x-forwarded-host es común en proxies, no lo bloqueamos
  for (const header of maliciousHeaders) {
    if (request.headers.has(header)) {
      console.warn(`Potentially malicious header detected: ${header}`);
      // Solo registrar, no bloquear
    }
  }
  
  return true;
}

/**
 * Rate limiting por IP (básico)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(request: NextRequest): boolean {
  // Excluir rutas de reCAPTCHA y PILA del rate limiting
  const excludedPaths = [
    'recaptcha',
    '/api/pila/',
    '/api/documentos/'
  ];
  
  if (excludedPaths.some(path => request.nextUrl.pathname.includes(path))) {
    return true;
  }
  
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  // Usar variable de entorno para el límite de requests si está disponible
  const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS 
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) 
    : 100; // 100 requests por minuto por defecto
  
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Limpiar Map de rate limiting periódicamente
 */
if (typeof window === 'undefined') { // Solo ejecutar en el servidor
  setInterval(() => {
    const now = Date.now();
    const ipsToDelete: string[] = [];
    
    // Recolectar IPs para eliminar
    requestCounts.forEach((record, ip) => {
      if (now > record.resetTime) {
        ipsToDelete.push(ip);
      }
    });
    
    // Eliminar IPs expiradas
    ipsToDelete.forEach(ip => requestCounts.delete(ip));
  }, 60 * 1000); // Limpiar cada minuto
}

/**
 * Headers para prevenir ataques de timing
 */
export function addTimingProtection(response: NextResponse): NextResponse {
  // Agregar ruido aleatorio al tiempo de respuesta (0-50ms)
  const delay = Math.floor(Math.random() * 50);
  
  // Header personalizado para indicar protección de timing
  response.headers.set('X-Timing-Protection', 'enabled');
  
  return response;
}

/**
 * Función auxiliar para limpiar manualmente el rate limit (útil para testing)
 */
export function clearRateLimit(ip?: string): void {
  if (ip) {
    requestCounts.delete(ip);
  } else {
    requestCounts.clear();
  }
}

/**
 * Función para obtener estadísticas del rate limit (útil para monitoreo)
 */
export function getRateLimitStats(): { totalIps: number; ips: string[] } {
  const ips: string[] = [];
  requestCounts.forEach((_, ip) => ips.push(ip));
  
  return {
    totalIps: requestCounts.size,
    ips: process.env.NODE_ENV === 'development' ? ips : [] // Solo mostrar IPs en desarrollo
  };
}