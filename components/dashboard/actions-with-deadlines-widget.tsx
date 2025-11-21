import Link from 'next/link';

import { Calendar, Clock, AlertCircle } from 'lucide-react';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { ActionParty, ServiceTier } from '@prisma/client';

interface ActionWithDeadline {
  caseId: string;
  caseNumericId: number;
  caseTitle: string;
  clientId: number;
  clientName: string;
  clientTier: ServiceTier;
  actionRequiredBy: ActionParty | null;
  actionRequired: string | null;
  actionRequiredByDate: Date;
  interactionId: number;
}

/**
 * Get badge color for party type
 */
function getPartyBadge(type: string | null): string {
  switch (type) {
    case 'ARGAN':
      return 'bg-green-100 text-green-900';
    case 'CLIENT':
      return 'bg-gray-100 text-gray-900';
    case 'CONTRACTOR':
      return 'bg-blue-100 text-blue-700';
    case 'EMPLOYEE':
      return 'bg-yellow-100 text-yellow-700';
    case 'THIRD_PARTY':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Check if date is overdue
 */
function isOverdue(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface ActionsWithDeadlinesWidgetProps {
  casesWithDates: ActionWithDeadline[];
}

/**
 * Actions with Deadlines Widget
 * Shows cases with active interactions that have action required by dates
 */
export function ActionsWithDeadlinesWidget({ casesWithDates }: ActionsWithDeadlinesWidgetProps) {

  return (
    <Card className="col-span-full border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Actions with Deadlines
          </CardTitle>
          <Badge variant="secondary">{casesWithDates.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {casesWithDates.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No actions with deadlines</p>
          </div>
        ) : (
          <div className="space-y-3">
            {casesWithDates.map((item) => {
              const overdue = isOverdue(item.actionRequiredByDate);
              return (
                <div
                  key={item.interactionId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    overdue ? 'border-red-200 bg-red-50' : 'border-border bg-muted/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/admin/clients/${item.clientId}/cases?case=${item.caseNumericId}`}
                        className="font-medium text-sm hover:underline truncate"
                      >
                        {item.caseId} - {item.caseTitle}
                      </Link>
                      {overdue && (
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="truncate">{item.clientName}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {item.clientTier}
                      </Badge>
                    </div>
                    {item.actionRequired && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.actionRequired}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    {item.actionRequiredBy && (
                      <Badge className={`text-xs ${getPartyBadge(item.actionRequiredBy)}`}>
                        {item.actionRequiredBy}
                      </Badge>
                    )}
                    <div
                      className={`text-sm font-medium ${
                        overdue ? 'text-red-600' : 'text-foreground'
                      }`}
                    >
                      {formatDate(item.actionRequiredByDate)}
                    </div>
                    <Link href={`/admin/clients/${item.clientId}/cases?case=${item.caseNumericId}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
