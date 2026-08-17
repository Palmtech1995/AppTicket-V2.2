/**
 * ============================================================================
 * [MODULE: DEDICATED A4 PRINT ENGINE]
 * File: /src/utils/printUtils.ts
 * Description: Clean, isolated A4 printing engine without requiring Ctrl+P
 *              or printing browser chrome/navigation clutter.
 * ============================================================================
 */

import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

/**
 * Directly print a specific HTML element using an isolated hidden iframe
 * ensuring only the clean A4 document is sent to the printer.
 */
export const printElementDirectly = (
  elementId: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    docTitle?: string;
  }
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Print Error: Element #${elementId} not found`);
    window.print();
    return;
  }

  const orientation = options?.orientation || 'portrait';
  const docTitle = options?.docTitle || 'XingTai_Report_A4';

  // Create isolated hidden iframe
  const iframeId = '__xingtai_print_frame__';
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (iframe) {
    iframe.remove();
  }

  iframe = document.createElement('iframe');
  iframe.id = iframeId;
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    console.error('Print Error: Cannot access iframe document');
    window.print();
    return;
  }

  // Gather stylesheet links & styles from main document
  const headElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  // Custom A4 print styles for iframe
  const printStyles = `
    <style>
      @page {
        size: A4 ${orientation};
        margin: 8mm 10mm 10mm 10mm;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 12px;
      }
      .no-print {
        display: none !important;
      }
      .a4-page-break {
        page-break-after: always;
        break-after: page;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      th, td {
        border-color: #cbd5e1 !important;
      }
    </style>
  `;

  // Write content to iframe
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8">
      <title>${docTitle}</title>
      ${headElements}
      ${printStyles}
    </head>
    <body style="background: #ffffff; padding: 0; margin: 0;">
      ${element.outerHTML}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  iframeDoc.close();
};

/**
 * Export A4 HTML element to PDF in Portrait or Landscape mode
 */
export const exportA4ElementToPdf = async (
  elementId: string,
  filename = 'XingTai_Report.pdf',
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  try {
    const imgData = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = orientation === 'portrait' ? 210 : 297;
    const pdfHeight = orientation === 'portrait' ? 297 : 210;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(filename);
  } catch (err) {
    console.error('PDF Generation failed', err);
  }
};
