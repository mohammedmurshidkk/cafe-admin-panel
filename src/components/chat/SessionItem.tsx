import { ChatSession } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Image, Video, Mic, FileText, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

// Convert UTC string to local Date
const toLocalDate = (utcString: string) => {
  const dateStr = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
  return new Date(dateStr);
};

interface SessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  hasPendingIntervention?: boolean;
  onClick: () => void;
  onPeek?: (e: React.MouseEvent) => void;
}

export const SessionItem = ({ session, isSelected, hasPendingIntervention, onClick, onPeek }: SessionItemProps) => {
  const getLastMessagePreview = () => {
    if (!session.last_message) return 'No messages yet';

    const { message_type, content, direction } = session.last_message;
    const isAI = direction === 'outgoing';
    const isAdmin = direction === 'outbound';

    // Prefix with icon for AI or "You:" for admin
    const getPrefix = () => {
      if (isAI) return <Sparkles className="h-3 w-3 text-violet-500 flex-shrink-0" />;
      if (isAdmin) return <span>You:</span>;
      return null;
    };

    switch (message_type) {
      case 'image':
        return (
          <span className="flex items-center gap-1">
            {getPrefix()} <Image className="h-3 w-3" /> Photo
          </span>
        );
      case 'video':
        return (
          <span className="flex items-center gap-1">
            {getPrefix()} <Video className="h-3 w-3" /> Video
          </span>
        );
      case 'audio':
        return (
          <span className="flex items-center gap-1">
            {getPrefix()} <Mic className="h-3 w-3" /> Voice message
          </span>
        );
      case 'document':
        return (
          <span className="flex items-center gap-1">
            {getPrefix()} <FileText className="h-3 w-3" /> Document
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1">
            {getPrefix()} {content.length > 30 ? content.slice(0, 30) + '...' : content}
          </span>
        );
    }
  };

  const displayName = session.customer_name || session.customer_phone;
  const timeAgo = session.last_message_at
    ? formatDistanceToNow(toLocalDate(session.last_message_at), { addSuffix: false })
    : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border',
        isSelected && 'bg-muted',
        hasPendingIntervention && !isSelected && 'bg-red-50/50 dark:bg-red-900/10'
      )}
    >
      {/* Avatar */}
      <div className="group relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium group-hover:opacity-20 transition-opacity">
          {displayName.charAt(0).toUpperCase()}
        </div>

        {/* Peek Button (Visible on Hover) */}
        {onPeek && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={onPeek}
            title="Peek View (Don't mark as read)"
          >
            <Eye className="h-5 w-5 text-primary" />
          </div>
        )}

        {/* Show badge based on AI status */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center',
            session.ai_paused
              ? 'bg-yellow-500' // AI paused - human mode
              : 'bg-green-500'  // AI active
          )}
          title={session.ai_paused ? 'Human Mode' : 'AI Active'}
        >
          <span className="text-[8px] text-white font-bold">
            {session.ai_paused ? 'H' : 'AI'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium truncate">{displayName}</span>
            {hasPendingIntervention && (
              <div className="shrink-0 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold pl-1.5 pr-2 py-0.5 rounded-full flex items-center gap-1.5 border border-red-200 dark:border-red-800 animate-in fade-in zoom-in duration-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Action
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground truncate">
            {getLastMessagePreview()}
          </span>
          {session.unread_count > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
              {session.unread_count > 99 ? '99+' : session.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
