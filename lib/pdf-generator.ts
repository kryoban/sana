import jsPDF from "jspdf";

/**
 * Replaces Romanian diacritics with ASCII equivalents
 * This is a fallback for jsPDF which has limited diacritic support
 */
function replaceDiacritics(text: string): string {
  const diacriticMap: { [key: string]: string } = {
    ă: "a",
    â: "a",
    î: "i",
    ș: "s",
    ț: "t",
    Ă: "A",
    Â: "A",
    Î: "I",
    Ș: "S",
    Ț: "T",
  };

  return text.replace(/[ăâîșțĂÂÎȘȚ]/g, (char) => diacriticMap[char] || char);
}

/**
 * Safely adds text to PDF, replacing diacritics if needed
 */
function addTextSafe(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: { maxWidth?: number; replaceDiacritics?: boolean }
): void {
  const shouldReplace = options?.replaceDiacritics ?? true;
  const safeText = shouldReplace ? replaceDiacritics(text) : text;

  if (options?.maxWidth) {
    const lines = doc.splitTextToSize(safeText, options.maxWidth);
    doc.text(lines, x, y);
  } else {
    doc.text(safeText, x, y);
  }
}

interface PDFData {
  signatureDataUrl: string;
  doctorName?: string;
  userData?: {
    name: string;
    cnp: string;
    birthDate: string;
    citizenship: string;
    address: {
      street: string;
      number: string;
      block?: string;
      entrance?: string;
      apartment?: string;
      sector: string;
    };
    idType: string;
    idSeries: string;
    idNumber: string;
    idIssuedBy: string;
    idIssueDate: string;
  };
  approvedFields?: {
    registrationNumber?: string;
    registrationDate?: string;
    unitateaSanitara?: string;
    cui?: string;
    sediu?: string;
    casaDeAsigurari?: string;
    contractNumber?: string;
  };
}

/**
 * Internal function to generate PDF document
 * Returns the jsPDF document instance
 */
