import { NextRequest, NextResponse } from 'next/server';
import { generatePDFAsBase64 } from '@/lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      signatureDataUrl,
      doctorName,
      userData,
      approvedFields,
    } = body;

    // Validate required fields
    if (!signatureDataUrl) {
      return NextResponse.json(
        { error: 'Missing required field: signatureDataUrl' },
        { status: 400 }
      );
    }

    // Generate PDF on the server
    const pdfBase64 = await generatePDFAsBase64({
      signatureDataUrl,
      doctorName,
      userData,
      approvedFields,
    });

    // Return the base64 PDF
    return NextResponse.json({
      success: true,
      pdfData: pdfBase64,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

