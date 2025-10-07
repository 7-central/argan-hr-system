import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft, Briefcase } from 'lucide-react';

import { clientService } from '@/lib/services/business/client.service';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientCasesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientCasesPage({ params }: ClientCasesPageProps) {
  const { id: idString } = await params;

  // Convert string ID to number
  const id = parseInt(idString, 10);

  // Validate ID is a valid number
  if (isNaN(id) || id < 1) {
    notFound();
  }

  // Fetch client data to get company name
  let client;
  try {
    client = await clientService.getClientById(id);
  } catch {
    // Client not found - return 404
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/clients/${id}`}>{client.companyName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cases</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/clients/${id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Cases</h1>
            <p className="text-muted-foreground">{client.companyName}</p>
          </div>
        </div>
      </div>

      {/* Cases Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-amber-800" />
            <CardTitle>Client Cases</CardTitle>
          </div>
          <CardDescription>
            Track and manage cases reported by {client.companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cases yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This is where you&apos;ll be able to view and manage cases reported by this client.
              Cases functionality coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
