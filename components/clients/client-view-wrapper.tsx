'use client';

import { ClientViewContent } from './client-view-content';
import { ClientViewHeader } from './client-view-header';

interface ClientViewWrapperProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any; // Complex serialized type from server - child components handle validation
  editMode: boolean;
  backButton?: React.ReactNode;
  initialTab?: string;
}

export function ClientViewWrapper({ client, editMode, backButton, initialTab }: ClientViewWrapperProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Row with Title and Actions */}
      <div key="client-header" className="flex items-center justify-between">
        <div key="client-title-section" className="flex items-center gap-4">
          {backButton && <div key="back-button">{backButton}</div>}
          <div key="client-title">
            <h1 className="text-3xl font-bold">{client.companyName}</h1>
            <p className="text-sm text-muted-foreground">Client Details</p>
          </div>
        </div>
        <div key="client-actions">
          <ClientViewHeader clientId={client.id} />
        </div>
      </div>

      {/* Content */}
      <ClientViewContent key="client-content" client={client} editMode={editMode} initialTab={initialTab} />
    </div>
  );
}
