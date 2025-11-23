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
import { CheckCircle, AlertCircle, UserCheck, UserPlus } from "lucide-react";
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
  confirm_password: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  trade_specialty?: string;
  phone?: string;
  project_id?: string;
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
  const length = 12;
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*"; // ✅ Specifically defined special chars
  const allChars = upper + lower + numbers + special;

  // 1. GUARANTEE one of each type
  const requiredChars = [
    upper.charAt(Math.floor(Math.random() * upper.length)),
    lower.charAt(Math.floor(Math.random() * lower.length)),
    numbers.charAt(Math.floor(Math.random() * numbers.length)),
    special.charAt(Math.floor(Math.random() * special.length)), // Guaranteed special char
  ];

  // 2. Fill the rest of the length with random characters
  const remainingLength = length - requiredChars.length;
  for (let i = 0; i < remainingLength; i++) {
    requiredChars.push(
      allChars.charAt(Math.floor(Math.random() * allChars.length))
    );
  }

  // 3. Shuffle the array so the special chars aren't always at the start
  // Fisher-Yates Shuffle
  for (let i = requiredChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [requiredChars[i], requiredChars[j]] = [requiredChars[j], requiredChars[i]];
  }

  return requiredChars.join("");
};

const SubFormModal: React.FC<ContractorModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [existingSubcontractor, setExistingSubcontractor] =
    useState<SubcontractorResponse | null>(null);
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

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmailChecked(false);
      setExistingSubcontractor(null);
      setError(null);
      setSuccess(null);
      setContractor({
        firstName: "",
        lastName: "",
        contractorEmail: "",
        contractorPhone: "",
        companyName: "",
        tradeSpecialty: "",
        contractorProjectId: contractor.contractorProjectId,
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContractor((prev) => ({ ...prev, [name]: value }));

    // Reset email check if email changes
    if (name === "contractorEmail") {
      setEmailChecked(false);
      setExistingSubcontractor(null);
      setError(null);
    }
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
    } catch (error) {
      console.error("Error checking subcontractor:", error);
      throw error;
    }
  };

  // Handle email check
  const handleCheckEmail = async () => {
    if (!contractor.contractorEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contractor.contractorEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsCheckingEmail(true);
    setError(null);

    try {
      const existing = await checkSubcontractorExists(
        contractor.contractorEmail.trim()
      );

      setExistingSubcontractor(existing);
      setEmailChecked(true);

      if (existing) {
        // Check if already assigned to this project
        const alreadyAssigned = await checkAlreadyAssigned(
          contractor.contractorProjectId,
          existing.id
        );

        if (alreadyAssigned) {
          setError("This subcontractor is already assigned to this project");
          setEmailChecked(false);
        }
      }
    } catch (error) {
      // ✅ Now we're using the error
      console.error("Error checking email:", error);
      setError("Failed to check email. Please try again.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Check if subcontractor is already assigned to project
  const checkAlreadyAssigned = async (
    projectId: string,
    subcontractorId: string
  ): Promise<boolean> => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data;

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

    if (!contractor.contractorProjectId) {
      setError("No project selected");
      return;
    }

    try {
      setIsSubmitting(true);

      let subcontractorId: string;
      let isNewAccount = false;

      if (existingSubcontractor) {
        subcontractorId = existingSubcontractor.id;
        
        // link them to the project
        await api.post(
          `/subcontractors/${existingSubcontractor.id}/projects/${contractor.contractorProjectId}`
        );
        
        setSuccess("Adding existing subcontractor to your project...");
      } else {
        console.log("Creating new subcontractor account...");

        if (!contractor.firstName.trim() || !contractor.lastName.trim()) {
          setError("First name and last name are required for new accounts");
          setIsSubmitting(false);
          return;
        }

        const tempPassword = generateTemporaryPassword();

        const subcontractorData: SubcontractorCreateRequest = {
          email: contractor.contractorEmail.trim(),
          password: tempPassword,
          confirm_password: tempPassword,
          first_name: contractor.firstName.trim(),
          last_name: contractor.lastName.trim(),
          company_name: contractor.companyName.trim() || undefined,
          trade_specialty: contractor.tradeSpecialty || undefined,
          phone: contractor.contractorPhone.trim() || undefined,
          project_id: contractor.contractorProjectId,
        };

        const createResponse = await api.post(
          "/subcontractors/",
          subcontractorData
        );
        
        const createdSubcontractor = createResponse.data;
        subcontractorId = createdSubcontractor.id;
        isNewAccount = true;

        // Send welcome email (only for new accounts)
        try {
          console.log("Sending welcome email...");
          await api.post(
            `/subcontractors/${subcontractorId}/send-welcome-email`
          );
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
        }
      }
      
      const successMessage = isNewAccount
        ? "Subcontractor invited! They will receive an email to set their password."
        : "Existing subcontractor added to your project successfully!";

      setSuccess(successMessage);

      onSave({ id: subcontractorId });

      setTimeout(() => {
        onClose(false);
      }, 2000);

    } catch (error: any) {
      console.error("Error processing subcontractor:", error);
      
      // Handle "Already Assigned" errors specifically
      const errorMessage = error.response?.data?.detail || error.message;
      
      if (typeof errorMessage === 'string' && errorMessage.includes("already assigned")) {
         setError("This subcontractor is already assigned to this project.");
      } else {
         setError(typeof errorMessage === 'string' ? errorMessage : "Failed to process request");
      }
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
            Enter the email to invite a subcontractor to your project.
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
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="contractorEmail"
                  name="contractorEmail"
                  type="email"
                  value={contractor.contractorEmail}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                  disabled={isSubmitting || emailChecked}
                  className="flex-1"
                />
                {!emailChecked && (
                  <Button
                    type="button"
                    onClick={handleCheckEmail}
                    disabled={
                      isCheckingEmail || !contractor.contractorEmail.trim()
                    }
                    variant="outline"
                  >
                    {isCheckingEmail ? (
                      <svg
                        className="animate-spin h-4 w-4"
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
                    ) : (
                      "Check"
                    )}
                  </Button>
                )}
                {emailChecked && (
                  <Button
                    type="button"
                    onClick={() => {
                      setEmailChecked(false);
                      setExistingSubcontractor(null);
                      setContractor((prev) => ({
                        ...prev,
                        contractorEmail: "",
                      }));
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Change
                  </Button>
                )}
              </div>
            </div>

            {/* Show status after email check */}
            {emailChecked && existingSubcontractor && (
              <Alert className="bg-blue-50 border-blue-200">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  <strong>Existing Account Found:</strong>
                  <br />
                  {existingSubcontractor.first_name}{" "}
                  {existingSubcontractor.last_name}
                  {existingSubcontractor.company_name &&
                    ` - ${existingSubcontractor.company_name}`}
                  <br />
                  <span className="text-xs">
                    Click &quot;Add to Project&quot; to assign them.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {emailChecked && !existingSubcontractor && (
              <Alert className="bg-amber-50 border-amber-200">
                <UserPlus className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  <strong>New Account:</strong> Please fill in the details below
                  to create a new subcontractor account.
                </AlertDescription>
              </Alert>
            )}

            {/* Show additional fields only for new accounts */}
            {emailChecked && !existingSubcontractor && (
              <>
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      New Account Details
                    </span>
                  </div>
                </div>

                {/* First Name - Required for new accounts */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={contractor.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Last Name - Required for new accounts */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={contractor.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
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
                      setContractor((prev) => ({
                        ...prev,
                        tradeSpecialty: value,
                      }))
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
              </>
            )}
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
              disabled={isSubmitting || !emailChecked}
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
              ) : existingSubcontractor ? (
                "Add to Project"
              ) : (
                "Create & Add to Project"
              )}
            </Button>
          </div>

          {!emailChecked && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-700">
                <strong>How it works:</strong>
                <br />
                1. Enter the email address and click &quot;Check&quot;
                <br />
                2. If they exist, we&apos;ll show their details
                <br />
                3. If they&apos;re new, you&apos;ll fill in their information
                <br />
                4. They&apos;ll be added to your project instantly
              </p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubFormModal;
