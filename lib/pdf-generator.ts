import jsPDF from "jspdf";
import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

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
 * Loads and converts the ANA logo SVG to a base64 PNG string
 * @returns Promise that resolves to base64 PNG string
 */
async function loadLogoAsBase64(): Promise<string> {
  try {
    // Get the path to the logo file
    // In Next.js, public folder is at the root level
    const logoPath = join(process.cwd(), "public", "images", "logo_ana.svg");

    // Read the SVG file
    const svgBuffer = readFileSync(logoPath);

    // Convert SVG to PNG using sharp
    // The SVG has a viewBox of 230x100, so we'll maintain aspect ratio
    // Scale it to a reasonable size for the PDF (e.g., 46mm width, which is about 174px at 96dpi)
    const pngBuffer = await sharp(svgBuffer)
      .resize(174, 76, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    // Convert to base64 data URL
    const base64 = pngBuffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Error loading logo:", error);
    // Return empty string if logo can't be loaded (don't fail the PDF generation)
    return "";
  }
}

/**
 * Internal function to generate PDF document
 * Returns the jsPDF document instance
 */
async function generatePDFDocument(pdfData: PDFData): Promise<jsPDF> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      const lineHeight = 7;
      const fieldSpacing = 8;

      // Load logo
      const logoDataUrl = await loadLogoAsBase64();

      let yPosition = margin;

      // Add logo in the top right corner if available
      if (logoDataUrl) {
        try {
          const logoWidth = 46; // mm (approximately 174px)
          const logoHeight = 20; // mm (approximately 76px, maintaining aspect ratio)
          const logoX = pageWidth - margin - logoWidth;
          const logoY = margin;

          doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
        } catch (error) {
          console.error("Error adding logo to PDF:", error);
          // Continue without logo if there's an error
        }
      }

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
      const registrationNumber =
        pdfData.approvedFields?.registrationNumber || "1";
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
        addTextSafe(
          doc,
          `Unitatea sanitara: ${unitateaSanitara}`,
          margin,
          yPosition
        );
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
        addTextSafe(
          doc,
          `Sediu (localitate, str., nr.): ${sediu}`,
          margin,
          yPosition
        );
      } else {
        addTextSafe(doc, "Sediu (localitate, str., nr.)", margin, yPosition);
      }
      yPosition += fieldSpacing;

      const casaDeAsigurari = pdfData.approvedFields?.casaDeAsigurari;
      if (casaDeAsigurari) {
        addTextSafe(
          doc,
          `Casa de Asigurari: ${casaDeAsigurari}`,
          margin,
          yPosition
        );
      } else {
        addTextSafe(doc, "Casa de Asigurari", margin, yPosition);
      }
      yPosition += fieldSpacing;

      const contractNumber = pdfData.approvedFields?.contractNumber;
      if (contractNumber) {
        addTextSafe(
          doc,
          `Nr. contract / conventie: ${contractNumber}`,
          margin,
          yPosition
        );
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

      // Date on the left
      doc.setFontSize(10);
      addTextSafe(doc, `Data: ${currentDate}`, leftColumnX, baselineY);

      // Signature on the right, only if signatureDataUrl is provided
      if (pdfData.signatureDataUrl) {
        try {
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
        } catch (error) {
          console.error("Error adding signature to PDF:", error);
          // Continue without signature if there's an error
        }
      }

      resolve(doc);
    } catch (error) {
      reject(
        new Error(
          `Failed to generate PDF: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        )
      );
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

interface ReferralPDFData {
  patientName: string;
  patientCnp: string;
  referralSpecialty: string;
  doctorName: string;
  doctorSpecialty?: string;
  issueDate?: string;
}

/**
 * Draws a medical stamp (watermark-like) on the PDF
 * Uses basic rectangle methods for maximum compatibility
 * @param doc - jsPDF document instance
 * @param x - X position
 * @param y - Y position
 * @param width - Width of the stamp
 * @param height - Height of the stamp
 */
function drawMedicalStamp(
  doc: jsPDF,
  x: number,
  y: number,
  width: number = 50,
  height: number = 25
): void {
  try {
    // Save current graphics state
    const currentDrawColor = doc.getDrawColor();
    const currentTextColor = doc.getTextColor();
    const currentFillColor = doc.getFillColor();
    const currentLineWidth = doc.getLineWidth();

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Draw outer rectangle border (stamp frame)
    doc.setDrawColor(200, 0, 0); // Red border
    doc.setFillColor(255, 245, 245); // Very light red fill for watermark effect
    doc.setLineWidth(2);
    doc.rect(x, y, width, height, "FD"); // Filled and drawn

    // Draw inner rectangle for stamp effect
    const innerPadding = 3;
    doc.setDrawColor(180, 0, 0);
    doc.setFillColor(255, 250, 250);
    doc.setLineWidth(1);
    doc.rect(
      x + innerPadding,
      y + innerPadding,
      width - innerPadding * 2,
      height - innerPadding * 2,
      "FD"
    );

    // Add decorative border lines
    doc.setDrawColor(160, 0, 0);
    doc.setLineWidth(0.5);
    // Top and bottom lines
    doc.line(x + 5, y + 6, x + width - 5, y + 6);
    doc.line(x + 5, y + height - 6, x + width - 5, y + height - 6);

    // Add text inside the stamp
    doc.setTextColor(150, 0, 0); // Dark red text
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");

    // Stamp text (centered)
    const stampText = "SEMNAT ELECTRONIC";
    const textWidth = doc.getTextWidth(stampText);
    const textX = centerX - textWidth / 2;
    const textY = centerY + 1; // Centered vertically

    addTextSafe(doc, stampText, textX, textY, { replaceDiacritics: false });

    // Restore graphics state
    doc.setDrawColor(currentDrawColor);
    doc.setTextColor(currentTextColor);
    doc.setFillColor(currentFillColor);
    doc.setLineWidth(currentLineWidth);
  } catch (error) {
    console.error("Error drawing medical stamp:", error);
    // Continue without stamp if there's an error
  }
}

/**
 * Generates a medical referral PDF document
 * @param data - Referral data including patient info and specialty
 * @returns Promise that resolves to jsPDF document instance
 */
async function generateReferralPDFDocument(
  pdfData: ReferralPDFData
): Promise<jsPDF> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      const lineHeight = 7;
      const fieldSpacing = 10;

      // Load logo
      const logoDataUrl = await loadLogoAsBase64();

      let yPosition = margin;

      // Add logo in the top right corner if available
      if (logoDataUrl) {
        try {
          const logoWidth = 46; // mm (approximately 174px)
          const logoHeight = 20; // mm (approximately 76px, maintaining aspect ratio)
          const logoX = pageWidth - margin - logoWidth;
          const logoY = margin;

          doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
        } catch (error) {
          console.error("Error adding logo to referral PDF:", error);
          // Continue without logo if there's an error
        }
      }

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      addTextSafe(doc, "TRIMITERE MEDICALA", margin, yPosition, {
        replaceDiacritics: false,
      });
      yPosition += lineHeight + 10;

      // Issue date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      let issueDate = pdfData.issueDate;
      if (!issueDate) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        issueDate = `${day}/${month}/${year}`;
      }
      addTextSafe(doc, `Data emiterii: ${issueDate}`, margin, yPosition);
      yPosition += fieldSpacing + 5;

      // Doctor information
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      addTextSafe(doc, "Medic de familie:", margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const doctorInfo = pdfData.doctorSpecialty
        ? `${pdfData.doctorName}, ${pdfData.doctorSpecialty}`
        : pdfData.doctorName;
      addTextSafe(doc, doctorInfo, margin + 5, yPosition);
      yPosition += fieldSpacing + 8;

      // Patient information section
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      addTextSafe(doc, "Date pacient:", margin, yPosition);
      yPosition += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Patient name
      addTextSafe(
        doc,
        `Nume complet: ${pdfData.patientName}`,
        margin + 5,
        yPosition
      );
      yPosition += fieldSpacing;

      // CNP
      const cnpFormatted = pdfData.patientCnp.replace(/\s/g, "");
      addTextSafe(doc, `C.N.P.: ${cnpFormatted}`, margin + 5, yPosition);
      yPosition += fieldSpacing + 8;

      // Referral specialty
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      addTextSafe(doc, "Trimitere catre:", margin, yPosition);
      yPosition += lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      addTextSafe(
        doc,
        `Specialitate: ${pdfData.referralSpecialty}`,
        margin + 5,
        yPosition
      );
      yPosition += fieldSpacing + 15;

      // Signature area
      doc.setFontSize(10);
      addTextSafe(doc, "Semnatura medic:", margin, yPosition);
      yPosition += lineHeight + 20;

      // Doctor name and specialty
      addTextSafe(doc, pdfData.doctorName, margin, yPosition);
      yPosition += lineHeight;
      if (pdfData.doctorSpecialty) {
        addTextSafe(doc, pdfData.doctorSpecialty, margin, yPosition);
        yPosition += lineHeight + 10;
      } else {
        yPosition += lineHeight + 10;
      }

      // Add medical stamp (watermark-like) below the signature section
      const stampWidth = 50; // mm
      const stampHeight = 25; // mm
      const stampX = margin + 5; // Slightly offset from left margin
      const stampY = yPosition;
      drawMedicalStamp(doc, stampX, stampY, stampWidth, stampHeight);

      resolve(doc);
    } catch (error) {
      reject(
        new Error(
          `Failed to generate referral PDF: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        )
      );
    }
  });
}

/**
 * Generates a medical referral PDF and returns it as a base64 string
 * @param data - Referral data including patient info and specialty
 * @returns Promise that resolves to base64 string of the PDF
 */
export function generateReferralPDFAsBase64(
  data: ReferralPDFData
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = await generateReferralPDFDocument(data);
      const pdfOutput = doc.output("datauristring");
      // Extract base64 part (remove data:application/pdf;base64, prefix)
      const base64 = pdfOutput.split(",")[1];
      resolve(base64);
    } catch (error) {
      reject(error);
    }
  });
}
