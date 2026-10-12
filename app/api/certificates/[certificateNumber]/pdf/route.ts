import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import PDFDocument from "pdfkit";

// Force Node.js runtime for PDFKit
export const runtime = "nodejs";

// Same palette as the on-screen certificate (app/globals.css)
const PAPER = "#efece2";
const CARD = "#fffdf6";
const INK = "#12201a";
const FOREST = "#0e5c4a";
const HIGHLIGHT = "#e4f95b";
const MUTED = "#5f6b65";

// GET /api/certificates/[certificateNumber]/pdf - Generate PDF certificate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> },
) {
  try {
    const { certificateNumber } = await params;

    const certificate = await db.certificate.findUnique({
      where: { certificateNumber },
      include: {
        user: { select: { id: true, name: true } },
        course: {
          select: {
            id: true,
            title: true,
            instructor: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 },
      );
    }

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      info: {
        Title: `LearnHub certificate ${certificate.certificateNumber}`,
        Author: "LearnHub",
        Subject: certificate.course.title,
      },
    });

    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const W = doc.page.width;
    const H = doc.page.height;
    const cx = W / 2;
    const centered = (
      text: string,
      y: number,
      opts: Record<string, unknown> = {},
    ) =>
      doc.text(text, 0, y, {
        width: W,
        align: "center",
        lineBreak: false,
        ...opts,
      });

    // ------------------------------------------------------------ paper and card
    doc.rect(0, 0, W, H).fill(PAPER);
    const m = 22;
    doc
      .roundedRect(m, m, W - m * 2, H - m * 2, 16)
      .fillAndStroke(CARD, "#d9d8cf");

    // Faint concentric rings rising from below, like the guilloche on screen.
    doc.save();
    doc.roundedRect(m, m, W - m * 2, H - m * 2, 16).clip();
    doc.lineWidth(0.6).strokeColor(FOREST).strokeOpacity(0.06);
    for (let r = 40; r < W; r += 12) doc.circle(cx, H * 1.2, r).stroke();
    doc.restore();

    // Inner frame
    doc
      .roundedRect(m + 16, m + 16, W - (m + 16) * 2, H - (m + 16) * 2, 10)
      .lineWidth(0.8)
      .strokeColor(FOREST)
      .strokeOpacity(0.3)
      .stroke();
    doc.strokeOpacity(1);

    // ------------------------------------------------------------ logo
    const logoSize = 26;
    const wordmark = "LearnHub";
    doc.font("Times-Roman").fontSize(24);
    const lockupW = logoSize + 9 + doc.widthOfString(wordmark);
    const lx = cx - lockupW / 2;
    const ly = 74;
    doc.save();
    doc.translate(lx, ly).scale(logoSize / 32);
    doc.roundedRect(0, 0, 32, 32, 8).fill(FOREST);
    doc
      .path(
        "M7 10.5c3-1 6-.8 9 .9 3-1.7 6-1.9 9-.9v12c-3-1-6-.8-9 .9-3-1.7-6-1.9-9-.9z",
      )
      .fill("#f6f4ec");
    doc.moveTo(16, 11.4).lineTo(16, 23.4).lineWidth(1.2).stroke(FOREST);
    doc.roundedRect(9, 15, 5.5, 2.6, 1).fill(HIGHLIGHT);
    doc.restore();
    doc
      .fillColor(INK)
      .text(wordmark, lx + logoSize + 9, ly + 3, { lineBreak: false });

    // ------------------------------------------------------------ wording
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(FOREST);
    centered("CERTIFICATE  OF  COMPLETION", 140, { characterSpacing: 2.2 });

    doc.font("Helvetica").fontSize(13).fillColor(MUTED);
    centered("This certifies that", 178);

    // Name, with the highlighter stroke behind it
    const name = certificate.user.name || "Student";
    let nameSize = 54;
    doc.font("Times-Roman").fontSize(nameSize);
    while (doc.widthOfString(name) > W - 220 && nameSize > 30)
      doc.fontSize(--nameSize);
    const nameW = doc.widthOfString(name);
    const nameY = 204;
    doc
      .rect(
        cx - nameW / 2 - 8,
        nameY + nameSize * 0.5,
        nameW + 16,
        nameSize * 0.36,
      )
      .fill(HIGHLIGHT);
    doc.fillColor(INK);
    centered(name, nameY);

    doc.font("Helvetica").fontSize(13).fillColor(MUTED);
    centered("completed every lesson of", nameY + nameSize + 24);

    doc.font("Times-Italic").fontSize(30).fillColor(INK);
    doc.text(certificate.course.title, 90, nameY + nameSize + 48, {
      width: W - 180,
      align: "center",
    });

    // ------------------------------------------------------------ signatures
    const issued = new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const colW = 200;
    const gap = 60;
    const sigY = 430;
    [
      [certificate.course.instructor.name, "Course curator"],
      [issued, "Date issued"],
    ].forEach(([value, label], i) => {
      const x = cx - colW - gap / 2 + i * (colW + gap);
      doc
        .moveTo(x, sigY)
        .lineTo(x + colW, sigY)
        .lineWidth(0.8)
        .strokeColor(INK)
        .strokeOpacity(0.35)
        .stroke();
      doc.strokeOpacity(1);
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(INK)
        .text(value, x, sigY + 10, { width: colW, lineBreak: false });
      doc
        .font("Helvetica")
        .fontSize(10.5)
        .fillColor(MUTED)
        .text(label, x, sigY + 27, { width: colW, lineBreak: false });
    });

    // ------------------------------------------------------------ verification
    const verifyUrl = `${request.nextUrl.origin}/certificates/${certificate.certificateNumber}`;
    doc.font("Courier").fontSize(8.5).fillColor(MUTED);
    centered(`${certificate.certificateNumber}  ·  ${verifyUrl}`, H - 76, {
      link: verifyUrl,
    });

    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Generate PDF error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate PDF", details: errorMessage },
      { status: 500 },
    );
  }
}
