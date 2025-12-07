import { useState } from 'react';
import { MessageSquare, Pause, Play, Phone } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/FormModal';
import { Skeleton } from '@/components/ui/skeleton';
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
import { formatTimeAgo, formatPhone, formatDateTime } from '@/utils/formatters';
import { Session, SessionStatus } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusOptions: { value: SessionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Sessions' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const Sessions = () => {
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data, isLoading } = useGetSessionsQuery({ 
    status: statusFilter, 
    page, 
    limit: 20 
  });
  const { data: sessionDetail, isLoading: detailLoading } = useGetSessionDetailQuery(
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Sessions" 
        description="View and manage customer chat sessions"
      />

      {/* Filter */}
      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SessionStatus | 'all')}>
          <SelectTrigger className="w-48">
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
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : data?.sessions?.length ? (
        <div className="grid gap-4">
          {data.sessions.map((session) => (
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
          No sessions found
        </div>
      )}

      {/* Session Detail Modal */}
      <FormModal
        open={!!selectedSessionId}
        onOpenChange={() => setSelectedSessionId(null)}
        title="Session Details"
        description={sessionDetail?.session ? formatPhone(sessionDetail.session.customer_phone) : ''}
      >
        {detailLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : sessionDetail && (
          <div className="space-y-6">
            {/* Cart Items */}
            {sessionDetail.session.items?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Cart Items</h4>
                <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                  {sessionDetail.session.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div>
              <h4 className="font-semibold mb-3">Conversation</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sessionDetail.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-3 rounded-lg max-w-[85%]",
                      msg.direction === 'inbound' 
                        ? "bg-muted ml-0" 
                        : "bg-primary/10 ml-auto"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
};

export default Sessions;
