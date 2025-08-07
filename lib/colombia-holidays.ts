// lib/colombia-holidays.ts

/**
 * Sistema para calcular días festivos en Colombia
 * Incluye festivos fijos y móviles según la ley colombiana
 */

interface Holiday {
  date: Date;
  name: string;
  type: 'fixed' | 'easter' | 'movable';
}

/**
 * Calcula la fecha de Pascua usando el algoritmo de Gauss
 * @param year - Año para calcular
 * @returns Fecha de domingo de Pascua
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // -1 porque JS usa 0-11 para meses
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
}

/**
 * Mueve una fecha al siguiente lunes si cae en día diferente
 * (Ley Emiliani en Colombia)
 * @param date - Fecha original
 * @returns Fecha ajustada al lunes si aplica
 */
function moveToMonday(date: Date): Date {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) { // Domingo
    date.setDate(date.getDate() + 1);
  } else if (dayOfWeek !== 1) { // No es lunes
    date.setDate(date.getDate() + (8 - dayOfWeek));
  }
  return date;
}

/**
 * Obtiene todos los festivos de Colombia para un año específico
 * @param year - Año para calcular festivos
 * @returns Array de festivos con fecha y nombre
 */
export function getColombianHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  const easter = calculateEaster(year);
  
  // FESTIVOS FIJOS (no se mueven)
  holidays.push({
    date: new Date(year, 0, 1),
    name: "Año Nuevo",
    type: 'fixed'
  });
  
  holidays.push({
    date: new Date(year, 4, 1),
    name: "Día del Trabajo",
    type: 'fixed'
  });
  
  holidays.push({
    date: new Date(year, 6, 20),
    name: "Día de la Independencia",
    type: 'fixed'
  });
  
  holidays.push({
    date: new Date(year, 7, 7),
    name: "Batalla de Boyacá",
    type: 'fixed'
  });
  
  holidays.push({
    date: new Date(year, 11, 8),
    name: "Inmaculada Concepción",
    type: 'fixed'
  });
  
  holidays.push({
    date: new Date(year, 11, 25),
    name: "Navidad",
    type: 'fixed'
  });
  
  // FESTIVOS MÓVILES (se mueven al lunes según Ley Emiliani)
  // Epifanía (6 de enero)
  holidays.push({
    date: moveToMonday(new Date(year, 0, 6)),
    name: "Reyes Magos",
    type: 'movable'
  });
  
  // San José (19 de marzo)
  holidays.push({
    date: moveToMonday(new Date(year, 2, 19)),
    name: "San José",
    type: 'movable'
  });
  
  // San Pedro y San Pablo (29 de junio)
  holidays.push({
    date: moveToMonday(new Date(year, 5, 29)),
    name: "San Pedro y San Pablo",
    type: 'movable'
  });
  
  // Asunción de la Virgen (15 de agosto)
  holidays.push({
    date: moveToMonday(new Date(year, 7, 15)),
    name: "Asunción de la Virgen",
    type: 'movable'
  });
  
  // Día de la Raza (12 de octubre)
  holidays.push({
    date: moveToMonday(new Date(year, 9, 12)),
    name: "Día de la Raza",
    type: 'movable'
  });
  
  // Todos los Santos (1 de noviembre)
  holidays.push({
    date: moveToMonday(new Date(year, 10, 1)),
    name: "Todos los Santos",
    type: 'movable'
  });
  
  // Independencia de Cartagena (11 de noviembre)
  holidays.push({
    date: moveToMonday(new Date(year, 10, 11)),
    name: "Independencia de Cartagena",
    type: 'movable'
  });
  
  // FESTIVOS BASADOS EN PASCUA
  // Jueves Santo (3 días antes de Pascua)
  const jueveSanto = new Date(easter);
  jueveSanto.setDate(easter.getDate() - 3);
  holidays.push({
    date: jueveSanto,
    name: "Jueves Santo",
    type: 'easter'
  });
  
  // Viernes Santo (2 días antes de Pascua)
  const viernesSanto = new Date(easter);
  viernesSanto.setDate(easter.getDate() - 2);
  holidays.push({
    date: viernesSanto,
    name: "Viernes Santo",
    type: 'easter'
  });
  
  // Ascensión del Señor (39 días después de Pascua, se mueve al lunes)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  holidays.push({
    date: moveToMonday(ascension),
    name: "Ascensión del Señor",
    type: 'easter'
  });
  
  // Corpus Christi (60 días después de Pascua, se mueve al lunes)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays.push({
    date: moveToMonday(corpusChristi),
    name: "Corpus Christi",
    type: 'easter'
  });
  
  // Sagrado Corazón (68 días después de Pascua, se mueve al lunes)
  const sagradoCorazon = new Date(easter);
  sagradoCorazon.setDate(easter.getDate() + 68);
  holidays.push({
    date: moveToMonday(sagradoCorazon),
    name: "Sagrado Corazón",
    type: 'easter'
  });
  
  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Verifica si una fecha específica es festivo en Colombia
 * @param date - Fecha a verificar
 * @returns true si es festivo, false si no
 */
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getColombianHolidays(year);
  
  return holidays.some(holiday => {
    return holiday.date.getFullYear() === date.getFullYear() &&
           holiday.date.getMonth() === date.getMonth() &&
           holiday.date.getDate() === date.getDate();
  });
}

