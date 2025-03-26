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
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";

interface ContractorModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSave: (contractor: Contractor) => void;
}

interface Contractor {
  contractorName: string;
  contractorEmail: string;
  contractorPhone: string;
  contractorProjectId: string;
}

const SubFormModal: React.FC<ContractorModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const userId = user?.userId;

  const [contractor, setContractor] = useState<Contractor>({
    contractorName: "",
    contractorEmail: "",
    contractorPhone: "",
    contractorProjectId: "",
  });

  useEffect(() => {
    const projectStorageKey = `selectedProject_${userId}`;
    const projectString = localStorage.getItem(projectStorageKey);

    if (projectString) {
      try {
        const project = JSON.parse(projectString);
        // Update contractor state with project ID
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Double-check that we have the project ID
      if (!contractor.contractorProjectId) {
        const projectStorageKey = `selectedProject_${userId}`;
        const projectString = localStorage.getItem(projectStorageKey);

        if (!projectString) {
          console.error("No project found in localStorage");
          return;
        }

        const project = JSON.parse(projectString);
        // Update contractor with project ID before submission
        setContractor((prev) => ({
          ...prev,
          contractorProjectId: project.id,
        }));
      }

      const response = await api.post(
        "/api/auth/subContractor/subcontractorRegMail",
        contractor
      );

      const data = response.data;
      onSave(data);
      onClose(false);

      // Reset form
      setContractor({
        contractorName: "",
        contractorEmail: "",
        contractorPhone: "",
        contractorProjectId: contractor.contractorProjectId, // Keep the project ID
      });
    } catch (error) {
      console.error("Error sending invite:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold">
            Invite Sub-Contractor
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Please enter the details below to invite a contractor or vendor to
            your project.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractorName">Name</Label>
              <Input
                id="contractorName"
                name="contractorName"
                value={contractor.contractorName}
                onChange={handleChange}
                placeholder="Enter contractor name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorEmail">Email</Label>
              <Input
                id="contractorEmail"
                name="contractorEmail"
                type="email"
                value={contractor.contractorEmail}
                onChange={handleChange}
                placeholder="Enter contractor email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorPhone">Phone Number</Label>
              <Input
                id="contractorPhone"
                name="contractorPhone"
                value={contractor.contractorPhone}
                onChange={handleChange}
                placeholder="Enter contractor phone number"
                required
              />
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Invite Email"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubFormModal;
