"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Certificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  user: {
    id: string;
    name: string;
  };
  course: {
    id: string;
    title: string;
    instructor: {
      id: string;
      name: string;
    };
  };
}

export default function CertificatePage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchCertificate();
  }, [resolvedParams.certificateNumber]);

  const fetchCertificate = async () => {
    try {
      const response = await fetch(
        `/api/certificates?number=${resolvedParams.certificateNumber}`
      );
      if (!response.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await response.json();
      setCertificate(data.certificate);
    } catch (error) {
      console.error("Failed to fetch certificate:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!certificate) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/certificates/${certificate.certificateNumber}/pdf`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("PDF generation failed:", errorText);
        throw new Error("Failed to generate PDF");
      }
      
      // Check if we got a PDF
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/pdf")) {
        console.error("Invalid content type:", contentType);
        throw new Error("Invalid PDF response");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certificate.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Certificate not found</h1>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Certificate Preview */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
            {/* Certificate Design */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 p-12 border-8 border-double border-blue-200">
              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-blue-400" />
              <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-blue-400" />
              <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-blue-400" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-blue-400" />

              <div className="text-center">
                {/* Logo/Icon */}
                <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>

                <h1 className="text-4xl font-serif text-blue-900 mb-2">
                  Certificate of Completion
                </h1>
                <p className="text-gray-500 mb-8">LearnHub Online Learning Platform</p>

                <p className="text-lg text-gray-600 mb-4">This is to certify that</p>

                <h2 className="text-3xl font-bold text-blue-800 mb-4 border-b-2 border-blue-300 pb-2 inline-block px-8">
                  {certificate.user.name}
                </h2>

                <p className="text-lg text-gray-600 mb-4">
                  has successfully completed the course
                </p>

                <h3 className="text-2xl font-semibold text-gray-800 mb-8">
                  &ldquo;{certificate.course.title}&rdquo;
                </h3>

                <div className="flex justify-center items-center gap-16 mt-12">
                  <div className="text-center">
                    <div className="border-t-2 border-gray-400 pt-2 px-8">
                      <p className="font-semibold">{certificate.course.instructor.name}</p>
                      <p className="text-sm text-gray-500">Instructor</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-gray-400 pt-2 px-8">
                      <p className="font-semibold">
                        {new Date(certificate.issuedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-500">Date Issued</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <p className="text-xs text-gray-400">
                    Certificate ID: {certificate.certificateNumber}
                  </p>
                  <p className="text-xs text-gray-400">
                    Verify at: {typeof window !== "undefined" ? window.location.href : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button onClick={downloadPDF} disabled={isDownloading}>
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
