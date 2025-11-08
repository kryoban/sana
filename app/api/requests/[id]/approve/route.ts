import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generatePDFAsBase64, generateReferralPDFAsBase64 } from '@/lib/pdf-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    // Get the original request
    const originalRequest = await prisma.request.findUnique({
      where: {
        id: id,
      },
    });

    if (!originalRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (originalRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request is not pending' },
        { status: 400 }
      );
    }

    // Get current date in DD/MM/YYYY format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const currentDate = `${day}/${month}/${year}`;
    const currentDateFormatted = `${day}.${month}.${year}`; // Format for referral PDF

    // Generate PDF based on request type
    let approvedPdfData: string | null = null;
    
    if (originalRequest.type === 'inscriere') {
      // Only generate PDF for inscriere requests (they have signatures)
      if (!originalRequest.signatureDataUrl) {
        return NextResponse.json(
          { error: 'Missing signature for inscriere request' },
          { status: 400 }
        );
      }

      // Generate approved PDF with filled-in top fields
      approvedPdfData = await generatePDFAsBase64({
        signatureDataUrl: originalRequest.signatureDataUrl,
        doctorName: originalRequest.doctorName,
        userData: {
          name: originalRequest.patientName,
          cnp: originalRequest.patientCnp,
          birthDate: originalRequest.patientBirthDate,
          citizenship: originalRequest.patientCitizenship,
          address: {
            street: originalRequest.patientAddressStreet,
            number: originalRequest.patientAddressNumber || "",
            block: originalRequest.patientAddressBlock || undefined,
            entrance: originalRequest.patientAddressEntrance || undefined,
            apartment: originalRequest.patientAddressApartment || undefined,
            sector: originalRequest.patientAddressSector,
          },
          idType: originalRequest.patientIdType,
          idSeries: originalRequest.patientIdSeries,
          idNumber: originalRequest.patientIdNumber,
          idIssuedBy: originalRequest.patientIdIssuedBy,
          idIssueDate: originalRequest.patientIdIssueDate,
        },
        approvedFields: {
          registrationNumber: "1",
          registrationDate: currentDate,
          unitateaSanitara: "Cabinet Medical Individual",
          cui: "RO12345678",
          sediu: "Bucuresti, Str. Exemplu, Nr. 1",
          casaDeAsigurari: "CNAS",
          contractNumber: "123/2024",
        },
      });
    } else if (originalRequest.type === 'trimitere') {
      // Generate referral PDF for trimitere requests
      if (!originalRequest.referralSpecialty) {
        return NextResponse.json(
          { error: 'Missing referral specialty for trimitere request' },
          { status: 400 }
        );
      }

      // Generate referral PDF
      approvedPdfData = await generateReferralPDFAsBase64({
        patientName: originalRequest.patientName,
        patientCnp: originalRequest.patientCnp,
        referralSpecialty: originalRequest.referralSpecialty,
        doctorName: originalRequest.doctorName,
        doctorSpecialty: originalRequest.doctorSpecialty || undefined,
        issueDate: currentDateFormatted,
      });
    }

    // Update request with approved status and new PDF (always generated for both types)
    const updatedRequest = await prisma.request.update({
      where: {
        id: id,
      },
      data: {
        status: 'approved',
        pdfData: approvedPdfData ? Buffer.from(approvedPdfData, 'base64') : null,
      },
    });

    return NextResponse.json({
      success: true,
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        updatedAt: updatedRequest.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json(
      { error: 'Failed to approve request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

