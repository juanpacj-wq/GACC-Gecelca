// lib/pila-utils.ts
import type { FechaCorte } from "@/types/pila";
import { getNthBusinessDayOfMonth, LIMITE_SEG_SOCIAL } from "./colombia-holidays";

/**
 * Calcula las fechas de pago PILA basadas en el NIT y el período de visita
 * Ahora usa el cálculo dinámico de días hábiles en lugar del archivo calendario.json
 * @param nit - NIT de la empresa
 * @param fechaInicio - Fecha de inicio de la visita
 * @param fechaFin - Fecha fin de la visita
 * @returns Array de fechas de pago de seguridad social
 */
export async function calcularFechasPagoPila(
  nit: number | string,
  fechaInicio: string,
  fechaFin: string
): Promise<FechaCorte[]> {
  // Convertir NIT a string y obtener los últimos dos dígitos
  const nitStr = String(nit);
  const ultimosDigitos = nitStr.slice(-2).padStart(2, '0'); // Asegurar 2 dígitos
  
  // Convertir fechas a objetos Date
  const inicioVisita = new Date(fechaInicio);
  const finVisita = new Date(fechaFin);
  
  // Buscar la información de pago correspondiente a los últimos dígitos del NIT
  const limiteSeg = LIMITE_SEG_SOCIAL.find(item => item.DIGITOS_NIT === ultimosDigitos);
  
  if (!limiteSeg) {
    console.warn(`No se encontró información para los dígitos del NIT: ${ultimosDigitos}, usando valor por defecto de 10 días hábiles`);
    // Valor por defecto si no se encuentra
    const defaultDias = 10;
    return calcularFechasConDiasHabiles(inicioVisita, finVisita, defaultDias);
  }
  
  // Obtener la cantidad de días hábiles requeridos para el pago
  const diasHabilesRequeridos = limiteSeg.DIAS_HABILES;
  
  return calcularFechasConDiasHabiles(inicioVisita, finVisita, diasHabilesRequeridos);
}

/**
 * Calcula las fechas de pago basándose en el número de días hábiles
 * @param inicioVisita - Fecha de inicio de la visita
 * @param finVisita - Fecha fin de la visita
 * @param diasHabilesRequeridos - Número de días hábiles para el pago
 * @returns Array de fechas de pago
 */
function calcularFechasConDiasHabiles(
  inicioVisita: Date,
  finVisita: Date,
  diasHabilesRequeridos: number
): FechaCorte[] {
  const fechasPago: FechaCorte[] = [];
  
  // Obtener el mes y año de inicio
  let mesActual = inicioVisita.getMonth();
  let anioActual = inicioVisita.getFullYear();
  
  // Obtener el mes y año de fin
  const mesFin = finVisita.getMonth();
  const anioFin = finVisita.getFullYear();
  
  let idCounter = 1;
  
  // Iterar por cada mes en el período
  while (anioActual < anioFin || (anioActual === anioFin && mesActual <= mesFin)) {
    // Obtener el N-ésimo día hábil del mes
    const diaPago = getNthBusinessDayOfMonth(anioActual, mesActual, diasHabilesRequeridos);
    
    if (diaPago) {
      // Verificar que el día de pago esté dentro del período de visita
      if (diaPago >= inicioVisita && diaPago <= finVisita) {
        // Formatear la fecha para mostrar
        const fechaFormateada = formatDate(diaPago);
        
        // Determinar el estado de la fecha basado en proximidad
        const diasHastaFecha = calcularDiasHastaFecha(diaPago);
        let estado: "success" | "warning" | "normal" = "normal";
        
        if (diasHastaFecha < 0) {
          // Fecha ya pasada
          estado = "normal";
        } else if (diasHastaFecha <= 10) {
          // Próxima a vencer (10 días o menos)
          estado = "warning";
        } else {
          // Fecha normal
          estado = "normal";
        }
        
        fechasPago.push({
          id: idCounter++,
          fecha: fechaFormateada,
          estado: estado,
          mesTexto: new Intl.DateTimeFormat('es-CO', { 
            month: 'long', 
            year: 'numeric' 
          }).format(diaPago)
        });
      }
    }
    
    // Avanzar al siguiente mes
    mesActual++;
    if (mesActual > 11) {
      mesActual = 0;
      anioActual++;
    }
  }
  
  // Si tenemos fechas, marcar la primera fecha futura como "success"
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < fechasPago.length; i++) {
    const [dia, mes, anio] = fechasPago[i].fecha.split('/').map(Number);
    const fechaCorte = new Date(anio, mes - 1, dia);
    
    if (fechaCorte >= hoy) {
      fechasPago[i].estado = "success";
      break;
    }
  }
  
  return fechasPago;
}

