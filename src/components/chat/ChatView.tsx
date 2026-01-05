import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGetSessionMessagesQuery, useLazyGetSessionMessagesQuery, useMarkSessionAsReadMutation } from '@/store/api/chatApi';
import { ChatMessage } from '@/types';
import { useGetPendingQuoteQuery, useCancelCakeQuoteMutation, useGetCakePricingConfigQuery, useConfirmCakeQuoteTimeMutation, useRejectCakeQuoteTimeMutation } from '@/store/api/cakePricingApi';
import { MessageBubble } from './MessageBubble';
import { ChatInput, ChatInputHandle } from './ChatInput';
import { AiPauseToggle } from './AiPauseToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Phone, X, Lightbulb, ChevronDown, ChevronUp, Minus, Plus, Clock, Truck, Store, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/utils/formatters';
import { toast } from 'sonner';

interface ChatViewProps {
  sessionId: string;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}

export const ChatView = ({ sessionId, onBack, onClose, className }: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Cake quote states
  const [quoteExpanded, setQuoteExpanded] = useState(true);
  const [quoteDismissed, setQuoteDismissed] = useState(false);

  // Editable quote states
  const [editableWeight, setEditableWeight] = useState<number>(1000);
  const [editableBasePrice, setEditableBasePrice] = useState<number>(0);
  const [editableElements, setEditableElements] = useState<Array<{
    element_key: string;
    element_label: string;
    quantity: number;
    price: number;
  }>>([]);

  // Infinite scroll states
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  const { data, isLoading } = useGetSessionMessagesQuery({ sessionId });
  const [fetchMoreMessages] = useLazyGetSessionMessagesQuery();
  const [markAsRead] = useMarkSessionAsReadMutation();

  // Cake quote API hooks
  const { data: pendingQuoteData } = useGetPendingQuoteQuery(sessionId, {
    pollingInterval: 30000, // Poll every 30 seconds for new quotes
  });
  const [cancelQuote, { isLoading: isCancelling }] = useCancelCakeQuoteMutation();
  const [confirmTime, { isLoading: isConfirmingTime }] = useConfirmCakeQuoteTimeMutation();
  const [rejectTime, { isLoading: isRejectingTime }] = useRejectCakeQuoteTimeMutation();
  const { data: cakePricingData } = useGetCakePricingConfigQuery();
  
  const pendingQuote = pendingQuoteData?.data;
  const weightPricingConfig = cakePricingData?.data?.weights || [];

  // Weight options: 500g to 10kg in 500g intervals
  const weightOptions = useMemo(() => {
    const options = [];
    for (let g = 500; g <= 10000; g += 500) {
      options.push({ value: g, label: g >= 1000 ? `${g / 1000}kg` : `${g}g` });
    }
    return options;
  }, []);

  // Calculate total from editable values
  const calculatedTotal = useMemo(() => {
    const elementsTotal = editableElements.reduce((sum, el) => sum + (el.price * el.quantity), 0);
    return editableBasePrice + elementsTotal;
  }, [editableBasePrice, editableElements]);

  // Initialize editable state when pendingQuote changes
  useEffect(() => {
    if (pendingQuote?.ai_analysis) {
      setEditableBasePrice(pendingQuote.ai_analysis?.price_breakdown?.base_price);
      setEditableElements(
        pendingQuote.ai_analysis.detected_elements.map(el => ({
          element_key: el.element_key,
          element_label: el.element_label,
          quantity: el.quantity,
          price: el.unit_price,
        }))
      );
      // Try to parse weight from suggested price context or default to 1kg
      setEditableWeight(1000);
    }
  }, [pendingQuote?.id]);

  const session = data?.data?.session;
  const customer = data?.data?.customer;
  const messages = data?.data?.messages || [];

  // Initial load - Set messages from page 1 (which should be newest 50)
  useEffect(() => {
    if (data?.data?.messages && currentPage === 1) {
      // Create a new array and reverse to show oldest -> newest (bottom)
      // Assumption: API returns [Newest, ..., Oldest] (descending order)
      const sortedMessages = [...data.data.messages].reverse();
      setAllMessages(sortedMessages);
      setHasMore(data.data.pagination.hasMore);
      setInitialScrollDone(true);
    }
  }, [data, currentPage, sessionId]); // sessionId ensures re-run when switching back to cached session

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

  // Handle real-time updates (new messages appearing in page 1 cache)
  useEffect(() => {
    if (data?.data?.messages && allMessages.length > 0) {
      const latestFromCache = data.data.messages[0]; // Assuming newest is first
      const latestLocal = allMessages[allMessages.length - 1]; // Newest is last

      if (latestFromCache && latestLocal && latestFromCache.id !== latestLocal.id) {
        // Find all new messages that are not in our local state
        const localIds = new Set(allMessages.map(m => m.id));
        const newMessages = data.data.messages.filter(m => !localIds.has(m.id)).reverse();

        if (newMessages.length > 0) {
          setAllMessages(prev => [...prev, ...newMessages]);
          // Only auto-scroll if user is near bottom (WhatsApp behavior)
          if (isUserNearBottom) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      }
    }
  }, [data, allMessages, isUserNearBottom]);

  useEffect(() => {
    if (sessionId) {
      markAsRead(sessionId);
    }
  }, [sessionId, markAsRead]);

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
  }, [sessionId]);

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

  const handleInsertQuoteMessage = () => {
    if (pendingQuote && chatInputRef.current) {
      // Generate simplified message with only weight and total
      const weightLabel = formatWeight(editableWeight);
      const simplifiedMessage = `Your custom cake quote: ${weightLabel} - ₹${calculatedTotal.toLocaleString()}`;
      // Pass quote data along with the message
      chatInputRef.current.setMessage(simplifiedMessage, {
        quote_id: pendingQuote.id,
        quote_price: calculatedTotal,
      });
      setQuoteExpanded(false);
    }
  };

  const handleWeightChange = (newWeight: number) => {
    setEditableWeight(newWeight);
    // Update base price based on weight pricing config
    const weightConfig = weightPricingConfig.find(w => w.weight_grams === newWeight);
    if (weightConfig) {
      setEditableBasePrice(weightConfig.base_price);
    }
  };

  const updateElementQuantity = (index: number, delta: number) => {
    setEditableElements(prev => prev.map((el, i) => {
      if (i === index) {
        const newQty = Math.max(0, el.quantity + delta);
        return { ...el, quantity: newQty };
      }
      return el;
    }));
  };

  const updateElementPrice = (index: number, price: number) => {
    setEditableElements(prev => prev.map((el, i) => {
      if (i === index) {
        return { ...el, price: Math.max(0, price) };
      }
      return el;
    }));
  };

  const handleDismissQuote = async () => {
    if (!pendingQuote) return;

    try {
      await cancelQuote({
        id: pendingQuote.id,
        reason: 'Dismissed by admin'
      }).unwrap();
      setQuoteDismissed(true);
    } catch (error) {
      toast.error('Failed to dismiss quote');
    }
  };

  const handleConfirmTime = async () => {
    if (!pendingQuote) return;

    try {
      await confirmTime(pendingQuote.id).unwrap();
      toast.success('Delivery time confirmed');
      setQuoteDismissed(true);
    } catch (error) {
      toast.error('Failed to confirm time');
    }
  };

  const handleRejectTime = async () => {
    if (!pendingQuote) return;

    try {
      await rejectTime({ id: pendingQuote.id, reason: 'Time slot not available' }).unwrap();
      toast.success('Time rejected - customer will be notified');
      setQuoteDismissed(true);
    } catch (error) {
      toast.error('Failed to reject time');
    }
  };

  const displayName = customer?.name || customer?.phone || 'Unknown';

  if (isLoading && currentPage === 1) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={i % 2 === 0 ? 'flex justify-end' : ''}>
              <Skeleton className="h-16 w-48 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background overflow-hidden', className)}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-3 border-b border-border flex items-center gap-3 bg-card">
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

        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{displayName}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {formatPhone(customer?.phone)}
          </p>
        </div>

        {session && (
          <AiPauseToggle sessionId={sessionId} isPaused={session.ai_paused} />
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
      </div>

      {/* Messages - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 bg-muted/30 scroll-smooth relative"
      >
        {/* Loading spinner for older messages */}
        <div ref={loadMoreTriggerRef} className="py-2 flex justify-center w-full">
          {isLoadingMore && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        {allMessages.length === 0 && !isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No messages yet</p>
          </div>
        ) : (
          <>
            {allMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onImageClick={setLightboxImage}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quote Suggestion Bubble - Price Confirmation */}
      {pendingQuote && !quoteDismissed && pendingQuote.type === 'price_confirmation' && (
        <div className="flex-shrink-0 border-t border-border">
          <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 border-b border-purple-200/50 dark:border-purple-800/50">
            {/* Collapsed State */}
            {!quoteExpanded ? (
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-500/5 transition-colors"
                onClick={() => setQuoteExpanded(true)}
              >
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm font-medium">AI Quote Ready - {formatWeight(editableWeight)} - ₹{calculatedTotal.toLocaleString()}</span>
                </div>
                <ChevronUp className="h-4 w-4 text-purple-600" />
              </div>
            ) : (
              /* Expanded State - Editable */
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Lightbulb className="h-5 w-5" />
                    <span className="font-semibold">AI Price Suggestion</span>
                    {pendingQuote.ai_analysis?.confidence_score != null && (
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(pendingQuote.ai_analysis.confidence_score * 100)}% confidence)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuoteExpanded(false)}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismissQuote}
                      disabled={isCancelling}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex gap-4">
                  {/* Image Thumbnail */}
                  {pendingQuote.image_url && (
                    <div
                      className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-border"
                      onClick={() => setLightboxImage(pendingQuote.image_url)}
                    >
                      <img
                        src={pendingQuote.image_url}
                        alt="Cake design"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Editable Details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Weight & Base Price Row */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Weight:</span>
                        <Select
                          value={String(editableWeight)}
                          onValueChange={(val) => handleWeightChange(parseInt(val))}
                        >
                          <SelectTrigger className="w-24 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {weightOptions.map((opt) => (
                              <SelectItem key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Base:</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={editableBasePrice}
                            onChange={(e) => setEditableBasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-24 h-8 text-sm pl-6"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detected Elements - Editable */}
                    {editableElements.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Design Elements:</span>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {editableElements.map((el, idx) => (
                            <div key={el.element_key} className="flex items-center gap-2 text-sm">
                              <span className="flex-1 truncate text-muted-foreground">{el.element_label}</span>
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateElementQuantity(idx, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center">{el.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateElementQuantity(idx, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              {/* Price Input */}
                              <div className="relative">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  value={el.price}
                                  onChange={(e) => updateElementPrice(idx, parseFloat(e.target.value) || 0)}
                                  className="w-20 h-6 text-xs pl-5"
                                />
                              </div>
                              {/* Subtotal */}
                              <span className="text-xs text-muted-foreground w-16 text-right">
                                = ₹{(el.price * el.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total & Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-200/50 dark:border-purple-800/50">
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    Total: ₹{calculatedTotal.toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDismissQuote}
                      disabled={isCancelling}
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleInsertQuoteMessage}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Insert Quote
                    </Button>
                  </div>
                </div>

                {/* Preview of what will be sent */}
                <div className="mt-2 p-2 bg-background/60 rounded text-xs text-muted-foreground">
                  <span className="font-medium">Will send:</span> Your custom cake quote: {formatWeight(editableWeight)} - ₹{calculatedTotal.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Confirmation Bubble */}
      {pendingQuote && !quoteDismissed && pendingQuote.type === 'time_confirmation' && (
        <div className="flex-shrink-0 border-t border-border">
          <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border-b border-blue-200/50 dark:border-blue-800/50">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Time Confirmation Required</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissQuote}
                  disabled={isCancelling}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-3">
                {/* Requested Time */}
                <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Requested Time</p>
                    <p className="font-medium text-foreground">{pendingQuote.requested_delivery_time}</p>
                  </div>
                </div>

                {/* Fulfillment Type */}
                <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg">
                  {pendingQuote.requested_fulfillment_type === 'delivery' ? (
                    <Truck className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Store className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Fulfillment Type</p>
                    <p className="font-medium text-foreground capitalize">{pendingQuote.requested_fulfillment_type}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-blue-200/50 dark:border-blue-800/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectTime}
                  disabled={isRejectingTime || isConfirmingTime}
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  {isRejectingTime ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmTime}
                  disabled={isConfirmingTime || isRejectingTime}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isConfirmingTime ? 'Confirming...' : 'Confirm Time'}
                </Button>
              </div>
            </div>
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
    </div>
  );
};
