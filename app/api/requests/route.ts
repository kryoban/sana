import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
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
      pdfData,
      signatureDataUrl,
    } = body;

    // Validate required fields
    if (!patientName || !patientCnp || !doctorName || !pdfData || !signatureDataUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert base64 PDF to buffer
    const pdfBuffer = Buffer.from(pdfData, 'base64');

    // Insert request into database
    const savedRequest = await prisma.request.create({
      data: {
        patientName,
        patientCnp,
        patientBirthDate,
        patientCitizenship,
        patientAddressStreet: patientAddress.street,
        patientAddressNumber: patientAddress.number || null,
        patientAddressBlock: patientAddress.block || null,
        patientAddressEntrance: patientAddress.entrance || null,
        patientAddressApartment: patientAddress.apartment || null,
        patientAddressSector: patientAddress.sector,
        patientIdType,
        patientIdSeries,
        patientIdNumber,
        patientIdIssuedBy,
        patientIdIssueDate,
        doctorName,
        doctorSpecialty: doctorSpecialty || null,
        pdfData: pdfBuffer,
        signatureDataUrl,
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
          patientName: true,
          doctorName: true,
          doctorSpecialty: true,
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
