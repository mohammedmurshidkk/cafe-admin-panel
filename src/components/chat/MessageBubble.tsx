import { ChatMessage } from '@/types';
import { MediaMessage } from './MediaMessage';
import { format } from 'date-fns';
import { Check, CheckCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Convert UTC string to local Date
const toLocalDate = (utcString: string) => {
  const dateStr = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
  return new Date(dateStr);
};

interface MessageBubbleProps {
  message: ChatMessage;
  onImageClick?: (url: string) => void;
}

export const MessageBubble = ({ message, onImageClick }: MessageBubbleProps) => {
  const isOutgoing = message.direction === 'outgoing'; // AI message
  const isOutbound = message.direction === 'outbound'; // Admin message
  const isSentMessage = isOutgoing || isOutbound; // Both appear on right side
  const time = format(toLocalDate(message.created_at), 'HH:mm');

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

  return (
    <div
      className={cn(
        'flex mb-2',
        isSentMessage ? 'justify-end' : 'justify-start'
      )}
    >
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
        {/* AI Badge */}
        {isOutgoing && (
          <div className="flex items-center gap-1 mb-1">
            <Sparkles className="h-3 w-3 text-yellow-300" />
            <span className="text-[10px] font-medium text-white/90">AI Assistant</span>
          </div>
        )}

        {message.message_type === 'text' ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
    </div>
  );
};
