import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGetSessionMessagesQuery, useLazyGetSessionMessagesQuery, useMarkSessionAsReadMutation } from '@/store/api/chatApi';
import { ChatMessage } from '@/types';
import { useGetCakePricingConfigQuery } from '@/store/api/cakePricingApi';
import {
  useGetInterventionsBySessionQuery,
  useClaimInterventionMutation,
  useResolveInterventionMutation,
  useCancelInterventionMutation
} from '@/store/api/interventionApi';
import { MessageBubble } from './MessageBubble';
import { ChatInput, ChatInputHandle } from './ChatInput';
import { ForwardMessageModal } from './ForwardMessageModal';
import { useInterventionSocket } from '@/hooks/useInterventionSocket';
import { AiPauseToggle } from './AiPauseToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Phone, X, Forward, History, Eye, MoreVertical, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/utils/formatters';
import { toast } from 'sonner';
import { TimeConfirmationCard } from './interventions/TimeConfirmationCard';
import { CustomCakeRequestCard } from './interventions/CustomCakeRequestCard';
import { LocationConfirmationCard } from './interventions/LocationConfirmationCard';
import { GenericInterventionCard } from './interventions/GenericInterventionCard';
import { InterventionHistorySheet } from './InterventionHistorySheet';
import { ManualOrderModal } from '@/components/orders/ManualOrderModal';

interface ChatViewProps {
  sessionId: string;
  onBack?: () => void;
  onClose?: () => void;
  isPeekMode?: boolean;
  className?: string;
}

