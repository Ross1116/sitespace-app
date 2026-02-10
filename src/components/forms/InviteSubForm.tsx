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
  onSave: (contractor: { id: string }) => void;
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
const secureRandom = (max: number): number => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
};

const generateTemporaryPassword = (): string => {
  const length = 12;
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = upper + lower + numbers + special;

  const requiredChars = [
    upper.charAt(secureRandom(upper.length)),
    lower.charAt(secureRandom(lower.length)),
    numbers.charAt(secureRandom(numbers.length)),
    special.charAt(secureRandom(special.length)),
  ];

  const remainingLength = length - requiredChars.length;
  for (let i = 0; i < remainingLength; i++) {
    requiredChars.push(allChars.charAt(secureRandom(allChars.length)));
  }

  for (let i = requiredChars.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
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

  const tradeOptions = [
    { label: "Electrician", value: "electrician" },
    { label: "Plumber", value: "plumber" },
    { label: "Carpenter", value: "carpenter" },
    { label: "Mason", value: "mason" },
    { label: "Painter", value: "painter" },
    { label: "HVAC", value: "hvac" },
    { label: "Roofer", value: "roofer" },
    { label: "Landscaper", value: "landscaper" },
    { label: "General Contractor", value: "general" },
    { label: "Other", value: "other" },
  ];

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

    if (name === "contractorEmail") {
      setEmailChecked(false);
      setExistingSubcontractor(null);
      setError(null);
    }
  };

  const checkSubcontractorExists = async (
    email: string
  ): Promise<SubcontractorResponse | null> => {
    try {
      const response = await api.get("/subcontractors/search", {
        params: {
          search_term: email,
          limit: 1,
        },
      });

      const subcontractors = response.data?.subcontractors || [];

      const exactMatch = subcontractors.find(
        (sub: SubcontractorResponse) =>
          sub.email.toLowerCase() === email.toLowerCase()
      );

      if (exactMatch) {
        return exactMatch;
      }

      return null;
    } catch (error) {
      console.error("Error checking subcontractor:", error);
      throw error;
    }
  };

  const handleCheckEmail = async () => {
    if (!contractor.contractorEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

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
      console.error("Error checking email:", error);
      setError("Failed to check email. Please try again.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkAlreadyAssigned = async (
    projectId: string,
    subcontractorId: string
  ): Promise<boolean> => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data as {
        subcontractors?: Array<{ id?: string }>;
      };

      const isAssigned = project.subcontractors?.some(
        (sub) => sub.id === subcontractorId
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

        await api.post(
          `/subcontractors/${existingSubcontractor.id}/projects/${contractor.contractorProjectId}`
        );

        setSuccess("Adding existing subcontractor to your project...");
      } else {
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
          // Ensure empty string is converted to undefined
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

        try {
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
    } catch (error: unknown) {
      console.error("Error processing subcontractor:", error);

      // Safe error extraction handling generic 500s or complex 422s
      let errorMessage = "Failed to process request";
      
      const detail =
        typeof error === "object" && error !== null
          ? (error as { response?: { data?: { detail?: unknown } } }).response
              ?.data?.detail
          : undefined;

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail
          .map((err) =>
            typeof err === "object" && err !== null && "msg" in err
              ? String((err as { msg?: unknown }).msg ?? "")
              : "",
          )
          .filter(Boolean)
          .join(", ");
      } else if (detail !== undefined) {
        errorMessage = JSON.stringify(detail);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.toLowerCase().includes("already assigned")) {
        setError("This subcontractor is already assigned to this project.");
      } else {
        setError(errorMessage);
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
                      {tradeOptions.map((trade) => (
                        <SelectItem key={trade.value} value={trade.value}>
                          {trade.label}
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
