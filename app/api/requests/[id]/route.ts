import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    // Get request from database
    const request = await prisma.request.findUnique({
      where: {
        id: id,
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
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, pdfData } = body;

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be pending, approved, or rejected" },
        { status: 400 }
      );
    }

    // Update request status - conditionally include pdfData if provided for approved requests
    const updatedRequest = await prisma.request.update({
      where: {
        id: id,
      },
      data:
        pdfData && status === "approved"
          ? {
              status,
              pdfData: Buffer.from(pdfData, "base64"),
            }
          : {
              status,
            },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error: any) {
    // Handle case where request doesn't exist
    if (
      error?.code === "P2025" ||
      error?.meta?.cause === "Record to update does not exist"
    ) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    console.error("Error updating request:", error);
    return NextResponse.json(
      {
        error: "Failed to update request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    // Delete request from database
    const deletedRequest = await prisma.request.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Request deleted successfully",
      id: deletedRequest.id,
    });
  } catch (error: any) {
    // Handle case where request doesn't exist
    // Prisma throws P2025 error when record is not found
    if (
      error?.code === "P2025" ||
      error?.meta?.cause === "Record to delete does not exist"
    ) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    console.error("Error deleting request:", error);
    return NextResponse.json(
      {
        error: "Failed to delete request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
