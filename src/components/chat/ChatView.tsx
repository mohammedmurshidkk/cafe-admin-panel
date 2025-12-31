import { useEffect, useRef, useState } from 'react';
import { useGetSessionMessagesQuery, useMarkSessionAsReadMutation } from '@/store/api/chatApi';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { AiPauseToggle } from './AiPauseToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  sessionId: string;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}

export const ChatView = ({ sessionId, onBack, onClose, className }: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data, isLoading } = useGetSessionMessagesQuery({ sessionId });
  const [markAsRead] = useMarkSessionAsReadMutation();

  console.log('##### ___ ', data)

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
            {customer?.phone}
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

      {/* Input - Fixed */}
      <div className="flex-shrink-0">
        <ChatInput sessionId={sessionId} disabled={!session} />
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
