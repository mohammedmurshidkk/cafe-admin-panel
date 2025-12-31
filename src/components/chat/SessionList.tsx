import { useState } from 'react';
import { useGetChatSessionsQuery } from '@/store/api/chatApi';
import { SessionItem } from './SessionItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MessageSquare } from 'lucide-react';
import { ChatSessionStatus } from '@/types';
import { cn } from '@/lib/utils';

interface SessionListProps {
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  className?: string;
}

const statusFilters: { label: string; value: ChatSessionStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

export const SessionList = ({
  selectedSessionId,
  onSelectSession,
  className,
}: SessionListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChatSessionStatus | 'all'>('active');

  const { data, isLoading } = useGetChatSessionsQuery({
    status: statusFilter,
    limit: 50,
  });

  const sessions = data?.data?.sessions || [];

  const filteredSessions = sessions.filter((session) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      session.customer_phone.toLowerCase().includes(searchLower) ||
      session.customer_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={cn('flex flex-col h-full bg-card overflow-hidden', className)}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-border space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversations
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className="flex-1"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Session List - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isSelected={session.id === selectedSessionId}
              onClick={() => onSelectSession(session.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