/**
 * Calcula los días hasta una fecha específica
 * @param fecha - Fecha objetivo
 * @returns Número de días (negativo si ya pasó)
 */
function calcularDiasHastaFecha(fecha: Date): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  
  const diferenciaMilisegundos = fecha.getTime() - hoy.getTime();
  return Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
}

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param date - Objeto Date
 * @returns Fecha formateada (DD/MM/YYYY)
 */
export function formatDate(date: Date): string {
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Parsea una fecha en formato DD/MM/YYYY a objeto Date
 * @param dateStr - String de fecha en formato DD/MM/YYYY
 * @returns Objeto Date
 */
export function parseDate(dateStr: string): Date {
  const [dia, mes, anio] = dateStr.split('/').map(Number);
  return new Date(anio, mes - 1, dia);
}

/**
 * Obtiene información sobre el estado de una fecha de pago PILA
 * @param fechaStr - Fecha en formato DD/MM/YYYY
 * @returns Objeto con información del estado
 */
export function getEstadoFechaPila(fechaStr: string): {
  estado: "success" | "warning" | "normal" | "overdue";
  mensaje: string;
  diasRestantes: number;
} {
  const fecha = parseDate(fechaStr);
  const diasRestantes = calcularDiasHastaFecha(fecha);
  
  if (diasRestantes < 0) {
    return {
      estado: "overdue",
      mensaje: `Vencida hace ${Math.abs(diasRestantes)} días`,
      diasRestantes
    };
  } else if (diasRestantes === 0) {
    return {
      estado: "warning",
      mensaje: "Vence hoy",
      diasRestantes
    };
  } else if (diasRestantes <= 10) {
    return {
      estado: "warning",
      mensaje: `Vence en ${diasRestantes} días`,
      diasRestantes
    };
  } else {
    return {
      estado: "normal",
      mensaje: `Faltan ${diasRestantes} días`,
      diasRestantes
    };
  }
}

/**
 * Valida si un NIT tiene el formato correcto
 * @param nit - NIT a validar
 * @returns true si el NIT es válido
 */
export function validarNIT(nit: string | number): boolean {
  const nitStr = String(nit).replace(/[^0-9]/g, '');
  
  // El NIT colombiano debe tener entre 8 y 10 dígitos
  if (nitStr.length < 8 || nitStr.length > 10) {
    return false;
  }
  
  return true;
}

/**
 * Obtiene los días hábiles de pago según los últimos dígitos del NIT
 * @param nit - NIT de la empresa
 * @returns Número de días hábiles para el pago
 */
export function getDiasHabilesPago(nit: string | number): number {
  const nitStr = String(nit);
  const ultimosDigitos = nitStr.slice(-2).padStart(2, '0');
  
  const limiteSeg = LIMITE_SEG_SOCIAL.find(item => item.DIGITOS_NIT === ultimosDigitos);
  
  if (!limiteSeg) {
    console.warn(`No se encontró información para los dígitos del NIT: ${ultimosDigitos}`);
    return 10; // Valor por defecto
  }
  
  return limiteSeg.DIAS_HABILES;
}