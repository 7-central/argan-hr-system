/**
 * Case Management Types
 * Shared types for case-related operations across layers
 */

import type { CaseStatus, ActionParty } from '@prisma/client';

export interface CreateCaseInput {
  clientId: number;
  title: string;
  escalatedBy: string;
  assignedTo?: string | null;
  status?: CaseStatus;
  actionRequiredBy?: ActionParty | null;
  actionRequired?: string | null;
  description?: string | null;
}

export interface UpdateCaseInput {
  title?: string;
  escalatedBy?: string;
  assignedTo?: string | null;
  status?: CaseStatus;
  actionRequiredBy?: ActionParty | null;
  actionRequired?: string | null;
  description?: string | null;
}

export interface CreateInteractionInput {
  caseId: number;
  party1Name: string;
  party1Type: ActionParty;
  party2Name: string;
  party2Type: ActionParty;
  content: string;
  actionRequired?: string | null;
  actionRequiredBy?: ActionParty | null;
}

export interface CreateFileInput {
  caseId: number;
  interactionId?: number | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  fileTitle?: string | null;
  fileDescription?: string | null;
  fileTags?: string[];
}
