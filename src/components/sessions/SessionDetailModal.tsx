import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionDetail } from '@/types';
import { formatDateTime, formatPhone, formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Pause, 
  Play, 
  ShoppingCart, 
  X,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface SessionDetailModalProps {
  open: boolean;
  onClose: () => void;
  sessionDetail: SessionDetail | undefined;
  isLoading: boolean;
  onToggleAi?: (paused: boolean) => Promise<void>;
  isToggling?: boolean;
}

export const SessionDetailModal = ({
  open,
  onClose,
  sessionDetail,
  isLoading,
  onToggleAi,
  isToggling = false,
}: SessionDetailModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
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

            {/* Cart Items Summary */}
            {sessionDetail.session.items && sessionDetail.session.items.length > 0 && (
              <div className="bg-muted/30 border-b border-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Cart ({sessionDetail.session.items.length} items)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sessionDetail.session.items.map((item, idx) => (
                    <span 
                      key={idx} 
                      className="bg-background rounded-full px-3 py-1 text-xs border border-border"
                    >
                      {item.item_name} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Messages - WhatsApp Style */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ 
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                backgroundColor: 'hsl(var(--muted) / 0.3)'
              }}
            >
              {sessionDetail.messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No messages yet
                </div>
              ) : (
                sessionDetail.messages.map((msg) => {
                  const isIncoming = msg.direction === 'incoming' || msg.direction === 'inbound';
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isIncoming ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "relative max-w-[75%] px-3 py-2 rounded-lg shadow-sm",
                          isIncoming 
                            ? "bg-background border border-border rounded-tl-none" 
                            : "bg-secondary/20 text-foreground rounded-tr-none"
                        )}
                      >
                        {/* Message tail */}
                        <div 
                          className={cn(
                            "absolute top-0 w-3 h-3",
                            isIncoming
                              ? "-left-3 border-t border-l border-border bg-background"
                              : "-right-3 bg-secondary/20"
                          )}
                          style={{
                            clipPath: isIncoming 
                              ? 'polygon(100% 0, 0 0, 100% 100%)' 
                              : 'polygon(0 0, 100% 0, 0 100%)'
                          }}
                        />
                        
                        {/* Message content */}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        
                        {/* Timestamp and read status */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDateTime(msg.created_at)}
                          </span>
                          {!isIncoming && (
                            <CheckCheck className="h-3 w-3 text-secondary" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer info */}
            <div className="bg-muted/30 border-t border-border p-3 text-center text-xs text-muted-foreground">
              Session started {formatDateTime(sessionDetail.session.created_at || '')}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};