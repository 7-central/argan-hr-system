/**
 * Case Management Server Actions
 * Handles all case-related operations following the Server Actions pattern
 */

'use server';

import { revalidatePath } from 'next/cache';

import { withAuth } from '@/lib/server-actions/with-auth';
import { adminService } from '@/lib/services/business/admin.service';
import { caseService } from '@/lib/services/business/case.service';

import type {
  CreateCaseInput,
  UpdateCaseInput,
  CreateInteractionInput,
  CreateFileInput,
} from '@/lib/types/case';

/**
 * Get all active admin users
 */
export const getAdminUsers = withAuth(
  async (
    _session
  ): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      name: string;
      email: string;
    }>;
    error?: string;
  }> => {
    try {
      const admins = await adminService.getActiveAdminUsers();

      return { success: true, data: admins };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to fetch admin users',
      };
    }
  }
);

/**
 * Get all cases for a client
 */
export const getCasesByClientId = withAuth(
  async (
    _session,
    clientId: number
  ): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      caseId: string;
      title: string;
      creationDate: string;
      status: string;
      actionRequired: string | null;
      escalatedBy: string;
      assignedTo: string | null;
      description: string | null;
      interactionCount: number;
      fileCount: number;
    }>;
    error?: string;
  }> => {
    try {
      const cases = await caseService.getCasesByClientId(clientId);

      // Transform to frontend format
      const transformedCases = cases.map((c) => ({
        id: c.id,
        caseId: c.caseId,
        title: c.title,
        creationDate: c.createdAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: c.status,
        actionRequired: c.actionRequiredBy,
        escalatedBy: c.escalatedBy,
        assignedTo: c.assignedTo,
        description: c.description,
        interactionCount: c._count.interactions,
        fileCount: c._count.files,
      }));

      return { success: true, data: transformedCases };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to fetch cases',
      };
    }
  }
);

/**
 * Create a new case
 */
export const createCase = withAuth(
  async (
    _session,
    input: CreateCaseInput
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      caseId: string;
      title: string;
      creationDate: string;
      status: string;
      actionRequired: string | null;
      escalatedBy: string;
      assignedTo: string | null;
      description: string | null;
      interactionCount: number;
      fileCount: number;
    };
    error?: string;
  }> => {
    try {
      const newCase = await caseService.createCase(input);

      // Transform to frontend format
      const transformedCase = {
        id: newCase.id,
        caseId: newCase.caseId,
        title: newCase.title,
        creationDate: newCase.createdAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: newCase.status,
        actionRequired: newCase.actionRequiredBy,
        escalatedBy: newCase.escalatedBy,
        assignedTo: newCase.assignedTo,
        description: newCase.description,
        interactionCount: newCase._count.interactions,
        fileCount: newCase._count.files,
      };

      revalidatePath(`/admin/clients/${input.clientId}/cases`);

      return { success: true, data: transformedCase };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to create case',
      };
    }
  }
);

/**
 * Update a case
 */
export const updateCase = withAuth(
  async (
    _session,
    id: number,
    input: UpdateCaseInput
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      caseId: string;
      title: string;
      creationDate: string;
      status: string;
      actionRequiredBy: string | null;
      actionRequired: string | null;
      escalatedBy: string;
      assignedTo: string | null;
      description: string | null;
      interactionCount: number;
      fileCount: number;
    };
    error?: string;
  }> => {
    try {
      const updatedCase = await caseService.updateCase(id, input);

      // Transform to frontend format
      const transformedCase = {
        id: updatedCase.id,
        caseId: updatedCase.caseId,
        title: updatedCase.title,
        creationDate: updatedCase.createdAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: updatedCase.status,
        actionRequiredBy: updatedCase.actionRequiredBy,
        actionRequired: updatedCase.actionRequired,
        escalatedBy: updatedCase.escalatedBy,
        assignedTo: updatedCase.assignedTo,
        description: updatedCase.description,
        interactionCount: updatedCase._count.interactions,
        fileCount: updatedCase._count.files,
      };

      // Get clientId for revalidation
      const caseData = await caseService.getCaseById(id);
      if (caseData) {
        revalidatePath(`/admin/clients/${caseData.clientId}/cases`);
      }

      return { success: true, data: transformedCase };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to update case',
      };
    }
  }
);

