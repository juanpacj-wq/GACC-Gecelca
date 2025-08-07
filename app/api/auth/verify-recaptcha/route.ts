// app/api/auth/verify-recaptcha/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptchaTokenServer, RECAPTCHA_SECRET_KEY } from '@/lib/recaptcha';

export async function POST(request: NextRequest) {
  try {
    // Obtener el token del cuerpo de la petición
    const body = await request.json();
    const { token } = body;

    // Validar que se recibió el token
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token de reCAPTCHA no proporcionado' },
        { status: 400 }
      );
    }

    // Verificar el token con la API de Google
    const verificationResult = await verifyRecaptchaTokenServer(token, RECAPTCHA_SECRET_KEY);

    // Si la verificación no fue exitosa
    if (!verificationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Verificación de reCAPTCHA fallida',
          error_codes: verificationResult.error_codes
        },
        { status: 400 }
      );
    }

    // Devolver la respuesta exitosa con la puntuación
    return NextResponse.json({
      success: true,
      score: verificationResult.score,
      action: verificationResult.action,
      challenge_ts: verificationResult.challenge_ts,
      hostname: verificationResult.hostname
    });

  } catch (error) {
    console.error('Error en el endpoint de verificación de reCAPTCHA:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor al verificar reCAPTCHA' 
      },
      { status: 500 }
    );
  }
}