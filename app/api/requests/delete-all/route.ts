import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    // Delete all requests from database
    const result = await prisma.request.deleteMany();
    const deletedCount = result.count;

    return NextResponse.json({
      success: true,
      message: `All requests deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all requests:', error);
    return NextResponse.json(
      { error: 'Failed to delete requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