/**
 * Verifica si una fecha es día hábil (no es sábado, domingo ni festivo)
 * @param date - Fecha a verificar
 * @returns true si es día hábil, false si no
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  
  // Si es sábado (6) o domingo (0), no es hábil
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Si es festivo, no es hábil
  if (isHoliday(date)) {
    return false;
  }
  
  return true;
}

/**
 * Obtiene el siguiente día hábil a partir de una fecha
 * @param date - Fecha inicial
 * @returns Siguiente día hábil
 */
export function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isBusinessDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Cuenta los días hábiles entre dos fechas
 * @param startDate - Fecha inicial
 * @param endDate - Fecha final
 * @returns Número de días hábiles
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Obtiene el N-ésimo día hábil de un mes
 * @param year - Año
 * @param month - Mes (0-11)
 * @param n - Número de día hábil a buscar
 * @returns Fecha del N-ésimo día hábil o null si no existe
 */
export function getNthBusinessDayOfMonth(year: number, month: number, n: number): Date | null {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let businessDayCount = 0;
  const current = new Date(firstDay);
  
  while (current <= lastDay) {
    if (isBusinessDay(current)) {
      businessDayCount++;
      if (businessDayCount === n) {
        return new Date(current);
      }
    }
    current.setDate(current.getDate() + 1);
  }
  
  return null;
}

/**
 * Obtiene todos los días hábiles de un mes
 * @param year - Año
 * @param month - Mes (0-11)
 * @returns Array de fechas que son días hábiles
 */
