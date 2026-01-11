import { ChatMessage } from '@/types';
import { MediaMessage } from './MediaMessage';
import { LocationMessage } from './LocationMessage';
import { format } from 'date-fns';
import { Check, CheckCheck, Sparkles, Forward } from 'lucide-react';
import { cn } from '@/lib/utils';

// Convert UTC string to local Date
const toLocalDate = (utcString: string) => {
  const dateStr = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
  return new Date(dateStr);
};

interface MessageBubbleProps {
  message: ChatMessage;
  onImageClick?: (url: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (messageId: string) => void;
  onForwardSingle?: (message: ChatMessage) => void;
}

export const MessageBubble = ({
  message,
  onImageClick,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  onForwardSingle,
}: MessageBubbleProps) => {
  const isOutgoing = message.direction === 'outgoing'; // AI message
  const isOutbound = message.direction === 'outbound'; // Admin message
  const isSentMessage = isOutgoing || isOutbound; // Both appear on right side
  const time = format(toLocalDate(message.created_at), 'HH:mm');
  const isForwarded = message.is_forwarded;

  const getStatusIcon = () => {
    if (!isSentMessage) return null;

    // White ticks for outgoing messages (both AI and Admin)
    const tickClass = isOutgoing
      ? 'h-3.5 w-3.5 text-white/70'
      : 'h-3.5 w-3.5 text-primary-foreground/70';

    switch (message.status) {
      case 'sent':
        return <Check className={tickClass} />;
      case 'delivered':
        return <CheckCheck className={tickClass} />;
      case 'read':
        return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
      case 'failed':
        return <span className="text-xs text-red-300">Failed</span>;
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect(message.id);
    }
  };

  const handleLongPress = () => {
    if (!isSelectionMode && onSelect) {
      onSelect(message.id);
    }
  };

  return (
    <div
      className={cn(
        'flex mb-2 group relative',
        isSentMessage ? 'justify-end' : 'justify-start',
        isSelectionMode && 'cursor-pointer',
        isSelected && 'bg-primary/10 -mx-4 px-4 py-1 rounded-lg'
      )}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        handleLongPress();
      }}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div className={cn(
          'flex items-center mr-2',
          isSentMessage && 'order-last ml-2 mr-0'
        )}>
          <div className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-primary border-primary'
              : 'border-muted-foreground/50'
          )}>
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 relative',
          isOutgoing
            ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-md'
            : isOutbound
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-white dark:bg-zinc-800 shadow-sm border border-border/50 rounded-bl-md text-foreground'
        )}
      >
        {/* Forwarded label */}
        {isForwarded && (
          <div className={cn(
            'flex items-center gap-1 mb-1 text-[10px] italic',
            isSentMessage ? 'text-white/70' : 'text-muted-foreground'
          )}>
            <Forward className="h-3 w-3" />
            <span>Forwarded</span>
          </div>
        )}

        {/* AI Badge */}
        {isOutgoing && !isForwarded && (
          <div className="flex items-center gap-1 mb-1">
            <Sparkles className="h-3 w-3 text-yellow-300" />
            <span className="text-[10px] font-medium text-white/90">AI Assistant</span>
          </div>
        )}

        {message.message_type === 'text' ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : message.message_type === 'location' ? (
          <LocationMessage
            latitude={message.latitude!}
            longitude={message.longitude!}
            content={message.content}
            isOutgoing={isSentMessage}
          />
        ) : (
          <MediaMessage message={message} onImageClick={onImageClick} />
        )}

        <div
          className={cn(
            'flex items-center gap-1.5 mt-1',
            isSentMessage ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isOutgoing
                ? 'text-white/70'
                : isSentMessage
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground'
            )}
          >
            {time}
          </span>
          {getStatusIcon()}
        </div>
      </div>

      {/* Forward button on hover (when not in selection mode) */}
      {!isSelectionMode && onForwardSingle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onForwardSingle(message);
          }}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
            'p-1.5 rounded-full bg-muted hover:bg-muted/80',
            isSentMessage ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'
          )}
          title="Forward message"
        >
          <Forward className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