/**
 * Delete a case
 */
export const deleteCase = withAuth(
  async (
    _session,
    id: number,
    clientId: number
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      await caseService.deleteCase(id);

      revalidatePath(`/admin/clients/${clientId}/cases`);

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to delete case',
      };
    }
  }
);

/**
 * Get interactions for a case
 */
export const getInteractionsByCaseId = withAuth(
  async (
    _session,
    caseId: number
  ): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      date: string;
      party1Name: string;
      party1Type: string;
      party2Name: string;
      party2Type: string;
      content: string;
      fileCount: number;
      isActiveAction: boolean;
      actionRequired: string | null;
      actionRequiredBy: string | null;
    }>;
    error?: string;
  }> => {
    try {
      const interactions = await caseService.getInteractionsByCaseId(caseId);

      // Transform to frontend format
      const transformedInteractions = interactions.map((i) => ({
        id: i.id,
        date: i.createdAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        party1Name: i.party1Name,
        party1Type: i.party1Type,
        party2Name: i.party2Name,
        party2Type: i.party2Type,
        content: i.content,
        fileCount: i._count.files,
        isActiveAction: i.isActiveAction,
        actionRequired: i.actionRequired,
        actionRequiredBy: i.actionRequiredBy,
        actionRequiredByDate: i.actionRequiredByDate ? i.actionRequiredByDate.toISOString().split('T')[0] : null,
      }));

      return { success: true, data: transformedInteractions };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to fetch interactions',
      };
    }
  }
);

/**
 * Create an interaction
 */
export const createInteraction = withAuth(
  async (
    _session,
    input: CreateInteractionInput
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      date: string;
      party1Name: string;
      party1Type: string;
      party2Name: string;
      party2Type: string;
      content: string;
      fileCount: number;
      isActiveAction: boolean;
      actionRequired: string | null;
      actionRequiredBy: string | null;
      actionRequiredByDate: string | null;
    };
    error?: string;
  }> => {
    try {
      const interaction = await caseService.createInteraction(input);

      // Transform to frontend format
      const transformedInteraction = {
        id: interaction.id,
        date: interaction.createdAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        party1Name: interaction.party1Name,
        party1Type: interaction.party1Type,
        party2Name: interaction.party2Name,
        party2Type: interaction.party2Type,
        content: interaction.content,
        fileCount: interaction._count.files,
        isActiveAction: interaction.isActiveAction,
        actionRequired: interaction.actionRequired,
        actionRequiredBy: interaction.actionRequiredBy,
        actionRequiredByDate: interaction.actionRequiredByDate ? interaction.actionRequiredByDate.toISOString().split('T')[0] : null,
      };

      // Get case to find clientId for revalidation
      const caseData = await caseService.getCaseById(input.caseId);
      if (caseData) {
        revalidatePath(`/admin/clients/${caseData.clientId}/cases`);
      }

      return { success: true, data: transformedInteraction };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to create interaction',
      };
    }
  }
);

/**
 * Update an interaction
 */
export const updateInteraction = withAuth(
  async (
    _session,
    interactionId: number,
    input: {
      party1Name?: string;
      party1Type?: 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY';
      party2Name?: string;
      party2Type?: 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY';
      content?: string;
      actionRequired?: string | null;
      actionRequiredBy?: 'ARGAN' | 'CLIENT' | 'CONTRACTOR' | 'EMPLOYEE' | 'THIRD_PARTY' | null;
      actionRequiredByDate?: string | null;
    }
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      date: string;
      party1Name: string;
      party1Type: string;
      party2Name: string;
      party2Type: string;
      content: string;
      fileCount: number;
      isActiveAction: boolean;
      actionRequired: string | null;
      actionRequiredBy: string | null;
      actionRequiredByDate: string | null;
    };
    error?: string;
  }> => {
    try {
      // Update the interaction using the case service
      const updatedInteraction = await caseService.updateInteraction(interactionId, input);

      // Transform to frontend format
      const transformedInteraction = {
        id: updatedInteraction.id,
        date: updatedInteraction.createdAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        party1Name: updatedInteraction.party1Name,
        party1Type: updatedInteraction.party1Type,
        party2Name: updatedInteraction.party2Name,
        party2Type: updatedInteraction.party2Type,
        content: updatedInteraction.content,
        fileCount: updatedInteraction._count.files,
        isActiveAction: updatedInteraction.isActiveAction,
        actionRequired: updatedInteraction.actionRequired,
        actionRequiredBy: updatedInteraction.actionRequiredBy,
        actionRequiredByDate: updatedInteraction.actionRequiredByDate ? updatedInteraction.actionRequiredByDate.toISOString().split('T')[0] : null,
      };

      // Revalidate the path using the clientId from the related case
      revalidatePath(`/admin/clients/${updatedInteraction.case.clientId}/cases`);

      return { success: true, data: transformedInteraction };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to update interaction',
      };
    }
  }
);

/**
 * Delete an interaction
 */
export const deleteInteraction = withAuth(
  async (
    _session,
    interactionId: number
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      // Delete the interaction (this will also cascade delete related files)
      await caseService.deleteInteraction(interactionId);

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to delete interaction',
      };
    }
  }
);

/**
 * Create a file record (after S3 upload)
 */
export const createFileRecord = withAuth(
  async (
    _session,
    input: CreateFileInput
  ): Promise<{
    success: boolean;
    data?: {
      id: number;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      uploadedBy: string;
      uploadedAt: string;
    };
    error?: string;
  }> => {
    try {
      const file = await caseService.createFile(input);

      // Transform to frontend format
      const transformedFile = {
        id: file.id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt.toLocaleDateString('en-GB'),
      };

      // Get case to find clientId for revalidation
      const caseData = await caseService.getCaseById(input.caseId);
      if (caseData) {
        revalidatePath(`/admin/clients/${caseData.clientId}/cases`);
      }

      return { success: true, data: transformedFile };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to create file record',
      };
    }
  }
);

/**
 * Get files for a case or interaction
 */
export const getFiles = withAuth(
  async (
    _session,
    caseId: number,
    interactionId?: number | null
  ): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      uploadedBy: string;
      uploadedAt: string;
      fileTitle: string | null;
      fileDescription: string | null;
      fileTags: string[];
    }>;
    error?: string;
  }> => {
    try {
      const files = await caseService.getFiles(caseId, interactionId);

      // Transform to frontend format
      const transformedFiles = files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileSize: f.fileSize,
        uploadedBy: f.uploadedBy,
        uploadedAt: f.uploadedAt.toLocaleDateString('en-GB'),
        fileTitle: f.fileTitle,
        fileDescription: f.fileDescription,
        fileTags: f.fileTags,
      }));

      return { success: true, data: transformedFiles };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to fetch files',
      };
    }
  }
);

/**
 * Set an interaction as the active action
 * This will unset all other active actions and update the case's action fields
 */
export const setActiveAction = withAuth(
  async (
    _session,
    interactionId: number,
    clientId: number
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      await caseService.setActiveAction(interactionId);

      revalidatePath(`/admin/clients/${clientId}/cases`);

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to set active action',
      };
    }
  }
);

/**
 * Unset the active action for an interaction
 * This will clear the case's action fields
 */
export const unsetActiveAction = withAuth(
  async (
    _session,
    interactionId: number,
    clientId: number
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      await caseService.unsetActiveAction(interactionId);

      revalidatePath(`/admin/clients/${clientId}/cases`);

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return {
        success: false,
        error: 'Failed to unset active action',
      };
    }
  }
);
