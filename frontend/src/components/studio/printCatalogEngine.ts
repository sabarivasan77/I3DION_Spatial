export type PageFormat = 'A4' | 'A5' | 'Letter' | 'Custom';
export type Orientation = 'portrait' | 'landscape';

export interface PrintSettings {
  format: PageFormat;
  orientation: Orientation;
  widthMm: number;
  heightMm: number;
  marginMm: number;
  showCropMarks: boolean;
  showHeaderFooter: boolean;
  headerText: string;
  footerText: string;
}

export const printCatalogEngine = {
  getDimensions: (format: PageFormat, orientation: Orientation): { widthMm: number; heightMm: number } => {
    let w = 210;
    let h = 297;

    switch (format) {
      case 'A4': w = 210; h = 297; break;
      case 'A5': w = 148; h = 210; break;
      case 'Letter': w = 216; h = 279; break;
      case 'Custom': w = 200; h = 200; break;
    }

    if (orientation === 'landscape') {
      return { widthMm: h, heightMm: w };
    }
    return { widthMm: w, heightMm: h };
  },

  getPixelDimensions: (format: PageFormat, orientation: Orientation, dpi = 96): { widthPx: number; heightPx: number } => {
    const { widthMm, heightMm } = printCatalogEngine.getDimensions(format, orientation);
    const mmToInch = 0.0393701;
    return {
      widthPx: Math.round(widthMm * mmToInch * dpi),
      heightPx: Math.round(heightMm * mmToInch * dpi)
    };
  },

  generatePrintCss: (settings: PrintSettings): string => {
    const { widthMm, heightMm, marginMm } = settings;
    return `
      @page {
        size: ${widthMm}mm ${heightMm}mm;
        margin: ${marginMm}mm;
      }
      @media print {
        body {
          background: #FFFFFF !important;
          color: #000000 !important;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-after: always;
        }
      }
    `;
  }
};