export function getBusinessDaysOfMonth(year: number, month: number): Date[] {
  const businessDays: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const current = new Date(firstDay);
  
  while (current <= lastDay) {
    if (isBusinessDay(current)) {
      businessDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Datos hardcodeados de límites de seguridad social
 * Anteriormente en CAC_LIMITE_SEG_SOCIAL.json
 */
export const LIMITE_SEG_SOCIAL = [
  { DIAS_HABILES: 5, DIGITOS_NIT: "22" },
  { DIAS_HABILES: 5, DIGITOS_NIT: "23" },
  { DIAS_HABILES: 2, DIGITOS_NIT: "00" },
  { DIAS_HABILES: 2, DIGITOS_NIT: "01" },
  { DIAS_HABILES: 2, DIGITOS_NIT: "02" },
  { DIAS_HABILES: 2, DIGITOS_NIT: "03" },
  { DIAS_HABILES: 2, DIGITOS_NIT: "04" },
  { DIAS_HABILES: 2, DIGITOS_NIT: "05" },
  { DIAS_HABILES: 2, DIGITOS_NIT: "06" },
  { DIAS_HABILES: 2, DIGITOS_NIT: "07" },
  { DIAS_HABILES: 3, DIGITOS_NIT: "08" },
  { DIAS_HABILES: 3, DIGITOS_NIT: "09" },
  { DIAS_HABILES: 3, DIGITOS_NIT: "10" },
  { DIAS_HABILES: 3, DIGITOS_NIT: "11" },
  { DIAS_HABILES: 3, DIGITOS_NIT: "12" },
  { DIAS_HABILES: 3, DIGITOS_NIT: "13" },
  { DIAS_HABILES: 3, DIGITOS_NIT: "14" },
  { DIAS_HABILES: 4, DIGITOS_NIT: "15" },
  { DIAS_HABILES: 4, DIGITOS_NIT: "16" },
  { DIAS_HABILES: 4, DIGITOS_NIT: "17" },
  { DIAS_HABILES: 4, DIGITOS_NIT: "18" },
  { DIAS_HABILES: 4, DIGITOS_NIT: "19" },
  { DIAS_HABILES: 4, DIGITOS_NIT: "20" },
  { DIAS_HABILES: 4, DIGITOS_NIT: "21" },
  { DIAS_HABILES: 5, DIGITOS_NIT: "24" },
  { DIAS_HABILES: 5, DIGITOS_NIT: "25" },
  { DIAS_HABILES: 5, DIGITOS_NIT: "26" },
  { DIAS_HABILES: 5, DIGITOS_NIT: "27" },
  { DIAS_HABILES: 5, DIGITOS_NIT: "28" },
  { DIAS_HABILES: 6, DIGITOS_NIT: "29" },
  { DIAS_HABILES: 6, DIGITOS_NIT: "30" },
  { DIAS_HABILES: 6, DIGITOS_NIT: "31" },
  { DIAS_HABILES: 6, DIGITOS_NIT: "32" },
  { DIAS_HABILES: 6, DIGITOS_NIT: "33" },
  { DIAS_HABILES: 6, DIGITOS_NIT: "34" },
  { DIAS_HABILES: 6, DIGITOS_NIT: "35" },
  { DIAS_HABILES: 7, DIGITOS_NIT: "36" },
  { DIAS_HABILES: 7, DIGITOS_NIT: "37" },
  { DIAS_HABILES: 7, DIGITOS_NIT: "38" },
  { DIAS_HABILES: 7, DIGITOS_NIT: "39" },
  { DIAS_HABILES: 7, DIGITOS_NIT: "40" },
  { DIAS_HABILES: 7, DIGITOS_NIT: "41" },
  { DIAS_HABILES: 7, DIGITOS_NIT: "42" },
  { DIAS_HABILES: 8, DIGITOS_NIT: "43" },
  { DIAS_HABILES: 8, DIGITOS_NIT: "44" },
  { DIAS_HABILES: 8, DIGITOS_NIT: "45" },
  { DIAS_HABILES: 8, DIGITOS_NIT: "46" },
  { DIAS_HABILES: 8, DIGITOS_NIT: "47" },
  { DIAS_HABILES: 8, DIGITOS_NIT: "48" },
  { DIAS_HABILES: 8, DIGITOS_NIT: "49" },
  { DIAS_HABILES: 9, DIGITOS_NIT: "50" },
  { DIAS_HABILES: 9, DIGITOS_NIT: "51" },
  { DIAS_HABILES: 9, DIGITOS_NIT: "52" },
  { DIAS_HABILES: 9, DIGITOS_NIT: "53" },
  { DIAS_HABILES: 9, DIGITOS_NIT: "54" },
  { DIAS_HABILES: 9, DIGITOS_NIT: "55" },
  { DIAS_HABILES: 9, DIGITOS_NIT: "56" },
  { DIAS_HABILES: 10, DIGITOS_NIT: "57" },
  { DIAS_HABILES: 10, DIGITOS_NIT: "58" },
  { DIAS_HABILES: 10, DIGITOS_NIT: "59" },
  { DIAS_HABILES: 10, DIGITOS_NIT: "60" },
  { DIAS_HABILES: 10, DIGITOS_NIT: "61" },
  { DIAS_HABILES: 10, DIGITOS_NIT: "62" },
  { DIAS_HABILES: 10, DIGITOS_NIT: "63" },
  { DIAS_HABILES: 11, DIGITOS_NIT: "64" },
  { DIAS_HABILES: 11, DIGITOS_NIT: "65" },
  { DIAS_HABILES: 11, DIGITOS_NIT: "66" },
  { DIAS_HABILES: 11, DIGITOS_NIT: "67" },
  { DIAS_HABILES: 11, DIGITOS_NIT: "68" },
  { DIAS_HABILES: 11, DIGITOS_NIT: "69" },
  { DIAS_HABILES: 12, DIGITOS_NIT: "70" },
  { DIAS_HABILES: 12, DIGITOS_NIT: "71" },
  { DIAS_HABILES: 12, DIGITOS_NIT: "72" },
  { DIAS_HABILES: 12, DIGITOS_NIT: "73" },
  { DIAS_HABILES: 12, DIGITOS_NIT: "74" },
  { DIAS_HABILES: 12, DIGITOS_NIT: "75" },
  { DIAS_HABILES: 13, DIGITOS_NIT: "76" },
  { DIAS_HABILES: 13, DIGITOS_NIT: "77" },
  { DIAS_HABILES: 13, DIGITOS_NIT: "78" },
  { DIAS_HABILES: 13, DIGITOS_NIT: "79" },
  { DIAS_HABILES: 13, DIGITOS_NIT: "80" },
  { DIAS_HABILES: 13, DIGITOS_NIT: "81" },
  { DIAS_HABILES: 14, DIGITOS_NIT: "82" },
  { DIAS_HABILES: 14, DIGITOS_NIT: "83" },
  { DIAS_HABILES: 14, DIGITOS_NIT: "84" },
  { DIAS_HABILES: 14, DIGITOS_NIT: "85" },
  { DIAS_HABILES: 14, DIGITOS_NIT: "86" },
  { DIAS_HABILES: 14, DIGITOS_NIT: "87" },
  { DIAS_HABILES: 15, DIGITOS_NIT: "88" },
  { DIAS_HABILES: 15, DIGITOS_NIT: "89" },
  { DIAS_HABILES: 15, DIGITOS_NIT: "90" },
  { DIAS_HABILES: 15, DIGITOS_NIT: "91" },
  { DIAS_HABILES: 15, DIGITOS_NIT: "92" },
  { DIAS_HABILES: 15, DIGITOS_NIT: "93" },
  { DIAS_HABILES: 16, DIGITOS_NIT: "94" },
  { DIAS_HABILES: 16, DIGITOS_NIT: "95" },
  { DIAS_HABILES: 16, DIGITOS_NIT: "96" },
  { DIAS_HABILES: 16, DIGITOS_NIT: "97" },
  { DIAS_HABILES: 16, DIGITOS_NIT: "98" },
  { DIAS_HABILES: 16, DIGITOS_NIT: "99" }
];