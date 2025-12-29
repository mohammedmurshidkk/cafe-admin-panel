import { useState } from 'react';
import { MessageSquare, Pause, Play, Phone, Search, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionDetailModal } from '@/components/sessions/SessionDetailModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useGetSessionsQuery, 
  useGetSessionDetailQuery, 
  useToggleAiPauseMutation 
} from '@/store/api/sessionsApi';
import { formatTimeAgo, formatPhone } from '@/utils/formatters';
import { Session, SessionStatus } from '@/types';
import { toast } from 'sonner';

const statusOptions: { value: SessionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Sessions' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const Sessions = () => {
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetSessionsQuery({ 
    status: statusFilter, 
    page, 
    limit: 20 
  });
  const { data: sessionDetail, isLoading: detailLoading, isFetching: detailFetching, refetch: refetchDetail } = useGetSessionDetailQuery(
    selectedSessionId!,
    { skip: !selectedSessionId }
  );
  const [toggleAiPause, { isLoading: isToggling }] = useToggleAiPauseMutation();

  const handleToggleAi = async (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleAiPause({ 
        sessionId: session.id, 
        paused: !session.ai_paused 
      }).unwrap();
      toast.success(session.ai_paused ? 'AI resumed' : 'AI paused');
    } catch (error) {
      toast.error('Failed to toggle AI');
    }
  };

  const handleSessionToggleAi = async (paused: boolean) => {
    if (!selectedSessionId) return;
    try {
      await toggleAiPause({ sessionId: selectedSessionId, paused }).unwrap();
      toast.success(paused ? 'AI paused' : 'AI resumed');
    } catch (error) {
      toast.error('Failed to toggle AI');
    }
  };

  // Filter sessions by phone number search
  const filteredSessions = data?.sessions?.filter(session => 
    !searchQuery || 
    session.customer_phone.toLowerCase().includes(searchQuery.toLowerCase().replace(/\s/g, ''))
  ) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Sessions" 
        description="View and manage customer chat sessions"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SessionStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredSessions.length ? (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className="card-warm p-4 cursor-pointer hover:shadow-elevated transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold">{formatPhone(session.customer_phone)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={session.status}>{session.status}</Badge>
                      {session.ai_paused && <Badge variant="paused">AI Paused</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{session.items_count} items in cart</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(session.last_message_at)}</p>
                  </div>
                  <Button
                    variant={session.ai_paused ? 'success' : 'warning'}
                    size="icon"
                    onClick={(e) => handleToggleAi(session, e)}
                    disabled={isToggling}
                  >
                    {session.ai_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'No sessions found matching your search' : 'No sessions found'}
        </div>
      )}

      {/* Session Detail Modal */}
      <SessionDetailModal
        open={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        sessionDetail={sessionDetail}
        isLoading={detailLoading}
        onToggleAi={handleSessionToggleAi}
        isToggling={isToggling}
        onRefresh={() => refetchDetail()}
        isRefreshing={detailFetching}
      />
    </div>
  );
};

export default Sessions;