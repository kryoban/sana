import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      type,
      patientName,
      patientCnp,
      patientBirthDate,
      patientCitizenship,
      patientAddress,
      patientIdType,
      patientIdSeries,
      patientIdNumber,
      patientIdIssuedBy,
      patientIdIssueDate,
      doctorName,
      doctorSpecialty,
      referralSpecialty,
      pdfData,
      signatureDataUrl,
    } = body;

    // Validate required fields based on type
    const requestType = type || 'inscriere';
    
    if (requestType === 'inscriere') {
      // For inscriere, PDF and signature are required
      if (!patientName || !patientCnp || !doctorName || !pdfData || !signatureDataUrl) {
        return NextResponse.json(
          { error: 'Missing required fields for inscriere request' },
          { status: 400 }
        );
      }
    } else if (requestType === 'trimitere') {
      // For trimitere, only basic fields and referral specialty are required
      if (!patientName || !patientCnp || !doctorName || !referralSpecialty) {
        return NextResponse.json(
          { error: 'Missing required fields for trimitere request' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request type. Must be "inscriere" or "trimitere"' },
        { status: 400 }
      );
    }

    // Convert base64 PDF to buffer if provided
    const pdfBuffer = pdfData ? Buffer.from(pdfData, 'base64') : null;

    // Insert request into database
    const savedRequest = await prisma.request.create({
      data: {
        type: requestType,
        patientName,
        patientCnp,
        patientBirthDate: patientBirthDate || '',
        patientCitizenship: patientCitizenship || '',
        patientAddressStreet: patientAddress?.street || '',
        patientAddressNumber: patientAddress?.number || null,
        patientAddressBlock: patientAddress?.block || null,
        patientAddressEntrance: patientAddress?.entrance || null,
        patientAddressApartment: patientAddress?.apartment || null,
        patientAddressSector: patientAddress?.sector || '',
        patientIdType: patientIdType || '',
        patientIdSeries: patientIdSeries || '',
        patientIdNumber: patientIdNumber || '',
        patientIdIssuedBy: patientIdIssuedBy || '',
        patientIdIssueDate: patientIdIssueDate || '',
        doctorName,
        doctorSpecialty: doctorSpecialty || null,
        referralSpecialty: referralSpecialty || null,
        pdfData: pdfBuffer,
        signatureDataUrl: signatureDataUrl || null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      id: savedRequest.id,
      createdAt: savedRequest.createdAt,
    });
  } catch (error) {
    console.error('Error saving request:', error);
    return NextResponse.json(
      { error: 'Failed to save request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cnp = searchParams.get('cnp');

    if (cnp) {
      // Get requests for a specific patient
      const requests = await prisma.request.findMany({
        where: {
          patientCnp: cnp,
        },
        select: {
          id: true,
          type: true,
          patientName: true,
          doctorName: true,
          doctorSpecialty: true,
          referralSpecialty: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return NextResponse.json({ requests });
    } else {
      // Get all requests (with pagination in the future)
      const requests = await prisma.request.findMany({
        select: {
          id: true,
          type: true,
          patientName: true,
          patientCnp: true,
          patientBirthDate: true,
          patientCitizenship: true,
          patientAddressStreet: true,
          patientAddressNumber: true,
          patientAddressBlock: true,
          patientAddressEntrance: true,
          patientAddressApartment: true,
          patientAddressSector: true,
          patientIdType: true,
          patientIdSeries: true,
          patientIdNumber: true,
          patientIdIssuedBy: true,
          patientIdIssueDate: true,
          doctorName: true,
          doctorSpecialty: true,
          referralSpecialty: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });
      return NextResponse.json({ requests });
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
