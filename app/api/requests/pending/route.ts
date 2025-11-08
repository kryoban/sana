import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get pending requests count
    const count = await prisma.request.count({
      where: {
        status: 'pending',
      },
    });

    // Get latest pending request
    const latestRequest = await prisma.request.findFirst({
      where: {
        status: 'pending',
      },
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
    });

    return NextResponse.json({
      count,
      latestRequest,
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

