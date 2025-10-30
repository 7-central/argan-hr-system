import { caseService } from '@/lib/services/business/case.service';

import { CallLogContent } from '@/components/cases/call-log-content';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/**
 * Call Log Cases Page
 * Shows all cases across all clients in a call log style
 */
export default async function CallLogPage() {
  // Fetch all cases across all clients
  const casesData = await caseService.getAllCases();

  // Transform to match frontend format
  const cases = casesData.map(c => ({
    id: c.id,
    caseId: c.caseId,
    title: c.title,
    clientId: c.clientId,
    clientName: c.client.companyName,
    clientTier: c.client.serviceTier,
    creationDate: c.createdAt.toLocaleDateString('en-GB'),
    lastInteractionDate: c.lastInteractionDate.toLocaleDateString('en-GB'),
    lastInteractionDateTime: c.lastInteractionDate,
    status: c.status,
    actionRequiredBy: c.actionRequiredBy,
    actionRequired: c.actionRequired,
    escalatedBy: c.escalatedBy,
    assignedTo: c.assignedTo,
    description: c.description,
    interactionCount: c._count.interactions,
    fileCount: c._count.files,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-muted/80">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cases</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Cases</h1>
        <p className="text-muted-foreground">All cases across all clients</p>
      </div>

      {/* Call Log Content */}
      <CallLogContent cases={cases} />
    </div>
  );
}
