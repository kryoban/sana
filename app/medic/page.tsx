"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Check, X } from "lucide-react";

type Request = {
  id: number;
  patientName: string;
  patientCnp: string;
  patientBirthDate: string;
  patientCitizenship: string;
  patientAddressStreet: string;
  patientAddressNumber: string | null;
  patientAddressBlock: string | null;
  patientAddressEntrance: string | null;
  patientAddressApartment: string | null;
  patientAddressSector: string;
  patientIdType: string;
  patientIdSeries: string;
  patientIdNumber: string;
  patientIdIssuedBy: string;
  patientIdIssueDate: string;
  doctorName: string;
  doctorSpecialty: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function MedicPage() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [latestRequest, setLatestRequest] = useState<Request | null>(null);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
    fetchAllRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch("/api/requests/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.count);
        setLatestRequest(data.latestRequest);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const fetchAllRequests = async () => {
    try {
      const response = await fetch("/api/requests");
      if (response.ok) {
        const data = await response.json();
        // Filter to only approved and rejected, sort by newest first
        const processedRequests = (data.requests || [])
          .filter(
            (req: Request) =>
              req.status === "approved" || req.status === "rejected"
          )
          .sort(
            (a: Request, b: Request) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        setAllRequests(processedRequests);
      }
    } catch (error) {
      console.error("Error fetching all requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (requestId: number) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `cerere-inscriere-${requestId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleApprove = async (requestId: number) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        // Refresh pending requests and all requests
        await fetchPendingRequests();
        await fetchAllRequests();
      } else {
        const error = await response.json();
        console.error("Error approving request:", error);
        alert("Eroare la aprobare: " + (error.error || "Eroare necunoscută"));
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Eroare la aprobare");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId: number) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (response.ok) {
        // Refresh pending requests and all requests
        await fetchPendingRequests();
        await fetchAllRequests();
      } else {
        const error = await response.json();
        console.error("Error rejecting request:", error);
        alert("Eroare la respingere: " + (error.error || "Eroare necunoscută"));
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Eroare la respingere");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar
        variant="medic"
        activeMenuItem="Cereri noi"
        pendingRequestsCount={pendingCount}
        doctorName={latestRequest?.doctorName}
      />
      <SidebarInset>
        <div className="flex h-screen w-full flex-col bg-background">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="flex h-16 items-center px-6">
              <h1 className="text-2xl font-bold text-foreground">Cereri noi</h1>
            </div>
          </header>
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Se încarcă...</p>
                </div>
              ) : (
                <>
                  {latestRequest && latestRequest.status === "pending" && (
                    <Card className="bg-sidebar">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl mb-2">
                              Cerere de înscriere #{latestRequest.id}
                            </CardTitle>
                            <CardDescription className="-mt-1">
                              {"("}
                              {formatDate(latestRequest.createdAt)}
                              {")"}
                            </CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap border-0"
                            style={{
                              backgroundColor: "#E8C46880",
                              color: "#3F3F46",
                              fontWeight: 600,
                              paddingTop: "4px",
                              paddingBottom: "4px",
                              paddingLeft: "8px",
                              paddingRight: "8px",
                              lineHeight: "1.25",
                              minHeight: "22px",
                            }}
                          >
                            În așteptare
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span style={{ color: "#734DB4" }}>Nume</span>
                              <p className="font-medium">
                                {latestRequest.patientName}
                              </p>
                            </div>
                            <div>
                              <span style={{ color: "#734DB4" }}>CNP</span>
                              <p className="font-medium">
                                {latestRequest.patientCnp}
                              </p>
                            </div>
                            <div>
                              <span style={{ color: "#734DB4" }}>Adresă</span>
                              <p className="font-medium">
                                {latestRequest.patientAddressStreet}
                                {latestRequest.patientAddressNumber &&
                                  `, nr. ${latestRequest.patientAddressNumber}`}
                                {latestRequest.patientAddressBlock &&
                                  `, bl. ${latestRequest.patientAddressBlock}`}
                                {latestRequest.patientAddressEntrance &&
                                  `, sc. ${latestRequest.patientAddressEntrance}`}
                                {latestRequest.patientAddressApartment &&
                                  `, ap. ${latestRequest.patientAddressApartment}`}
                                {`, ${latestRequest.patientAddressSector}`}
                              </p>
                            </div>

                            <div>
                              <span style={{ color: "#734DB4" }}>
                                Data nașterii
                              </span>
                              <p className="font-medium">
                                {latestRequest.patientBirthDate}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t border-border">
                        <Button
                          variant="outline"
                          onClick={() => handleDownloadPDF(latestRequest.id)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descarcă cererea
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleReject(latestRequest.id)}
                            disabled={processing}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Respinge
                          </Button>
                          <Button
                            className="bg-[#FF008C] text-white hover:bg-[#FF008C]/90"
                            onClick={() => handleApprove(latestRequest.id)}
                            disabled={processing}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Aprobă
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  )}

                  {allRequests.length > 0 ? (
                    <div className="space-y-4">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                          Cereri procesate
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Lista cererilor aprobate sau respinse (sortate de la
                          cele mai recente)
                        </p>
                      </div>
                      <div className="space-y-3">
                        {allRequests.map((request) => (
                          <Card key={request.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg">
                                    Cerere de înscriere #{request.id}
                                  </CardTitle>
                                  <CardDescription>
                                    {request.patientName} • Creată la{" "}
                                    {formatDate(request.createdAt)}
                                    {request.status === "approved" &&
                                      ` • Aprobată la ${formatDate(
                                        request.updatedAt
                                      )}`}
                                    {request.status === "rejected" &&
                                      ` • Respinsă la ${formatDate(
                                        request.updatedAt
                                      )}`}
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="whitespace-nowrap border-0"
                                  style={
                                    request.status === "approved"
                                      ? {
                                          backgroundColor: "#06A600",
                                          color: "#FFFFFF",
                                          fontWeight: 600,
                                          paddingTop: "4px",
                                          paddingBottom: "4px",
                                          paddingLeft: "8px",
                                          paddingRight: "8px",
                                          lineHeight: "1.25",
                                          minHeight: "22px",
                                        }
                                      : request.status === "rejected"
                                      ? {
                                          backgroundColor: "#DC2626",
                                          color: "#FFFFFF",
                                          fontWeight: 600,
                                          paddingTop: "4px",
                                          paddingBottom: "4px",
                                          paddingLeft: "8px",
                                          paddingRight: "8px",
                                          lineHeight: "1.25",
                                          minHeight: "22px",
                                        }
                                      : undefined
                                  }
                                >
                                  {request.status === "approved" && "Aprobată"}
                                  {request.status === "rejected" && "Respinsă"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardFooter className="flex justify-end">
                              {request.status === "approved" && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleDownloadPDF(request.id)}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Descarcă cererea aprobată
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : !latestRequest || latestRequest.status !== "pending" ? (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">
                          Nu există cereri de înscriere
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
