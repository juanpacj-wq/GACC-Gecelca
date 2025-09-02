// app/api/pila/fechas-corte/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerApiCredentials } from '@/lib/api-tokens';
import { calcularFechasPagoPila } from '@/lib/pila-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idSolicitud = searchParams.get('id_solicitud');

    if (!idSolicitud) {
      return NextResponse.json(
        { error: true, message: 'ID de solicitud es requerido' },
        { status: 400 }
      );
    }

    // Obtener las credenciales del servidor
    const { url, token } = getServerApiCredentials('SOLICITUD');

    if (!url || !token) {
      console.error('Credenciales de API no configuradas');
      return NextResponse.json(
        { error: true, message: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Obtener datos de la solicitud
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({ id_solicitud: idSolicitud }),
    });

    const solicitudData = await response.json();

    if (!response.ok || !solicitudData.Datos || !solicitudData.Datos.length) {
      return NextResponse.json(
        { 
          error: true, 
          message: solicitudData.mensaje || 'Error al consultar solicitud' 
        },
        { status: response.status || 500 }
      );
    }

    // Extraer los datos necesarios
    const datosSolicitud = solicitudData.Datos[0];
    const nit = datosSolicitud.NIT_CED;
    const fechaInicio = datosSolicitud.Fechainicio;
    const fechaFin = datosSolicitud.Fechafin;

    if (!nit || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { 
          error: true, 
          message: 'Datos insuficientes en la solicitud. Se requiere NIT, fecha inicio y fecha fin.' 
        },
        { status: 400 }
      );
    }

    // Validar que las fechas sean válidas
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    
    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      return NextResponse.json(
        { 
          error: true, 
          message: 'Las fechas de inicio o fin no son válidas' 
        },
        { status: 400 }
      );
    }

    if (fechaInicioDate >= fechaFinDate) {
      return NextResponse.json(
        { 
          error: true, 
          message: 'La fecha de inicio debe ser anterior a la fecha de fin' 
        },
        { status: 400 }
      );
    }

    try {
      // Calcular fechas de pago usando la nueva función simplificada
      const fechasCorte = await calcularFechasPagoPila(
        nit,
        fechaInicio,
        fechaFin
      );

      // Función para calcular días hasta la fecha
      const calcularDiasHastaFecha = (fechaStr: string): number => {
        const [dia, mes, año] = fechaStr.split('/').map(Number);
        const fechaCorte = new Date(año, mes - 1, dia);
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        fechaCorte.setHours(0, 0, 0, 0);
        
        const diferenciaMilisegundos = fechaCorte.getTime() - fechaActual.getTime();
        return Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
      };

      // Actualizar los estados de las fechas basado en la fecha actual
      const fechasConEstadoActualizado = fechasCorte.map(fecha => {
        const diasHastaFecha = calcularDiasHastaFecha(fecha.fecha);
        
        let estado: "success" | "warning" | "normal" = fecha.estado;
        
        // Lógica adicional de estados si es necesario
        if (diasHastaFecha < 0) {
          // Si la fecha ya pasó, mantener como normal (el frontend puede manejar esto)
          estado = "normal";
        } else if (diasHastaFecha === 0) {
          // Si es hoy, warning
          estado = "warning";
        } else if (diasHastaFecha <= 10) {
          // Si está a 10 días o menos, warning
          estado = "warning";
        }
        
        // La primera fecha futura se marca como success en pila-utils.ts
        
        return {
          ...fecha,
          estado,
          diasRestantes: diasHastaFecha
        };
      });

      // Log para debugging
      console.log(`Fechas de PILA calculadas para NIT ${nit}:`, fechasConEstadoActualizado.length);

      // Devolver las fechas calculadas
      return NextResponse.json({
        success: true,
        fechas: fechasConEstadoActualizado,
        metadata: {
          nit: nit.toString().slice(-2).padStart(2, '0'), // Últimos 2 dígitos del NIT
          totalFechas: fechasConEstadoActualizado.length,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin
        }
      });

    } catch (calcError) {
      console.error('Error al calcular fechas de PILA:', calcError);
      
      // Si hay error en el cálculo, devolver fechas predeterminadas como fallback
      const fechasPredeterminadas = generarFechasPredeterminadas(fechaInicio, fechaFin);
      
      return NextResponse.json({
        success: true,
        fechas: fechasPredeterminadas,
        warning: 'Se usaron fechas predeterminadas debido a un error en el cálculo',
        metadata: {
          nit: nit.toString().slice(-2).padStart(2, '0'),
          totalFechas: fechasPredeterminadas.length,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin
        }
      });
    }

  } catch (error) {
    console.error('Error en el endpoint de fechas de corte:', error);
    return NextResponse.json(
      { 
        error: true, 
        message: 'Error interno del servidor, por favor revise su conexión',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * Genera fechas predeterminadas como fallback
 * @param fechaInicio - Fecha de inicio en formato ISO
 * @param fechaFin - Fecha de fin en formato ISO
 * @returns Array de fechas de corte predeterminadas
 */
function generarFechasPredeterminadas(fechaInicio: string, fechaFin: string) {
  const fechas = [];
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  let mesActual = inicio.getMonth();
  let anioActual = inicio.getFullYear();
  let id = 1;
  
  // Generar una fecha por cada mes en el período (día 10 de cada mes como predeterminado)
  while (anioActual < fin.getFullYear() || 
         (anioActual === fin.getFullYear() && mesActual <= fin.getMonth())) {
    
    // Usar el día 10 de cada mes como fecha predeterminada
    const fechaPago = new Date(anioActual, mesActual, 10);
    
    // Solo incluir si está dentro del período
    if (fechaPago >= inicio && fechaPago <= fin) {
      const dia = fechaPago.getDate().toString().padStart(2, '0');
      const mes = (fechaPago.getMonth() + 1).toString().padStart(2, '0');
      const anio = fechaPago.getFullYear();
      
      fechas.push({
        id: id++,
        fecha: `${dia}/${mes}/${anio}`,
        estado: "normal" as "success" | "warning" | "normal",
        mesTexto: new Intl.DateTimeFormat('es-CO', { 
          month: 'long', 
          year: 'numeric' 
        }).format(fechaPago)
      });
    }
    
    // Avanzar al siguiente mes
    mesActual++;
    if (mesActual > 11) {
      mesActual = 0;
      anioActual++;
    }
  }
  
  // Marcar la primera fecha como success si existe
  if (fechas.length > 0) {
    fechas[0].estado = "success";
  }
  
  return fechas;
}