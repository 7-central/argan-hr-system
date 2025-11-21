/**
 * Case Service
 * Business logic layer for case management
 */

import { prisma } from '@/lib/database';

import type {
  CreateCaseInput,
  UpdateCaseInput,
  CreateInteractionInput,
  CreateFileInput,
} from '@/lib/types/case';
import type { ActionParty } from '@prisma/client';

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
   * Get all cases across all clients (for call log view)
   * Returns cases with client info and last interaction date
   */
  async getAllCases() {
    const cases = await prisma.case.findMany({
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            serviceTier: true,
            status: true,
          },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
          },
        },
        _count: {
          select: {
            interactions: true,
            files: true,
          },
        },
      },
    });

    // Transform to include lastInteractionDate
    return cases.map(caseItem => ({
      ...caseItem,
      lastInteractionDate: caseItem.interactions[0]?.createdAt || caseItem.createdAt,
    }));
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
    // Get the last case globally to generate next case ID
    // Order by caseId string to ensure we get the highest case number
    const lastCase = await prisma.case.findFirst({
      orderBy: { caseId: 'desc' },
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
        actionRequired: input.actionRequired || null,
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
      data: {
        caseId: input.caseId,
        party1Name: input.party1Name,
        party1Type: input.party1Type,
        party2Name: input.party2Name,
        party2Type: input.party2Type,
        content: input.content,
        actionRequired: input.actionRequired || null,
        actionRequiredBy: input.actionRequiredBy || null,
        actionRequiredByDate: input.actionRequiredByDate ? new Date(input.actionRequiredByDate) : null,
      },
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
   * Update an interaction
   */
  async updateInteraction(
    interactionId: number,
    input: {
      party1Name?: string;
      party1Type?: ActionParty;
      party2Name?: string;
      party2Type?: ActionParty;
      content?: string;
      actionRequired?: string | null;
      actionRequiredBy?: ActionParty | null;
      actionRequiredByDate?: string | null;
    }
  ) {
    // Convert date string to Date object if provided
    const data = {
      ...input,
      actionRequiredByDate: input.actionRequiredByDate !== undefined
        ? (input.actionRequiredByDate ? new Date(input.actionRequiredByDate) : null)
        : undefined,
    };

    return prisma.caseInteraction.update({
      where: { id: interactionId },
      data,
      include: {
        case: true,
        _count: {
          select: {
            files: true,
          },
        },
      },
    });
  },

  /**
   * Set an interaction as the active action for its case
   * This will unset all other active actions for the same case
   * and update the case's action fields with the interaction's data
   */
  async setActiveAction(interactionId: number) {
    // Get the interaction to find its case and action data
    const interaction = await prisma.caseInteraction.findUnique({
      where: { id: interactionId },
    });

    if (!interaction) {
      throw new Error('Interaction not found');
    }

    // Use a transaction to ensure consistency
    return prisma.$transaction(async (tx) => {
      // First, unset all active actions for this case
      await tx.caseInteraction.updateMany({
        where: {
          caseId: interaction.caseId,
          isActiveAction: true,
        },
        data: {
          isActiveAction: false,
        },
      });

      // Set this interaction as the active action
      const updatedInteraction = await tx.caseInteraction.update({
        where: { id: interactionId },
        data: { isActiveAction: true },
        include: {
          _count: {
            select: {
              files: true,
            },
          },
        },
      });

      // Update the parent case with this interaction's action data
      await tx.case.update({
        where: { id: interaction.caseId },
        data: {
          actionRequired: interaction.actionRequired,
          actionRequiredBy: interaction.actionRequiredBy,
        },
      });

      return updatedInteraction;
    });
  },

  /**
   * Unset the active action for an interaction
   * This will clear the isActiveAction flag and clear the case's action fields
   */
  async unsetActiveAction(interactionId: number) {
    // Get the interaction to find its case
    const interaction = await prisma.caseInteraction.findUnique({
      where: { id: interactionId },
    });

    if (!interaction) {
      throw new Error('Interaction not found');
    }

    // Use a transaction to ensure consistency
    return prisma.$transaction(async (tx) => {
      // Unset the active action flag
      const updatedInteraction = await tx.caseInteraction.update({
        where: { id: interactionId },
        data: { isActiveAction: false },
        include: {
          _count: {
            select: {
              files: true,
            },
          },
        },
      });

      // Clear the parent case's action fields
      await tx.case.update({
        where: { id: interaction.caseId },
        data: {
          actionRequired: null,
          actionRequiredBy: null,
        },
      });

      return updatedInteraction;
    });
  },

  /**
   * Delete an interaction
   * If the interaction is the active action, clear the case's action fields
   */
  async deleteInteraction(id: number) {
    // Get the interaction first to check if it's active and get the caseId
    const interaction = await prisma.caseInteraction.findUnique({
      where: { id },
    });

    if (!interaction) {
      throw new Error('Interaction not found');
    }

    // Use a transaction to ensure consistency
    return prisma.$transaction(async (tx) => {
      // Delete the interaction
      const deletedInteraction = await tx.caseInteraction.delete({
        where: { id },
      });

      // If this was the active action, clear the case's action fields
      if (interaction.isActiveAction) {
        await tx.case.update({
          where: { id: interaction.caseId },
          data: {
            actionRequired: null,
            actionRequiredBy: null,
          },
        });
      }

      return deletedInteraction;
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
