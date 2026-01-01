import { useEffect, useRef, useState } from 'react';
import { useGetSessionMessagesQuery, useMarkSessionAsReadMutation } from '@/store/api/chatApi';
import { useGetPendingQuoteQuery, useCancelCakeQuoteMutation } from '@/store/api/cakePricingApi';
import { MessageBubble } from './MessageBubble';
import { ChatInput, ChatInputHandle } from './ChatInput';
import { AiPauseToggle } from './AiPauseToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Phone, X, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
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
  const chatInputRef = useRef<ChatInputHandle>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Cake quote states
  const [quoteExpanded, setQuoteExpanded] = useState(true);
  const [quoteDismissed, setQuoteDismissed] = useState(false);

  const { data, isLoading } = useGetSessionMessagesQuery({ sessionId });
  const [markAsRead] = useMarkSessionAsReadMutation();

  // Cake quote API hooks
  const { data: pendingQuoteData } = useGetPendingQuoteQuery(sessionId, {
    pollingInterval: 30000, // Poll every 30 seconds for new quotes
  });
  const [cancelQuote, { isLoading: isCancelling }] = useCancelCakeQuoteMutation();

  const pendingQuote = pendingQuoteData?.data;

  const session = data?.data?.session;
  const customer = data?.data?.customer;
  const messages = data?.data?.messages || [];

  useEffect(() => {
    if (sessionId) {
      markAsRead(sessionId);
    }
  }, [sessionId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset quote UI state when session changes
  useEffect(() => {
    setQuoteDismissed(false);
    setQuoteExpanded(true);
  }, [sessionId]);

  const handleInsertQuoteMessage = () => {
    if (pendingQuote && chatInputRef.current) {
      chatInputRef.current.setMessage(pendingQuote.suggested_message);
      setQuoteExpanded(false);
    }
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

  const displayName = customer?.name || customer?.phone || 'Unknown';

  if (isLoading) {
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-muted/30 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No messages yet</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
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

      {/* Quote Suggestion Bubble */}
      {pendingQuote && !quoteDismissed && (
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
                  <span className="text-sm font-medium">AI Quote Ready - ₹{pendingQuote.suggested_price?.toLocaleString() ?? '—'}</span>
                </div>
                <ChevronUp className="h-4 w-4 text-purple-600" />
              </div>
            ) : (
              /* Expanded State */
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Lightbulb className="h-5 w-5" />
                    <span className="font-semibold">AI Price Suggestion</span>
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

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {/* Detected Elements Summary */}
                    {pendingQuote.ai_analysis?.detected_elements && pendingQuote.ai_analysis.detected_elements.length > 0 && (
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">Detected: </span>
                        {pendingQuote.ai_analysis.detected_elements
                          .slice(0, 4)
                          .map(e => e.quantity > 1 ? `${e.quantity} ${e.element_label.toLowerCase()}` : e.element_label.toLowerCase())
                          .join(', ')}
                        {pendingQuote.ai_analysis.detected_elements.length > 4 && (
                          <span> +{pendingQuote.ai_analysis.detected_elements.length - 4} more</span>
                        )}
                      </div>
                    )}

                    {/* Confidence */}
                    {pendingQuote.ai_analysis?.confidence_score != null && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Confidence: {Math.round(pendingQuote.ai_analysis.confidence_score * 100)}%
                      </div>
                    )}

                    {/* Price */}
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      Suggested: ₹{pendingQuote.suggested_price?.toLocaleString() ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Message Preview */}
                {pendingQuote.suggested_message && (
                  <div className="mt-3 p-3 bg-background/80 rounded-lg border border-border max-h-24 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap line-clamp-3">
                      {pendingQuote.suggested_message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-3">
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
                    Insert Message
                  </Button>
                </div>
              </div>
            )}
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
