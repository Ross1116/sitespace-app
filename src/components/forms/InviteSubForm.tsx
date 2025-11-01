"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";

// ===== TYPE DEFINITIONS =====
interface ContractorModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSave: (contractor: any) => void;
}

interface SubcontractorCreateRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  trade_specialty?: string;
  phone?: string;
}

interface SubcontractorResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  trade_specialty?: string;
  phone?: string;
  is_active: boolean;
}

interface Contractor {
  firstName: string;
  lastName: string;
  contractorEmail: string;
  contractorPhone: string;
  companyName: string;
  tradeSpecialty: string;
  contractorProjectId: string;
}

// ===== HELPER FUNCTIONS =====
const generateTemporaryPassword = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const SubFormModal: React.FC<ContractorModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = user?.id;

  const [contractor, setContractor] = useState<Contractor>({
    firstName: "",
    lastName: "",
    contractorEmail: "",
    contractorPhone: "",
    companyName: "",
    tradeSpecialty: "",
    contractorProjectId: "",
  });

  // Trade specialties list
  const tradeSpecialties = [
    "Electrical",
    "Plumbing",
    "HVAC",
    "Carpentry",
    "Masonry",
    "Roofing",
    "Painting",
    "Flooring",
    "Landscaping",
    "Concrete",
    "Drywall",
    "Insulation",
    "Welding",
    "Excavation",
    "General Contractor",
    "Other",
  ];

  // Load project from localStorage
  useEffect(() => {
    const projectStorageKey = `project_${userId}`;
    const projectString = localStorage.getItem(projectStorageKey);

    if (projectString) {
      try {
        const project = JSON.parse(projectString);
        setContractor((prev) => ({
          ...prev,
          contractorProjectId: project.id,
        }));
      } catch (error) {
        console.error("Error parsing project:", error);
      }
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContractor((prev) => ({ ...prev, [name]: value }));
  };

  // Check if subcontractor exists by email
  const checkSubcontractorExists = async (
    email: string
  ): Promise<SubcontractorResponse | null> => {
    try {
      console.log("Checking if subcontractor exists:", email);

      // Use search endpoint to find by email
      const response = await api.get("/subcontractors/search", {
        params: {
          search_term: email,
          limit: 1,
        },
      });

      const subcontractors = response.data?.subcontractors || [];

      // Find exact email match (case-insensitive)
      const exactMatch = subcontractors.find(
        (sub: SubcontractorResponse) =>
          sub.email.toLowerCase() === email.toLowerCase()
      );

      if (exactMatch) {
        console.log("Found existing subcontractor:", exactMatch);
        return exactMatch;
      }

      return null;
    } catch (error: any) {
      console.error("Error checking subcontractor:", error);
      // If search fails, return null (will try to create)
      return null;
    }
  };

  // Check if subcontractor is already assigned to project
  const checkAlreadyAssigned = async (
    projectId: string,
    subcontractorId: string
  ): Promise<boolean> => {
    try {
      // Get project details to check assigned subcontractors
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data;

      // Check if subcontractor is in the assigned list
      const isAssigned = project.subcontractors?.some(
        (sub: any) => sub.id === subcontractorId
      );

      return isAssigned || false;
    } catch (error) {
      console.error("Error checking assignment:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!contractor.contractorEmail.trim()) {
      setError("Email is required");
      return;
    }

    if (!contractor.contractorProjectId) {
      setError("No project selected");
      return;
    }

    try {
      setIsSubmitting(true);

      // Step 1: Check if subcontractor already exists
      const existingSubcontractor = await checkSubcontractorExists(
        contractor.contractorEmail.trim()
      );

      let subcontractorId: string;
      let isNewAccount = false;

      if (existingSubcontractor) {
        // Subcontractor exists - use their ID
        console.log("Subcontractor already exists, will add to project");
        subcontractorId = existingSubcontractor.id;

        // Check if already assigned to this project
        const alreadyAssigned = await checkAlreadyAssigned(
          contractor.contractorProjectId,
          subcontractorId
        );

        if (alreadyAssigned) {
          setError(
            "This subcontractor is already assigned to this project"
          );
          setIsSubmitting(false);
          return;
        }

        // Update success message to indicate existing account
        setSuccess("Found existing subcontractor account");
      } else {
        // Subcontractor doesn't exist - create new account
        console.log("Creating new subcontractor account...");

        // Validation for new accounts
        if (!contractor.firstName.trim() || !contractor.lastName.trim()) {
          setError("First name and last name are required for new accounts");
          return;
        }

        const tempPassword = generateTemporaryPassword();

        const subcontractorData: SubcontractorCreateRequest = {
          email: contractor.contractorEmail.trim(),
          password: tempPassword,
          first_name: contractor.firstName.trim(),
          last_name: contractor.lastName.trim(),
          company_name: contractor.companyName.trim() || undefined,
          trade_specialty: contractor.tradeSpecialty || undefined,
          phone: contractor.contractorPhone.trim() || undefined,
        };

        const createResponse = await api.post(
          "/subcontractors/",
          subcontractorData
        );
        const createdSubcontractor = createResponse.data;

        console.log("Subcontractor created:", createdSubcontractor);
        subcontractorId = createdSubcontractor.id;
        isNewAccount = true;
      }

      // Step 2: Assign subcontractor to the project
      try {
        console.log("Assigning to project:", contractor.contractorProjectId);

        await api.post(
          `/projects/${contractor.contractorProjectId}/subcontractors`,
          {
            subcontractor_id: subcontractorId,
            hourly_rate: null, // Optional: can be added to form later
          }
        );

        console.log("Subcontractor assigned to project successfully");
      } catch (assignError: any) {
        console.error("Error assigning to project:", assignError);
        
        // Check if it's a "already assigned" error
        if (assignError.response?.status === 400) {
          setError("This subcontractor is already assigned to this project");
          setIsSubmitting(false);
          return;
        }
        
        throw assignError;
      }

      // Step 3: Send password reset email (only for new accounts)
      if (isNewAccount) {
        try {
          console.log("Sending password reset email to new account...");
          await api.post("/auth/forgot-password", {
            email: contractor.contractorEmail.trim(),
          });
          console.log("Password reset email sent");
        } catch (emailError) {
          console.error("Error sending reset email:", emailError);
          // Don't fail if email sending fails
        }
      }

      // Show success message
      const successMessage = isNewAccount
        ? "Subcontractor invited! They will receive an email to set their password."
        : "Existing subcontractor added to your project successfully!";

      setSuccess(successMessage);

      // Call onSave callback
      onSave({ id: subcontractorId });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose(false);
        // Reset form
        setContractor({
          firstName: "",
          lastName: "",
          contractorEmail: "",
          contractorPhone: "",
          companyName: "",
          tradeSpecialty: "",
          contractorProjectId: contractor.contractorProjectId,
        });
        setSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error("Error processing subcontractor:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to process subcontractor";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold">
            Invite Subcontractor
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Enter the email to invite a subcontractor. If they already have an
            account, we'll just add them to your project.
          </p>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-4">
            {/* Email - Always Required */}
            <div className="space-y-2">
              <Label htmlFor="contractorEmail">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contractorEmail"
                name="contractorEmail"
                type="email"
                value={contractor.contractorEmail}
                onChange={handleChange}
                placeholder="Enter email address"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                We'll check if this email exists in our system
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  For new accounts only
                </span>
              </div>
            </div>

            {/* First Name - Required for new accounts */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={contractor.firstName}
                onChange={handleChange}
                placeholder="Required for new accounts"
                disabled={isSubmitting}
              />
            </div>

            {/* Last Name - Required for new accounts */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={contractor.lastName}
                onChange={handleChange}
                placeholder="Required for new accounts"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="contractorPhone">Phone Number</Label>
              <Input
                id="contractorPhone"
                name="contractorPhone"
                type="tel"
                value={contractor.contractorPhone}
                onChange={handleChange}
                placeholder="Optional"
                disabled={isSubmitting}
              />
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                value={contractor.companyName}
                onChange={handleChange}
                placeholder="Optional"
                disabled={isSubmitting}
              />
            </div>

            {/* Trade Specialty */}
            <div className="space-y-2">
              <Label htmlFor="tradeSpecialty">Trade Specialty</Label>
              <Select
                value={contractor.tradeSpecialty}
                onValueChange={(value) =>
                  setContractor((prev) => ({ ...prev, tradeSpecialty: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trade specialty" />
                </SelectTrigger>
                <SelectContent>
                  {tradeSpecialties.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Add to Project"
              )}
            </Button>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-xs text-blue-700">
              <strong>How it works:</strong>
              <br />
              • If the email exists, we'll add them to your project
              <br />
              • If it's new, we'll create an account and send a password setup
              email
              <br />• Name and other details are only needed for new accounts
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubFormModal;