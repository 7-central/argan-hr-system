/**
 * Case Service
 * Business logic layer for case management
 */

import { prisma } from '@/lib/database';

import type { CaseStatus, ActionParty } from '@prisma/client';

export interface CreateCaseInput {
  clientId: number;
  title: string;
  escalatedBy: string;
  assignedTo?: string | null;
  status?: CaseStatus;
  actionRequiredBy?: ActionParty | null;
  description?: string | null;
}

export interface UpdateCaseInput {
  title?: string;
  escalatedBy?: string;
  assignedTo?: string | null;
  status?: CaseStatus;
  actionRequiredBy?: ActionParty | null;
  description?: string | null;
}

export interface CreateInteractionInput {
  caseId: number;
  party1Name: string;
  party1Type: ActionParty;
  party2Name: string;
  party2Type: ActionParty;
  content: string;
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

export const caseService = {
  /**
   * Get all cases for a client
   */
  async getCasesByClientId(clientId: number) {
    return prisma.case.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            interactions: true,
            files: true,
          },
        },
      },
    });
  },

  /**
   * Get a specific case by ID
   */
  async getCaseById(id: number) {
    return prisma.case.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            interactions: true,
            files: true,
          },
        },
      },
    });
  },

  /**
   * Get a specific case by caseId string (e.g., "CASE-0001")
   */
  async getCaseByCaseId(caseId: string) {
    return prisma.case.findUnique({
      where: { caseId },
    });
  },

  /**
   * Create a new case
   */
  async createCase(input: CreateCaseInput) {
    // Get the last case for this client to generate next case ID
    const lastCase = await prisma.case.findFirst({
      where: { clientId: input.clientId },
      orderBy: { id: 'desc' },
    });

    // Generate case ID (CASE-0001, CASE-0002, etc.)
    const nextNumber = lastCase ? parseInt(lastCase.caseId.split('-')[1]) + 1 : 1;
    const caseId = `CASE-${String(nextNumber).padStart(4, '0')}`;

    return prisma.case.create({
      data: {
        caseId,
        clientId: input.clientId,
        title: input.title,
        escalatedBy: input.escalatedBy,
        assignedTo: input.assignedTo || null,
        status: input.status || 'OPEN',
        actionRequiredBy: input.actionRequiredBy || null,
        description: input.description || null,
      },
      include: {
        _count: {
          select: {
            interactions: true,
            files: true,
          },
        },
      },
    });
  },

  /**
   * Update a case
   */
  async updateCase(id: number, input: UpdateCaseInput) {
    return prisma.case.update({
      where: { id },
      data: input,
      include: {
        _count: {
          select: {
            interactions: true,
            files: true,
          },
        },
      },
    });
  },

  /**
   * Delete a case
   */
  async deleteCase(id: number) {
    return prisma.case.delete({
      where: { id },
    });
  },

  /**
   * Get interactions for a case
   */
  async getInteractionsByCaseId(caseId: number) {
    return prisma.caseInteraction.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            files: true,
          },
        },
      },
    });
  },

  /**
   * Create an interaction
   */
  async createInteraction(input: CreateInteractionInput) {
    return prisma.caseInteraction.create({
      data: input,
      include: {
        _count: {
          select: {
            files: true,
          },
        },
      },
    });
  },

  /**
   * Get files for a case or interaction
   */
  async getFiles(caseId: number, interactionId?: number | null) {
    return prisma.caseFile.findMany({
      where: {
        caseId,
        interactionId: interactionId !== undefined ? interactionId : null,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  },

  /**
   * Create a file record
   */
  async createFile(input: CreateFileInput) {
    return prisma.caseFile.create({
      data: {
        caseId: input.caseId,
        interactionId: input.interactionId || null,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        uploadedBy: input.uploadedBy,
        fileTitle: input.fileTitle || null,
        fileDescription: input.fileDescription || null,
        fileTags: input.fileTags || [],
      },
    });
  },
};
