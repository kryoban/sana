"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Download, Eye, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function AdminPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/requests");
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      } else {
        console.error("Failed to fetch requests");
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDownloadPDF = async (id: number) => {
    try {
      const response = await fetch(`/api/requests/${id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `request-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to download PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ro-RO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteClick = (id: number) => {
    setRequestToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/requests/${requestToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the request from the list
        setRequests((prev) =>
          prev.filter((req) => req.id !== requestToDelete)
        );
        setDeleteDialogOpen(false);
        setRequestToDelete(null);
        // Close details dialog if the deleted request was selected
        if (selectedRequest?.id === requestToDelete) {
          setSelectedRequest(null);
        }
      } else {
        console.error("Failed to delete request");
        alert("Failed to delete request. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("An error occurred while deleting the request.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/requests/delete-all", {
        method: "DELETE",
      });

      if (response.ok) {
        // Clear all requests from the list
        setRequests([]);
        setDeleteAllDialogOpen(false);
        setSelectedRequest(null);
      } else {
        console.error("Failed to delete all requests");
        alert("Failed to delete all requests. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting all requests:", error);
      alert("An error occurred while deleting all requests.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen w-full flex-col bg-background p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Request Management</CardTitle>
                  <CardDescription>
                    View and manage all patient requests
                    {requests.length > 0 && ` (${requests.length} total)`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {requests.length > 0 && (
                    <Button
                      onClick={handleDeleteAllClick}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  )}
                  <Button onClick={fetchRequests} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No requests found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>CNP</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.id}
                          </TableCell>
                          <TableCell>{request.patientName}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {request.patientCnp}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {request.doctorName}
                              </div>
                              {request.doctorSpecialty && (
                                <div className="text-sm text-muted-foreground">
                                  {request.doctorSpecialty}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(request.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(request.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(request.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Details Dialog */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Request Details #{selectedRequest.id}</CardTitle>
                      <CardDescription>
                        Created: {formatDateTime(selectedRequest.createdAt)}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(null)}
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Patient Information</h3>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name: </span>
                          {selectedRequest.patientName}
                        </div>
                        <div>
                          <span className="text-muted-foreground">CNP: </span>
                          <span className="font-mono">
                            {selectedRequest.patientCnp}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Birth Date:{" "}
                          </span>
                          {selectedRequest.patientBirthDate}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Citizenship:{" "}
                          </span>
                          {selectedRequest.patientCitizenship}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Address: </span>
                          {[
                            selectedRequest.patientAddressStreet,
                            selectedRequest.patientAddressNumber &&
                              `nr. ${selectedRequest.patientAddressNumber}`,
                            selectedRequest.patientAddressBlock &&
                              `bl. ${selectedRequest.patientAddressBlock}`,
                            selectedRequest.patientAddressEntrance &&
                              `sc. ${selectedRequest.patientAddressEntrance}`,
                            selectedRequest.patientAddressApartment &&
                              `ap. ${selectedRequest.patientAddressApartment}`,
                            selectedRequest.patientAddressSector,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">ID Information</h3>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          {selectedRequest.patientIdType}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Series: </span>
                          {selectedRequest.patientIdSeries}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Number: </span>
                          {selectedRequest.patientIdNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Issued By:{" "}
                          </span>
                          {selectedRequest.patientIdIssuedBy}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Issue Date:{" "}
                          </span>
                          {selectedRequest.patientIdIssueDate}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Doctor Information</h3>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name: </span>
                          {selectedRequest.doctorName}
                        </div>
                        {selectedRequest.doctorSpecialty && (
                          <div>
                            <span className="text-muted-foreground">
                              Specialty:{" "}
                            </span>
                            {selectedRequest.doctorSpecialty}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Request Status</h3>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status: </span>
                          {getStatusBadge(selectedRequest.status)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created: </span>
                          {formatDateTime(selectedRequest.createdAt)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Updated: </span>
                          {formatDateTime(selectedRequest.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleDownloadPDF(selectedRequest.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedRequest(null);
                        handleDeleteClick(selectedRequest.id);
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete Request
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this request? This action
                  cannot be undone. The request and all associated data will be
                  permanently removed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setRequestToDelete(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete All Confirmation Dialog */}
          <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete All Requests
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete all {requests.length} requests?
                  This action cannot be undone. All requests and associated data
                  will be permanently removed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteAllDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAllConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : `Delete All (${requests.length})`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