// Helper to format weight
const formatWeight = (g: number | string | undefined) => {
  if (!g) return 'N/A';
  const weight = typeof g === 'string' ? parseInt(g) : g;
  if (isNaN(weight)) return 'N/A';
  return weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`;
};

export const ChatView = ({ sessionId, onBack, onClose, isPeekMode, className }: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [manualOrderOpen, setManualOrderOpen] = useState(false);

  // Message selection state for forwarding
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messagesToForward, setMessagesToForward] = useState<ChatMessage[]>([]);

  // Initialize intervention socket
  useInterventionSocket();

  // Cake quote states
  // Cake quote states
  const [quoteExpanded, setQuoteExpanded] = useState(true);
  const [quoteDismissed, setQuoteDismissed] = useState(false);


  // Infinite scroll states
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const lastProcessedDataRef = useRef<string | null>(null); // Track processed data to avoid duplicates

  const { data, isLoading, isFetching } = useGetSessionMessagesQuery(
    { sessionId },
    { refetchOnMountOrArgChange: true } // Force refetch when sessionId changes
  );
  const [fetchMoreMessages] = useLazyGetSessionMessagesQuery();
  const [markAsRead] = useMarkSessionAsReadMutation();

  // Cake quote API hooks
  // Intervention API hooks
  const { data: interventionsData } = useGetInterventionsBySessionQuery(sessionId);
  const [claimIntervention, { isLoading: isClaiming }] = useClaimInterventionMutation();
  const [resolveIntervention, { isLoading: isResolving }] = useResolveInterventionMutation();
  const [cancelIntervention, { isLoading: isCancelling }] = useCancelInterventionMutation();
  const { data: cakePricingData } = useGetCakePricingConfigQuery();

  // Find active intervention (pending or in_review)
  const pendingIntervention = interventionsData?.find(i =>
    ['pending', 'in_review'].includes(i.status)
  );

  // Reset dismissed state when a new intervention appears
  useEffect(() => {
    if (pendingIntervention?.id) {
      setQuoteDismissed(false);
      setQuoteExpanded(true);
    }
  }, [pendingIntervention?.id]);

  const session = data?.data?.session;
  const customer = data?.data?.customer;
  const messages = data?.data?.messages || [];

  // Create a signature of the data to detect changes
  const dataSignature = data?.data?.messages?.[0]?.id + '-' + data?.data?.messages?.length;

  // Unified effect to handle message updates (both initial and real-time)
  useEffect(() => {
    if (!data?.data?.messages || isFetching) return;

    // Skip if we've already processed this exact data
    if (lastProcessedDataRef.current === dataSignature) return;

    const apiMessages = data.data.messages;

    // Check if this is initial load (no messages yet) or a session change
    if (allMessages.length === 0) {
      // Initial load - replace all messages
      const sortedMessages = [...apiMessages].reverse();
      setAllMessages(sortedMessages);
      setHasMore(data.data.pagination.hasMore);
      setInitialScrollDone(true);
      lastProcessedDataRef.current = dataSignature;
      return;
    }

    // Real-time update - only add new messages using functional update to get latest state
    setAllMessages(prev => {
      const localIds = new Set(prev.map(m => m.id));
      const newMessages = apiMessages.filter(m => !localIds.has(m.id)).reverse();

      if (newMessages.length > 0) {
        // Auto-scroll if user is near bottom
        if (isUserNearBottom) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        return [...prev, ...newMessages];
      }
      return prev;
    });

    lastProcessedDataRef.current = dataSignature;
  }, [data, isFetching, dataSignature, isUserNearBottom, allMessages.length]);

  // Track if user is near bottom (for auto-scroll decision)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 150; // pixels from bottom
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      setIsUserNearBottom(nearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (sessionId && !isPeekMode) {
      markAsRead(sessionId);
    }
  }, [sessionId, markAsRead, isPeekMode]);

  // Initial scroll to bottom
  useEffect(() => {
    if (initialScrollDone && messagesEndRef.current && currentPage === 1) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [initialScrollDone, sessionId]);

  // Reset state when session changes
  useEffect(() => {
    setQuoteDismissed(false);
    setQuoteExpanded(true);
    setCurrentPage(1);
    setHasMore(false);
    setAllMessages([]);
    setInitialScrollDone(false);
    setIsUserNearBottom(true);
    lastProcessedDataRef.current = null; // Reset data tracking
    // Reset selection state
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, [sessionId]);

  // Handle message selection
  const handleSelectMessage = useCallback((messageId: string) => {
    setSelectedMessageIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      // Enter selection mode when first message is selected
      if (newSet.size > 0 && !isSelectionMode) {
        setIsSelectionMode(true);
      }
      // Exit selection mode when no messages are selected
      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }
      return newSet;
    });
  }, [isSelectionMode]);

  // Handle forward single message (from hover button)
  const handleForwardSingle = useCallback((message: ChatMessage) => {
    setMessagesToForward([message]);
    setForwardModalOpen(true);
  }, []);

  // Handle forward selected messages
  const handleForwardSelected = useCallback(() => {
    const selectedMessages = allMessages.filter((m) => selectedMessageIds.has(m.id));
    if (selectedMessages.length > 0) {
      setMessagesToForward(selectedMessages);
      setForwardModalOpen(true);
    }
  }, [allMessages, selectedMessageIds]);

  // Cancel selection mode
  const handleCancelSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, []);

  // Close forward modal and reset selection
  const handleCloseForwardModal = useCallback(() => {
    setForwardModalOpen(false);
    setMessagesToForward([]);
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const scrollContainer = messagesContainerRef.current;
    const oldScrollHeight = scrollContainer?.scrollHeight || 0;
    const oldScrollTop = scrollContainer?.scrollTop || 0;

    const nextPage = currentPage + 1;

    try {
      const result = await fetchMoreMessages({ sessionId, page: nextPage }).unwrap();

      if (result.data?.messages) {
        // Reverse incoming older messages: [Oldest ... Older]
        const olderMessages = [...result.data.messages].reverse();

        setAllMessages(prev => [...olderMessages, ...prev]);
        setHasMore(result.data.pagination.hasMore);
        setCurrentPage(nextPage);

        // Restore scroll position
        requestAnimationFrame(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            const heightDifference = newScrollHeight - oldScrollHeight;
            scrollContainer.scrollTop = heightDifference + oldScrollTop;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      toast.error('Failed to load older messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, sessionId, fetchMoreMessages]);

  // Intersection Observer for loading more - only after initial load confirms hasMore
  useEffect(() => {
    // Don't set up observer until initial load is done and we know there's more
    if (!initialScrollDone || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, handleLoadMore, initialScrollDone]);

  const formatWeight = (grams: number) => {
    if (grams >= 1000) return `${grams / 1000}kg`;
    return `${grams}g`;
  };

  const handleClaim = async () => {
    if (!pendingIntervention) return;
    try {
      await claimIntervention(pendingIntervention.id).unwrap();
      toast.success('Intervention claimed');
    } catch (error) {
      toast.error('Failed to claim');
    }
  };

  const handleResolve = async (approved: boolean, price?: number, message?: string, customDeliveryFee?: number) => {
    if (!pendingIntervention) return;

    try {
      await resolveIntervention({
        id: pendingIntervention.id,
        approved,
        price,
        message,
        custom_delivery_fee: customDeliveryFee
      }).unwrap();
      toast.success(approved ? 'Quote sent' : 'Request rejected');
      setQuoteDismissed(true);
    } catch (error) {
      toast.error('Failed to resolve');
    }
  };

  const handleCancel = async () => {
    if (!pendingIntervention) return;
    try {
      await cancelIntervention(pendingIntervention.id).unwrap();
      toast.success('Intervention cancelled');
      setQuoteDismissed(true);
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const displayName = customer?.name || customer?.phone || 'Unknown';

  if ((isLoading || isFetching) && currentPage === 1 && allMessages.length === 0) {
    return (
      <div className={cn('flex flex-col h-full bg-white', className)}>
        <div className="p-4 border-b border-outline-variant/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest animate-pulse flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-surface-container-highest rounded animate-pulse" />
            <div className="h-3 w-24 bg-surface-container-high rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4 bg-surface-container-low">
          {[1, 2, 3].map((i) => (
            <div key={i} className={i % 2 === 0 ? 'flex justify-end' : ''}>
              <div className="h-16 w-48 rounded-2xl bg-surface-container-highest animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-white overflow-hidden', className)}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-outline-variant/40 flex items-center gap-3 bg-white">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <div className="w-10 h-10 rounded-full bg-blush flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-on-surface truncate">{displayName}</h3>
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {formatPhone(customer?.phone)}
          </p>
        </div>

        {session && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Chat Actions">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setManualOrderOpen(true)}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Complete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              title="Intervention History"
            >
              <History className="h-5 w-5" />
            </Button>
            <AiPauseToggle sessionId={sessionId} isPaused={session.ai_paused} />
          </div>
        )}

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {/* Peek Mode Indicator */}
        {isPeekMode && (
          <div className="absolute top-12 left-0 right-0 bg-amber-50 text-amber-700 text-xs px-2 py-1 flex items-center justify-center gap-1.5 z-10 font-medium border-b border-amber-200">
            <Eye className="h-3 w-3" />
            Peek Mode - Messages not marked as read
          </div>
        )}
      </div>

      {/* Selection Toolbar */}
      {isSelectionMode && (
        <div className="flex-shrink-0 px-4 py-2 bg-blush border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelSelection}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <span className="text-sm text-on-surface-variant">
              {selectedMessageIds.size} selected
            </span>
          </div>
          <Button
            onClick={handleForwardSelected}
            size="sm"
            disabled={selectedMessageIds.size === 0}
            className="gap-2"
          >
            <Forward className="h-4 w-4" />
            Forward
          </Button>
        </div>
      )}

      {/* Messages - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 bg-surface-container-low scroll-smooth relative"
      >
        {/* Loading spinner for older messages */}
        <div ref={loadMoreTriggerRef} className="py-2 flex justify-center w-full">
          {isLoadingMore && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        {allMessages.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant">
            <p>No messages yet</p>
          </div>
        ) : (
          <>
            {allMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onImageClick={setLightboxImage}
                isSelectionMode={isSelectionMode}
                isSelected={selectedMessageIds.has(message.id)}
                onSelect={handleSelectMessage}
                onForwardSingle={handleForwardSingle}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Intervention Card */}
      {pendingIntervention && !quoteDismissed && (
        <div className="flex-shrink-0 border-t border-outline-variant/40">
          <div className="bg-blush/60 border-b border-outline-variant/40">
            {(() => {
              switch (pendingIntervention.type) {
                case 'out_of_radius':
                  return (
                    <LocationConfirmationCard
                      intervention={pendingIntervention}
                      isExpanded={quoteExpanded}
                      onExpandToggle={setQuoteExpanded}
                      onResolve={(approved, message, customDeliveryFee) => handleResolve(approved, undefined, message, customDeliveryFee)}
                      isResolving={isResolving}
                    />
                  );
                case 'custom_cake_time_confirmation':
                case 'urgent_delivery':
                  return (
                    <TimeConfirmationCard
                      intervention={pendingIntervention}
                      isExpanded={quoteExpanded}
                      onExpandToggle={setQuoteExpanded}
                      onResolve={(approved, message) => handleResolve(approved, undefined, message)}
                      isResolving={isResolving}
                    />
                  );
                case 'custom_cake':
                  return (
                    <CustomCakeRequestCard
                      intervention={pendingIntervention}
                      isExpanded={quoteExpanded}
                      onExpandToggle={setQuoteExpanded}
                      onClaim={handleClaim}
                      onResolve={(approved, price, message) => handleResolve(approved, price, message)}
                      onCancel={handleCancel}
                      onImageClick={setLightboxImage}
                      isClaiming={isClaiming}
                      isResolving={isResolving}
                      isCancelling={isCancelling}
                      formatWeight={formatWeight}
                    />
                  );
                default:
                  // Default to Generic/Other
                  return (
                    <GenericInterventionCard
                      intervention={pendingIntervention}
                      isExpanded={quoteExpanded}
                      onExpandToggle={setQuoteExpanded}
                      onResolve={(approved, message) => handleResolve(approved, undefined, message)}
                      isResolving={isResolving}
                    />
                  );
              }
            })()}
          </div>
        </div>
      )}

      {/* Input - Fixed */}
      <div className="flex-shrink-0">
        <ChatInput ref={chatInputRef} sessionId={sessionId} disabled={!session} />
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ForwardMessageModal
        isOpen={forwardModalOpen}
        onClose={handleCloseForwardModal}
        messages={messagesToForward}
        currentSessionId={sessionId}
      />

      <InterventionHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        sessionId={sessionId}
      />

      <ManualOrderModal
        open={manualOrderOpen}
        onClose={() => setManualOrderOpen(false)}
        sessionId={sessionId}
        customerPhone={customer?.phone}
      />
    </div>
  );
};
