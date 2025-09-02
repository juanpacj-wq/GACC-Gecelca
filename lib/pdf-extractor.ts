// lib/pdf-extractor.ts (corregido)
/**
 * Utilidad para extraer números de documentos PDF
 * Basado en PDF.js para la extracción de texto
 */

// Interfaces para los tipos de PDF.js
interface PDFTextContent {
  items: PDFTextItem[];
  styles: any;
}

interface PDFTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
  [key: string]: any;
}

// Definimos una interfaz para los resultados de la extracción
export interface PdfExtractionResult {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * Extrae números con 4 o más dígitos de un archivo PDF
 * @param fileData - ArrayBuffer o Uint8Array con los datos del PDF
 * @returns Promesa con el resultado de la extracción
 */
export async function extractNumbersFromPdf(fileData: ArrayBuffer): Promise<PdfExtractionResult> {
  try {
    // Cargamos PDF.js dinámicamente
    const pdfjsLib = await loadPdfJs();
    
    // Configurar el worker de PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Iniciar la carga del documento
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileData) });
    const pdf = await loadingTask.promise;
    
    // Obtener el número de páginas
    const numPages = pdf.numPages;
    let allText = '';
    
    // Procesar cada página
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent() as PDFTextContent;
      const pageText = textContent.items.map((item: PDFTextItem) => item.str).join(' ');
      
      if (pageText.trim()) {
        allText += pageText + '\n';
      }
    }
    
    // Limpieza básica
    allText = allText
        .replace(/[^0-9.,\-+*/=%()\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Quitar montos con separador de miles por coma (p. ej., 1,234,567.89)
    allText = allText
        .replace(/\b\d{1,3}(,\d{3})+(\.\d+)?\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Tokenización y filtro
    const tokens = allText.split(/\s+/);
    const filteredTokens = tokens.filter(token => {
        if (token === '(' || token === ')' || token === '.' || token === ',' || token === '-') return false;
        if (token === '0') return false;
        const digitOnly = token.replace(/[.,\-]/g, '');
        return digitOnly.length >= 5;
    });

    const filteredText = filteredTokens.join(' ');
    
    if (filteredText) {
      // Unir los números encontrados con espacios
      return {
        success: true,
        text: filteredText
      };
    } else {
      return {
        success: false,
        text: '',
        error: 'No se encontraron números válidos en el PDF según los criterios de filtrado.'
      };
    }
  } catch (error) {
    console.error('Error al procesar el PDF:', error);
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Error desconocido al procesar el PDF'
    };
  }
}

/**
 * Carga dinámicamente la librería PDF.js
 * @returns Instancia de PDF.js
 */
async function loadPdfJs(): Promise<any> {
  // Si estamos en el navegador y PDF.js ya está cargado globalmente
  if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }
  
  // Si estamos en el navegador pero necesitamos cargar PDF.js
  if (typeof window !== 'undefined') {
    // Verificar si ya existe un script de PDF.js
    const existingScript = document.querySelector('script[src*="pdf.min.js"]');
    
    if (!existingScript) {
      // Cargar el script de PDF.js dinámicamente
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar PDF.js'));
        document.head.appendChild(script);
      });
    }
    
    // Esperar un poco para asegurarnos de que PDF.js se haya inicializado
    if (!(window as any).pdfjsLib) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return (window as any).pdfjsLib;
  }
  
  // Si estamos en el servidor, no podemos cargar PDF.js
  throw new Error('PDF.js no está disponible en el entorno del servidor');
}

/**
 * Extrae texto de un archivo PDF a partir de un objeto File
 * Esta función es específica para el navegador
 * @param file - Objeto File del navegador
 * @returns Promesa con el resultado de la extracción
 */
export async function extractNumbersFromPdfFile(file: File): Promise<PdfExtractionResult> {
  try {
    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Usar la función principal para procesar el PDF
    return await extractNumbersFromPdf(arrayBuffer);
  } catch (error) {
    console.error('Error al leer el archivo:', error);
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Error desconocido al leer el archivo'
    };
  }
}