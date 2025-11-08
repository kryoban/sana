import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
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

    // Delete request from database
    const deletedRequest = await prisma.request.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully',
      id: deletedRequest.id,
    });
  } catch (error: any) {
    // Handle case where request doesn't exist
    // Prisma throws P2025 error when record is not found
    if (error?.code === 'P2025' || error?.meta?.cause === 'Record to delete does not exist') {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
