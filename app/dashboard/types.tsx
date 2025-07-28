// app/dashboard/types.tsx

// Interfaces para las personas
export interface PersonaRegistro {
  id_persona?: string;
  Title?: string;
  Nombre: string;
  Apellidos: string;
  C_x002e_C: string; // Cédula
  Cargo: string;
  empresa: string;
  Estado?: string;
  ESTADO_ACTIVIDAD?: string;
  correo?: string;
  arl?: string;
  eps?: string;
  afp?: string;
  certificadoConfinados?: string;
  certificadoAltura?: string;
  conceptoAltura?: string;
  conceptoIngreso?: string;
  guid0?: string;
}

// Datos del formulario de persona
export interface PersonaFormData {
  nombre: string;
  apellidos: string;
  cedula: string;
  correo: string;
  cargo: string;
  arl: string;
  eps: string;
  afp: string;
  certificadoConfinados: string;
  certificadoAltura: string;
  conceptoAltura: string;
  conceptoIngreso: string;
}

// Interfaces para los vehículos
export interface VehiculoRegistro {
  id_vehiculo?: string;
  placa: string;
  marca: string;
  modelo: string;
  conductores: string;
  color?: string;
}

// Datos que vienen de la API para vehículos
export interface VehiculoResponse {
  ID_VEHICULO?: string;
  PLACA: string;
  MARCA: string;
  MODELO: string;
  COLOR?: string;
  CONDUCTORES: string;
  ESTADO: string;
}

// Datos del formulario de vehículo
export interface VehiculoFormData {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  conductores: string;
}

// Interfaz para datos de documentos de personas
export interface DocumentoData {
  id_solicitud: string;
  id_persona: string;
  tipo_documento: string;
  archivoNombre: string;
  archivoBase64: string;
}

// Interfaz para datos de documentos de vehículos
export interface DocumentoVehiculoData {
  id_solicitud: string;
  id_vehiculo: string;
  tipo_documento: string;
  archivoNombre: string;
  archivoBase64: string;
}

// Interfaz para carga masiva de personas
export interface CargaMasivaData {
  id_solicitud: string;
  archivoNombre: string;
  archivoBase64: string;
}

// Resultado de carga masiva
export interface CargaMasivaResultado {
  mensaje: string;
  registrados: number;
  errores: number;
  detalles?: string[];
}

// Tipo de ingreso
export type TipoIngreso = "persona" | "vehiculo";