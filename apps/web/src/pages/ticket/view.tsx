import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBookingStore } from "../../store/bookings";
import { TicketPDF } from "../../components/booking/ticket-pdf";
import { Button } from "@repo/ui/components/ui/button";
import {
  Printer,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Define type for ReactToPrint options to fix the type error
interface ReactToPrintOptions {
  content: () => React.ReactInstance | null;
  documentTitle?: string;
  onBeforeGetContent?: () => Promise<void> | void;
  onAfterPrint?: () => void;
}

export function TicketViewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { currentBooking, getBookingById, bookingError, isLoading } =
    useBookingStore();
  const navigate = useNavigate();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isLoadingTicket, setIsLoadingTicket] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadingTicketId = localStorage.getItem("loading_ticket_id");
    if (loadingTicketId && loadingTicketId === bookingId) {
      setIsLoadingTicket(true);
    } else {
      setIsLoadingTicket(!(currentBooking && currentBooking.id === bookingId));
    }
  }, [bookingId, currentBooking]);

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
        const storedBookingId = localStorage.getItem("current_booking_id");
        if (storedBookingId) {
          try {
            await getBookingById(storedBookingId);
            setIsLoadingTicket(false);
          } catch (err) {
            console.error("Error fetching stored booking:", err);
            setError("Error loading stored ticket data");
            setIsLoadingTicket(false);
          }
        } else {
          console.log("No booking ID found, redirecting to profile");
          navigate("/profile", { replace: true });
        }
        return;
      }

      if (currentBooking && currentBooking.id === bookingId) {
        setIsLoadingTicket(false);
        return;
      }

      try {
        await getBookingById(bookingId);
        setIsLoadingTicket(false);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Error loading ticket data");
        setIsLoadingTicket(false);
      }
    };

    fetchBookingData();

    return () => {
      localStorage.removeItem("loading_ticket_id");
    };
  }, [bookingId, currentBooking, getBookingById, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pdfSuccess) {
      timer = setTimeout(() => {
        setPdfSuccess(false);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pdfSuccess]);

  const printTicket = useReactToPrint({
    content: () => {
      if (!ticketRef.current) return null;

      const clone = ticketRef.current.cloneNode(true) as HTMLElement;

      const printContainer = document.createElement("div");
      printContainer.id = "print-container";
      printContainer.style.position = "absolute";
      printContainer.style.left = "-9999px";
      printContainer.style.backgroundColor = "#111";
      printContainer.appendChild(clone);

      const printStyles = document.createElement("style");
      printStyles.innerHTML = `
        @media print {
          body, html {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            background-color: #111 !important;
          }
          @page {
            size: auto;
            margin: 0.5cm;
          }
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
        }
      `;
      printContainer.appendChild(printStyles);
      document.body.appendChild(printContainer);

      clone.classList.add("pdf-export-mode");

      return printContainer;
    },
    documentTitle: `Ticket-${bookingId || ""}`,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      setError(null);
      console.log("Preparing to print ticket...");
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    },
    onAfterPrint: () => {
      console.log("Printing completed");
      // Clean up the print container
      const printContainer = document.getElementById("print-container");
      if (printContainer) {
        document.body.removeChild(printContainer);
      }
      setIsPrinting(false);
    },
    onPrintError: (error: Error) => {
      console.error("Print error:", error);
      // Clean up the print container
      const printContainer = document.getElementById("print-container");
      if (printContainer) {
        document.body.removeChild(printContainer);
      }
      setIsPrinting(false);
      setError(
        "Failed to print ticket. Please try again or use Save PDF instead."
      );
    },
    removeAfterPrint: true,
  } as ReactToPrintOptions);

  // Generate and save PDF with proper color handling
  const generatePDF = async () => {
    if (!ticketRef.current) {
      setError("Cannot generate PDF: ticket content not ready");
      return;
    }

    setIsPdfGenerating(true);
    setError(null);

    try {
      // Clone the ticket element to work with an offscreen copy
      const ticketElement = ticketRef.current;
      const clone = ticketElement.cloneNode(true) as HTMLElement;

      // Create an offscreen container with proper backgrounds
      const offscreenContainer = document.createElement("div");
      offscreenContainer.style.position = "absolute";
      offscreenContainer.style.left = "-9999px";
      offscreenContainer.style.backgroundColor = "#111";
      offscreenContainer.appendChild(clone);
      document.body.appendChild(offscreenContainer);

      // Add the class to the clone instead of the visible element
      clone.classList.add("pdf-export-mode");

      // Use setTimeout to ensure class changes are applied before capturing
      setTimeout(async () => {
        try {
          // Generate canvas with better settings on the offscreen element
          const canvas = await html2canvas(clone, {
            scale: 2, // Higher quality
            useCORS: true, // Allow cross-origin images
            allowTaint: true,
            backgroundColor: "#111", // Match ticket background
            logging: false,
            onclone: (document, element) => {
              // Additional style fixes in the cloned document
              const styleElement = document.createElement("style");
              styleElement.innerHTML = `
                * { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }
                [class*="text-[#AEE301]"] { color: #AEE301 !important; }
                [class*="text-neutral-400"] { color: #999999 !important; }
                [class*="border-neutral-800"] { border-color: #333333 !important; }
                body, html { background-color: #111 !important; }
              `;
              document.head.appendChild(styleElement);
            },
          });

          // Create PDF with proper dimensions
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

          // Save the PDF
          pdf.save(`KunalKamra-Ticket-${bookingId || ""}.pdf`);

          setPdfSuccess(true);
          console.log("PDF generation successful");
        } catch (error) {
          console.error("PDF generation error:", error);
          setError(
            `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        } finally {
          // Clean up
          document.body.removeChild(offscreenContainer);
          setIsPdfGenerating(false);
        }
      }, 300);
    } catch (error) {
      console.error("Error preparing for PDF generation:", error);
      setError(
        `Failed to prepare PDF: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsPdfGenerating(false);
    }
  };

  // Handle print button click
  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setPdfSuccess(false);
    console.log("Print button clicked, initiating print...");

    if (!ticketRef.current) {
      console.error("Ticket reference is not available");
      setError("Cannot print: ticket content not ready");
      return;
    }

    printTicket();
  };

  // Handle save PDF button click
  const handleSavePDF = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    setPdfSuccess(false);
    console.log("Save PDF button clicked, initiating PDF generation...");

    if (!ticketRef.current) {
      console.error("Ticket reference is not available");
      setError("Cannot save: ticket content not ready");
      return;
    }

    generatePDF();
  };

  // Loading state
  if (isLoading || isLoadingTicket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] p-4">
        <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">
          Loading your ticket
        </h2>
        <p className="text-gray-400 text-center">
          Please wait while we prepare your ticket...
        </p>
      </div>
    );
  }

  // Error state
  if (bookingError || !currentBooking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] p-4">
        <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-semibold text-red-600 mb-2">
          Ticket Not Found
        </h2>
        <p className="text-gray-400 text-center max-w-md mb-6">
          {bookingError ||
            "We couldn't find the ticket details you're looking for."}
        </p>
        <Button
          onClick={() => navigate("/profile")}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Action buttons */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              className="border-neutral-700 cursor-pointer text-white hover:bg-neutral-700"
              onClick={() => navigate("/profile")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <div className="flex gap-3">
              <Button
                className="bg-[#e31001] hover:bg-[#d31001] cursor-pointer text-white"
                onClick={handleSavePDF}
                disabled={isPrinting || isPdfGenerating}
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : pdfSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    PDF Saved!
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Save PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error message if any */}
          {error && (
            <div className="bg-red-900/40 border border-red-700/40 text-red-300 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Success message if PDF was generated */}
          {pdfSuccess && !error && (
            <div className="bg-green-900/40 border border-green-700/40 text-green-300 p-3 rounded-lg mb-4 text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Your ticket PDF has been successfully generated and downloaded!
            </div>
          )}

          {/* Ticket Preview */}
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
            <h2 className="text-xl font-semibold text-white mb-4 px-2">
              Ticket Preview
            </h2>
            <div className="bg-[#1e1e1e] p-1 rounded-lg overflow-hidden">
              <div ref={ticketRef}>
                <TicketPDF bookingId={bookingId} />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-neutral-800/50 rounded-xl p-6 border border-neutral-700/50">
            <h3 className="text-lg font-medium text-white mb-3">
              Important Information
            </h3>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="bg-[#AEE301] text-black rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Print this ticket or keep it accessible on your mobile device.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#AEE301] text-black rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Present the QR code at the venue entrance for verification.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#AEE301] text-black rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Arrive at least 30 minutes before the show starts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#AEE301] text-black rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  For any issues, contact our support team at
                  support@kunalkamra.events
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketViewPage;
