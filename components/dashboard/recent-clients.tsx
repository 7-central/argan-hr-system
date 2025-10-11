import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getRecentClients } from '@/app/admin/(protected)/actions';


/**
 * Recent clients component that fetches and displays the latest clients
 * Can be wrapped in Suspense for granular loading states
 */
export async function RecentClients() {
  const recentClients = await getRecentClients(3);

  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle>Placeholder Widget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentClients.length > 0 ? (
            recentClients.map((client, index) => (
              <div key={index} className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{client.companyName}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.serviceTier === 'TIER_1'
                      ? 'Tier 1'
                      : client.serviceTier === 'DOC_ONLY'
                        ? 'Doc Only'
                        : 'Ad-hoc'}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  {client.status === 'ACTIVE'
                    ? 'Active'
                    : client.status === 'INACTIVE'
                      ? 'Inactive'
                      : 'Pending'}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No clients yet. Add your first client to get started.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
