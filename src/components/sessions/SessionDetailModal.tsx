import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionDetail } from '@/types';
import { formatDateTime, formatPhone } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Pause,
  Play,
  ShoppingCart,
  RefreshCw,
  X,
  History
} from 'lucide-react';
import { InterventionHistorySheet } from '../chat/InterventionHistorySheet';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { MessageBubble } from '../chat/MessageBubble';

interface SessionDetailModalProps {
  open: boolean;
  onClose: () => void;
  sessionDetail: SessionDetail | undefined;
  isLoading: boolean;
  onToggleAi?: (paused: boolean) => Promise<void>;
  isToggling?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SessionDetailModal = ({
  open,
  onClose,
  sessionDetail,
  isLoading,
  onToggleAi,
  isToggling = false,
  onRefresh,
  isRefreshing = false,
}: SessionDetailModalProps) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (open && sessionDetail?.messages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [open, sessionDetail?.messages]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden [&>button]:top-4 [&>button]:right-4 [&>button]:z-50 [&>button]:bg-background [&>button]:rounded-full [&>button]:shadow-md [&>button]:border [&>button]:border-border">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : sessionDetail ? (
          <div className="flex flex-col h-[80vh]">
            {/* Header - WhatsApp Style */}
            <div className="bg-secondary/10 border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {formatPhone(sessionDetail.session.customer_phone)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={sessionDetail.session.status}>
                        {sessionDetail.session.status}
                      </Badge>
                      {sessionDetail.session.ai_paused && (
                        <Badge variant="paused">AI Paused</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mr-8">
                  {onRefresh && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setHistoryOpen(true)}
                        title="Intervention History"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  )}
                  {onToggleAi && (
                    <Button
                      variant={sessionDetail.session.ai_paused ? 'success' : 'warning'}
                      size="sm"
                      onClick={() => onToggleAi(!sessionDetail.session.ai_paused)}
                      disabled={isToggling}
                      className="gap-2"
                    >
                      {sessionDetail.session.ai_paused ? (
                        <>
                          <Play className="h-4 w-4" /> Resume AI
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" /> Pause AI
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Items Summary */}
            {sessionDetail.session.items && sessionDetail.session.items.length > 0 && (
              <div className="bg-muted/30 border-b border-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Cart ({sessionDetail.session.items.length} items)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sessionDetail.session.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-background rounded-lg px-3 py-2 text-xs border border-border"
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{item.item_name || (item as any).name}</span>
                        {(item as any).size_or_weight && (
                          <span className="text-muted-foreground">({(item as any).size_or_weight})</span>
                        )}
                        <span className="text-muted-foreground">× {item.quantity}</span>
                      </div>
                      {((item as any).custom_text_prompt || (item as any).custom_text) && (
                        <div className="mt-1 text-xs bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          {(item as any).custom_text_prompt && (
                            <div className="text-amber-700 font-medium">
                              Q: {(item as any).custom_text_prompt}
                            </div>
                          )}
                          {(item as any).custom_text && (
                            <div className="text-amber-600 mt-0.5">
                              A: "{(item as any).custom_text}"
                            </div>
                          )}
                        </div>
                      )}
                      {(item as any).addons && (item as any).addons.length > 0 && (
                        <div className="mt-1 pl-2 border-l border-border space-y-0.5">
                          {(item as any).addons.map((addon: any, addonIdx: number) => (
                            <div key={addonIdx} className="text-muted-foreground">
                              + {addon.addon_name} × {addon.quantity}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages - Chat Style */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 scroll-smooth"
            >
              {sessionDetail.messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet
                </div>
              ) : (
                <>
                  {sessionDetail.messages.map((msg: any) => {
                    // Map session API properties to ChatMessage properties
                    // Session API often uses 'type' instead of 'message_type', 
                    // and 'image_url' or 'url' instead of 'media_url'.
                    const rawType = msg.message_type || msg.type || msg.media_type;

                    // If content is "[Image]" it's a strong hint this is an image message 
                    // even if the type field is missing or generic 'text'.
                    const isImageHint = msg.content === '[Image]' || (msg as any).text === '[Image]';

                    const mappedMsg = {
                      ...msg,
                      content: msg.content || (msg as any).text || (msg as any).message || '',
                      message_type: rawType || (isImageHint ? 'image' : 'text'),
                      media_url: msg.media_url || (msg as any).image_url || (msg as any).imageUrl || (msg as any).url || (msg as any).mediaUrl || (msg as any).video_url || (msg as any).audio_url || (msg as any).document_url,
                      media_caption: msg.media_caption || (msg as any).caption || (msg as any).mediaCaption || (msg as any).message,
                      media_filename: msg.media_filename || (msg as any).filename || (msg as any).mediaFilename,
                      media_mime_type: msg.media_mime_type || (msg as any).mime_type || (msg as any).mediaMimeType,
                      direction: msg.direction === 'incoming' ? 'inbound' : msg.direction
                    };

                    return (
                      <MessageBubble
                        key={msg.id}
                        message={mappedMsg}
                        onImageClick={setLightboxImage}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Footer info */}
            <div className="bg-muted/30 border-t border-border p-3 text-center text-xs text-muted-foreground">
              Session started {formatDateTime(sessionDetail.session.created_at || '')}
            </div>
          </div>
        ) : null}
      </DialogContent>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
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
      <InterventionHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        sessionId={sessionDetail?.session.id || ''}
      />
    </Dialog>
  );
};