function generatePDFDocument(pdfData: PDFData): Promise<jsPDF> {
  return new Promise((resolve, reject) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    const lineHeight = 7;
    const fieldSpacing = 8;

    let yPosition = margin;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    addTextSafe(doc, "CERERE DE TRANSFER", margin, yPosition, {
      replaceDiacritics: false,
    });
    yPosition += lineHeight + 5;

    // Registration number line
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const registrationNumber = pdfData.approvedFields?.registrationNumber || "1";
    let registrationDate = pdfData.approvedFields?.registrationDate;
    if (!registrationDate) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      registrationDate = `${day}/${month}/${year}`;
    }
    addTextSafe(
      doc,
      `Nr. inregistrare VIZAT*), ${registrationNumber} / ${registrationDate}`,
      margin,
      yPosition
    );
    yPosition += fieldSpacing + 2;

    // Approved fields (filled in when approved) - smaller font for labels
    doc.setFontSize(10);
    const unitateaSanitara = pdfData.approvedFields?.unitateaSanitara;
    if (unitateaSanitara) {
      addTextSafe(doc, `Unitatea sanitara: ${unitateaSanitara}`, margin, yPosition);
    } else {
      addTextSafe(doc, "Unitatea sanitara", margin, yPosition);
    }
    yPosition += fieldSpacing;

    const cui = pdfData.approvedFields?.cui;
    if (cui) {
      addTextSafe(doc, `CUI: ${cui}`, margin, yPosition);
    } else {
      addTextSafe(doc, "CUI", margin, yPosition);
    }
    yPosition += fieldSpacing;

    const sediu = pdfData.approvedFields?.sediu;
    if (sediu) {
      addTextSafe(doc, `Sediu (localitate, str., nr.): ${sediu}`, margin, yPosition);
    } else {
      addTextSafe(doc, "Sediu (localitate, str., nr.)", margin, yPosition);
    }
    yPosition += fieldSpacing;

    const casaDeAsigurari = pdfData.approvedFields?.casaDeAsigurari;
    if (casaDeAsigurari) {
      addTextSafe(doc, `Casa de Asigurari: ${casaDeAsigurari}`, margin, yPosition);
    } else {
      addTextSafe(doc, "Casa de Asigurari", margin, yPosition);
    }
    yPosition += fieldSpacing;

    const contractNumber = pdfData.approvedFields?.contractNumber;
    if (contractNumber) {
      addTextSafe(doc, `Nr. contract / conventie: ${contractNumber}`, margin, yPosition);
    } else {
      addTextSafe(doc, "Nr. contract / conventie", margin, yPosition);
    }
    yPosition += fieldSpacing + 8;

    // Doctor name
    doc.setFontSize(11);
    const doctorText = pdfData.doctorName
      ? `Medic de familie: ${pdfData.doctorName}`
      : "Medic de familie";
    addTextSafe(doc, doctorText, margin, yPosition);
    yPosition += fieldSpacing + 12;

    // Greeting
    doc.setFontSize(11);
    addTextSafe(doc, "Domnule / Doamna Doctor,", margin, yPosition);
    yPosition += fieldSpacing + 8;

    // User declaration
    doc.setFontSize(10);
    if (pdfData.userData) {
      const user = pdfData.userData;
      const addressParts = [
        user.address.street,
        user.address.number && `nr.${user.address.number}`,
        user.address.block && `bl.${user.address.block}`,
        user.address.entrance && `sc.${user.address.entrance}`,
        user.address.apartment && `ap.${user.address.apartment}`,
      ]
        .filter(Boolean)
        .join(", ");

      // Use CNP without spaces
      const cnpFormatted = user.cnp.replace(/\s/g, "");

      const declarationText = `Subsemnatul (a) ${user.name}, cetatenie ${user.citizenship}, C.N.P. ${cnpFormatted}, data nasterii ${user.birthDate}, domiciliat(a) in ${addressParts}, jud./sector ${user.address.sector}, act de identitate ${user.idType}, seria ${user.idSeries}, nr ${user.idNumber}, eliberat de ${user.idIssuedBy}, la data ${user.idIssueDate}, solicit inscrierea mea pe lista dumneavoastra prin transfer.`;

      const declarationLines = doc.splitTextToSize(
        replaceDiacritics(declarationText),
        contentWidth
      );
      declarationLines.forEach((line: string) => {
        addTextSafe(doc, line, margin, yPosition, {
          replaceDiacritics: false, // Already replaced
        });
        yPosition += lineHeight;
      });
    } else {
      // Fallback text without user data
      const fallbackText =
        "Subsemnatul _________________________, cetatenie____________________, C.N.P. I__I__I__I__I__I__I__I__I__I__I__I__I__I, data nasterii________________________, domiciliat(a) in ___________________ str._________________, nr._____, bl._____, sc.____, ap._____, jud./sector __________, act de identitate ______________, seria___________, nr___________, eliberat de __________________, la data_____________, solicit inscrierea mea pe lista dumneavoastra prin transfer.";
      const fallbackLines = doc.splitTextToSize(
        replaceDiacritics(fallbackText),
        contentWidth
      );
      fallbackLines.forEach((line: string) => {
        addTextSafe(doc, line, margin, yPosition, {
          replaceDiacritics: false,
        });
        yPosition += lineHeight;
      });
    }

    yPosition += fieldSpacing + 5;

    // Declaration statement
    doc.setFontSize(10);
    const declarationStatement =
      "Declar pe propria raspundere ca nu solicit transferul mai devreme de 6 luni calendaristice de la ultima inscriere.";
    const statementLines = doc.splitTextToSize(
      replaceDiacritics(declarationStatement),
      contentWidth
    );
    statementLines.forEach((line: string) => {
      addTextSafe(doc, line, margin, yPosition, {
        replaceDiacritics: false,
      });
      yPosition += lineHeight;
    });

    yPosition += fieldSpacing + 15;

    // Date and signature section (side by side layout)
    const currentDate = new Date().toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Use fixed signature dimensions (works in Node.js)
    // jsPDF can handle base64 data URLs directly
    const signatureHeight = 30; // Height for signature
    const maxSignatureWidth = 80; // Maximum width for signature
    const finalSignatureWidth = maxSignatureWidth;
    const finalSignatureHeight = signatureHeight;

    // Check if we need a new page
    if (yPosition + finalSignatureHeight + 10 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    // Create a two-column layout: Date on left, Signature on right (inline)
    const leftColumnX = margin;
    const rightColumnX = pageWidth - margin - finalSignatureWidth - 10;
    const baselineY = yPosition;

    try {
      // Date on the left, inline with signature
      doc.setFontSize(10);
      addTextSafe(doc, `Data: ${currentDate}`, leftColumnX, baselineY);

      // Signature on the right, aligned with date baseline
      // jsPDF's addImage can handle base64 data URLs directly in Node.js
      doc.addImage(
        pdfData.signatureDataUrl,
        "PNG",
        rightColumnX,
        baselineY - finalSignatureHeight + 4, // Align signature baseline with text baseline
        finalSignatureWidth,
        finalSignatureHeight
      );

      resolve(doc);
    } catch (error) {
      reject(new Error(`Failed to add signature image: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Generates a PDF document and returns it as a base64 string
 * @param data - PDF data including signature and form information
 * @returns Promise that resolves to base64 string of the PDF
 */
export function generatePDFAsBase64(data: PDFData | string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Handle backward compatibility - if string is passed, treat as signatureDataUrl
      const pdfData: PDFData =
        typeof data === "string" ? { signatureDataUrl: data } : data;

      const doc = await generatePDFDocument(pdfData);
      const pdfOutput = doc.output("datauristring");
      // Extract base64 part (remove data:application/pdf;base64, prefix)
      const base64 = pdfOutput.split(",")[1];
      resolve(base64);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a PDF document with the transfer request form and signature
 * @param data - PDF data including signature and form information
 * @param fileName - Optional filename for the PDF (default: "cerere-semnata.pdf")
 */
export function generatePDFWithSignature(
  data: PDFData | string,
  fileName: string = "cerere-semnata.pdf"
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Handle backward compatibility - if string is passed, treat as signatureDataUrl
      const pdfData: PDFData =
        typeof data === "string" ? { signatureDataUrl: data } : data;

      const doc = await generatePDFDocument(pdfData);
      doc.save(fileName);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
