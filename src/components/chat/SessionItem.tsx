import { ChatSession } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Image, Video, Mic, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const prefix = isAI
      ? <Sparkles className="h-3 w-3 text-primary-container flex-shrink-0" />
      : isAdmin
        ? <span className="text-on-surface-variant">You:</span>
        : null;

    switch (message_type) {
      case 'image':
        return <span className="flex items-center gap-1">{prefix} <Image className="h-3 w-3" /> Photo</span>;
      case 'video':
        return <span className="flex items-center gap-1">{prefix} <Video className="h-3 w-3" /> Video</span>;
      case 'audio':
        return <span className="flex items-center gap-1">{prefix} <Mic className="h-3 w-3" /> Voice message</span>;
      case 'document':
        return <span className="flex items-center gap-1">{prefix} <FileText className="h-3 w-3" /> Document</span>;
      default:
        return (
          <span className="flex items-center gap-1">
            {prefix} {content.length > 32 ? content.slice(0, 32) + '...' : content}
          </span>
        );
    }
  };

  const displayName = session.customer_name || session.customer_phone;
  const initials = displayName.charAt(0).toUpperCase();
  const timeAgo = session.last_message_at
    ? formatDistanceToNow(toLocalDate(session.last_message_at), { addSuffix: false })
    : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-outline-variant/30',
        isSelected
          ? 'bg-blush border-l-2 border-l-primary-container'
          : 'hover:bg-surface-container-low',
        hasPendingIntervention && !isSelected && 'bg-error-container/20'
      )}
    >
      {/* Avatar */}
      <div className="group relative flex-shrink-0">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-opacity',
          isSelected ? 'bg-primary-container text-white' : 'bg-blush text-brand-primary',
          onPeek && 'group-hover:opacity-20'
        )}>
          {initials}
        </div>

        {/* Peek Button */}
        {onPeek && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={onPeek}
            title="Peek (don't mark as read)"
          >
            <span className="material-symbols-outlined text-[18px] text-brand-primary">visibility</span>
          </div>
        )}

        {/* AI / Manual badge */}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center',
          session.ai_paused ? 'bg-amber-400' : 'bg-tertiary-ds'
        )}>
          <span className="text-[7px] text-white font-bold leading-none">
            {session.ai_paused ? 'M' : 'AI'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-sm text-on-surface truncate">{displayName}</span>
            {hasPendingIntervention && (
              <span className="shrink-0 inline-flex items-center gap-1 bg-error-container text-on-error-container text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-error-container opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-on-error-container" />
                </span>
                Action
              </span>
            )}
          </div>
          <span className="text-[11px] text-on-surface-variant flex-shrink-0">{timeAgo}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-on-surface-variant truncate">
            {getLastMessagePreview()}
          </span>
          {session.unread_count > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-primary-container text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
              {session.unread_count > 99 ? '99+' : session.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
