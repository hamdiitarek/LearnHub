import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import PDFDocument from "pdfkit";

// Force Node.js runtime for PDFKit
export const runtime = "nodejs";

// GET /api/certificates/[certificateNumber]/pdf - Generate PDF certificate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  try {
    const { certificateNumber } = await params;

    const certificate = await db.certificate.findUnique({
      where: { certificateNumber },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Create PDF
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Collect PDF data into buffer
    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => {
        try {
          resolve(Buffer.concat(chunks));
        } catch (err) {
          reject(err);
        }
      });
      doc.on("error", reject);
    });

    // Colors
    const primaryBlue = "#1e40af";
    const lightBlue = "#3b82f6";
    const gray = "#6b7280";
    const darkGray = "#1f2937";

    // Page dimensions
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background
    doc.rect(0, 0, pageWidth, pageHeight).fill("#f8fafc");

    // Border
    doc
      .rect(30, 30, pageWidth - 60, pageHeight - 60)
      .lineWidth(3)
      .stroke(lightBlue);

    // Inner border
    doc
      .rect(40, 40, pageWidth - 80, pageHeight - 80)
      .lineWidth(1)
      .stroke("#93c5fd");

    // Decorative corners
    const cornerSize = 30;
    // Top left
    doc.moveTo(50, 50).lineTo(50 + cornerSize, 50).lineWidth(3).stroke(lightBlue);
    doc.moveTo(50, 50).lineTo(50, 50 + cornerSize).stroke(lightBlue);
    // Top right
    doc.moveTo(pageWidth - 50, 50).lineTo(pageWidth - 50 - cornerSize, 50).stroke(lightBlue);
    doc.moveTo(pageWidth - 50, 50).lineTo(pageWidth - 50, 50 + cornerSize).stroke(lightBlue);
    // Bottom left
    doc.moveTo(50, pageHeight - 50).lineTo(50 + cornerSize, pageHeight - 50).stroke(lightBlue);
    doc.moveTo(50, pageHeight - 50).lineTo(50, pageHeight - 50 - cornerSize).stroke(lightBlue);
    // Bottom right
    doc.moveTo(pageWidth - 50, pageHeight - 50).lineTo(pageWidth - 50 - cornerSize, pageHeight - 50).stroke(lightBlue);
    doc.moveTo(pageWidth - 50, pageHeight - 50).lineTo(pageWidth - 50, pageHeight - 50 - cornerSize).stroke(lightBlue);

    // Badge circle
    const centerX = pageWidth / 2;
    doc.circle(centerX, 100, 35).fill(lightBlue);
    doc.fontSize(30).fillColor("#ffffff").text("✓", centerX - 12, 82);

    // Title
    doc
      .fontSize(36)
      .fillColor(primaryBlue)
      .text("Certificate of Completion", 0, 150, { align: "center", width: pageWidth });

    // Subtitle
    doc
      .fontSize(14)
      .fillColor(gray)
      .text("LearnHub Online Learning Platform", 0, 195, { align: "center", width: pageWidth });

    // Certify text
    doc
      .fontSize(16)
      .fillColor(gray)
      .text("This is to certify that", 0, 240, { align: "center", width: pageWidth });

    // Student name
    doc
      .fontSize(32)
      .fillColor(primaryBlue)
      .text(certificate.user.name || "Student", 0, 270, { align: "center", width: pageWidth });

    // Underline for name
    const nameWidth = doc.widthOfString(certificate.user.name || "Student");
    doc
      .moveTo(centerX - nameWidth / 2 - 20, 310)
      .lineTo(centerX + nameWidth / 2 + 20, 310)
      .lineWidth(2)
      .stroke("#93c5fd");

    // Course completion text
    doc
      .fontSize(16)
      .fillColor(gray)
      .text("has successfully completed the course", 0, 330, { align: "center", width: pageWidth });

    // Course title
    doc
      .fontSize(24)
      .fillColor(darkGray)
      .text(`"${certificate.course.title}"`, 0, 360, { align: "center", width: pageWidth });

    // Signatures section
    const signatureY = 440;
    const leftSignX = pageWidth / 3;
    const rightSignX = (pageWidth * 2) / 3;

    // Instructor signature
    doc
      .moveTo(leftSignX - 80, signatureY)
      .lineTo(leftSignX + 80, signatureY)
      .lineWidth(1)
      .stroke(gray);
    doc
      .fontSize(14)
      .fillColor(darkGray)
      .text(certificate.course.instructor.name, leftSignX - 80, signatureY + 10, { width: 160, align: "center" });
    doc
      .fontSize(11)
      .fillColor(gray)
      .text("Instructor", leftSignX - 80, signatureY + 30, { width: 160, align: "center" });

    // Date signature
    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc
      .moveTo(rightSignX - 80, signatureY)
      .lineTo(rightSignX + 80, signatureY)
      .lineWidth(1)
      .stroke(gray);
    doc
      .fontSize(14)
      .fillColor(darkGray)
      .text(issuedDate, rightSignX - 80, signatureY + 10, { width: 160, align: "center" });
    doc
      .fontSize(11)
      .fillColor(gray)
      .text("Date Issued", rightSignX - 80, signatureY + 30, { width: 160, align: "center" });

    // Footer
    doc
      .fontSize(9)
      .fillColor("#9ca3af")
      .text(`Certificate ID: ${certificate.certificateNumber}`, 0, pageHeight - 80, { align: "center", width: pageWidth });
    doc
      .text(`Verify at: learnhub.com/certificates/${certificate.certificateNumber}`, 0, pageHeight - 65, { align: "center", width: pageWidth });

    // Finalize PDF
    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Generate PDF error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: errorMessage },
      { status: 500 }
    );
  }
}
