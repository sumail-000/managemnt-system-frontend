import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
}

export const generateLabelPDF = async (
  elementId: string, 
  options: PDFOptions = {}
): Promise<void> => {
  const {
    filename = 'nutrition-label.pdf',
    format = 'a4',
    orientation = 'portrait',
    quality = 1
  } = options;

  try {
    // Find the label element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: quality * 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    // Calculate dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [imgWidth, imgHeight]
    });

    // Add the canvas as image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

export const generateMultiLabelPDF = async (
  elementIds: string[],
  options: PDFOptions = {}
): Promise<void> => {
  const {
    filename = 'nutrition-labels.pdf',
    format = 'a4',
    orientation = 'portrait',
    quality = 1
  } = options;

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    let isFirstPage = true;

    for (const elementId of elementIds) {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element with ID "${elementId}" not found, skipping...`);
        continue;
      }

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: quality * 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Calculate dimensions to fit on page
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Scale to fit page while maintaining aspect ratio
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      // Center on page
      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;

      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating multi-label PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};