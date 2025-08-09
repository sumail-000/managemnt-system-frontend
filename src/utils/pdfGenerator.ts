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

    // Get the actual display dimensions of the label
    const rect = element.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // Create canvas with optimized dimensions for label
    const canvas = await html2canvas(element, {
      scale: 2, // Fixed scale for consistent quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: displayWidth,
      height: displayHeight
    });

    // Convert pixels to mm for proper PDF sizing (96 DPI to mm conversion)
    const mmWidth = displayWidth * 0.264583; // Convert px to mm
    const mmHeight = displayHeight * 0.264583;
    
    // Create PDF with actual label dimensions in mm
    const pdf = new jsPDF({
      orientation: mmWidth > mmHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [mmWidth, mmHeight]
    });

    // Add the canvas as image to PDF with proper sizing
    const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality to reduce file size
    pdf.addImage(imgData, 'JPEG', 0, 0, mmWidth, mmHeight);

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

// Specialized function for nutrition labels with optimal sizing and quality
export const generateNutritionLabelPDF = async (
  elementId: string,
  options: Omit<PDFOptions, 'format' | 'orientation'> & {
    labelWidth?: number;
    labelHeight?: number;
  } = {}
): Promise<void> => {
  const {
    filename = 'nutrition-label.pdf',
    quality = 1,
    labelWidth,
    labelHeight
  } = options;

  try {
    // Find the label element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Get the actual display dimensions
    const rect = element.getBoundingClientRect();
    const actualWidth = labelWidth || rect.width;
    const actualHeight = labelHeight || rect.height;

    // Create canvas with optimal settings for nutrition labels
    const canvas = await html2canvas(element, {
      scale: 1.5, // Optimal scale for nutrition labels
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: actualWidth,
      height: actualHeight,
      removeContainer: true,
      imageTimeout: 0
    });

    // Standard nutrition label dimensions in inches (convert to mm)
    // Typical FDA label: 2.6" x 7.6" = 66mm x 193mm
    const standardWidthMM = 66;  // 2.6 inches
    const standardHeightMM = 193; // 7.6 inches
    
    // Calculate aspect ratio to maintain proportions
    const aspectRatio = actualWidth / actualHeight;
    let pdfWidth = standardWidthMM;
    let pdfHeight = standardHeightMM;
    
    // Adjust dimensions based on actual label proportions
    if (aspectRatio > (standardWidthMM / standardHeightMM)) {
      // Label is wider than standard, adjust height
      pdfHeight = pdfWidth / aspectRatio;
    } else {
      // Label is taller than standard, adjust width
      pdfWidth = pdfHeight * aspectRatio;
    }

    // Create PDF with proper nutrition label dimensions
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true
    });

    // Convert canvas to optimized image
    const imgData = canvas.toDataURL('image/jpeg', 0.85); // 85% quality for good balance
    
    // Add image to PDF with exact dimensions
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    // Save the PDF
    pdf.save(filename);
    
    console.log(`Generated nutrition label PDF: ${pdfWidth}mm x ${pdfHeight}mm`);
  } catch (error) {
    console.error('Error generating nutrition label PDF:', error);
    throw new Error('Failed to generate nutrition label PDF. Please try again.');
  }
};