import { useState, useEffect, useRef, useCallback } from 'react';
import { useGetChatSessionsQuery, useLazyGetChatSessionsQuery } from '@/store/api/chatApi';
import { useGetInterventionsQuery } from '@/store/api/interventionApi';
import { useInterventionSocket } from '@/hooks/useInterventionSocket';
import { SessionItem } from './SessionItem';
import { Search } from 'lucide-react';
import { ChatSession, ChatSessionStatus } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionListProps {
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onPeekSession?: (sessionId: string) => void;
  className?: string;
}

const statusFilters: { label: string; value: ChatSessionStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

const SESSIONS_LIMIT = 20;

export const SessionList = ({
  selectedSessionId,
  onSelectSession,
  onPeekSession,
  className,
}: SessionListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChatSessionStatus | 'all'>('active');

  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useGetChatSessionsQuery({
    status: statusFilter,
    limit: SESSIONS_LIMIT,
    page: 1,
  });
  const [fetchMoreSessions] = useLazyGetChatSessionsQuery();

  useInterventionSocket();

  const { data: interventionsData } = useGetInterventionsQuery({
    status: 'pending',
    limit: 100,
  });

  const pendingSessionIds = new Set(interventionsData?.map(i => i.session_id) || []);

  useEffect(() => {
    if (data?.data?.sessions && !isFetching) {
      setAllSessions(data.data.sessions);
      const totalPages = data.data.pagination.totalPages;
      setHasMore(data.data.pagination.page < totalPages);
      setCurrentPage(1);
    }
  }, [data, isFetching]);

  useEffect(() => {
    setAllSessions([]);
    setCurrentPage(1);
    setHasMore(false);
  }, [statusFilter]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      const result = await fetchMoreSessions({
        status: statusFilter,
        limit: SESSIONS_LIMIT,
        page: nextPage,
      }).unwrap();
      if (result.data?.sessions) {
        setAllSessions(prev => [...prev, ...result.data.sessions]);
        const totalPages = result.data.pagination.totalPages;
        setHasMore(result.data.pagination.page < totalPages);
        setCurrentPage(nextPage);
      }
    } catch {
      toast.error('Failed to load more conversations');
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, statusFilter, fetchMoreSessions]);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !isLoadingMore) handleLoadMore(); },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (loadMoreTriggerRef.current) observer.observe(loadMoreTriggerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, handleLoadMore]);

  const filteredSessions = allSessions.filter((session) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      session.customer_phone.toLowerCase().includes(q) ||
      session.customer_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={cn('flex flex-col h-full bg-white overflow-hidden', className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-outline-variant/40 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-on-surface tracking-tight">Inbox</h2>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">sort</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-container-low rounded-lg border border-transparent focus:outline-none focus:border-primary-container text-on-surface placeholder:text-on-surface-variant/60 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-1.5">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === filter.value
                  ? 'bg-primary-container text-white'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session List */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 bg-surface-container-highest rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-surface-container-high rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] opacity-30 block mb-3">chat</span>
            <p className="text-sm">
              {search ? 'No conversations match your search.' : 'No conversations yet.'}
            </p>
          </div>
        ) : (
          <>
            {filteredSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isSelected={session.id === selectedSessionId}
                hasPendingIntervention={pendingSessionIds.has(session.id)}
                onClick={() => onSelectSession(session.id)}
                onPeek={onPeekSession ? (e) => {
                  e.stopPropagation();
                  onPeekSession(session.id);
                } : undefined}
              />
            ))}
            <div ref={loadMoreTriggerRef} className="py-3 flex justify-center">
              {isLoadingMore && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
