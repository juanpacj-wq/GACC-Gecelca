// types/pila.ts
export interface FechaCorte {
  id: number;
  fecha: string;
  estado: "success" | "warning" | "normal";
  mesTexto: string;
}