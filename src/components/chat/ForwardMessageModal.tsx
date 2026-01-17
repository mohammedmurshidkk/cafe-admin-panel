import { useState } from 'react';
import { useGetChatSessionsQuery, useSendMessageMutation } from '@/store/api/chatApi';
import { ChatMessage, ChatSession } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Forward, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/utils/formatters';
import { toast } from 'sonner';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentSessionId: string;
}

export const ForwardMessageModal = ({
  isOpen,
  onClose,
  messages,
  currentSessionId,
}: ForwardMessageModalProps) => {
  const [search, setSearch] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);

  const { data, isLoading } = useGetChatSessionsQuery({
    status: 'active',
    limit: 20,
  });
  const [sendMessage] = useSendMessageMutation();

  const sessions = data?.data?.sessions || [];

  // Filter out current session and apply search
  const filteredSessions = sessions.filter((session) => {
    if (session.id === currentSessionId) return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      session.customer_phone.toLowerCase().includes(searchLower) ||
      session.customer_name?.toLowerCase().includes(searchLower)
    );
  });

  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  console.log('####### messages', messages)

  const handleForward = async () => {
    if (selectedSessions.length === 0 || messages.length === 0) return;

    setIsForwarding(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const targetSessionId of selectedSessions) {
        for (const message of messages) {
          try {
            const isMediaMessage = ['image', 'video', 'audio', 'document'].includes(message.message_type);
            const isLocationMessage = message.message_type === 'location';

            await sendMessage({
              sessionId: targetSessionId,
              message: {
                type: message.message_type,
                content: message.content ? `${message.content}` : undefined,
                // For media messages, pass the media_url and media_id so backend can re-use it
                media_url: isMediaMessage ? message.media_url : undefined,
                media_id: isMediaMessage ? message.media_id : undefined,
                caption: message.media_caption || message.caption,
                filename: message.media_filename || undefined,
                latitude: isLocationMessage ? message.latitude : undefined,
                longitude: isLocationMessage ? message.longitude : undefined,
                address: isLocationMessage ? message.address : undefined,
                is_forwarded: true,
              },
            }).unwrap();
            successCount++;
          } catch {
            failCount++;
          }
        }
      }

      if (successCount > 0) {
        toast.success(
          `Forwarded ${messages.length} message${messages.length > 1 ? 's' : ''} to ${selectedSessions.length} contact${selectedSessions.length > 1 ? 's' : ''}`
        );
      }
      if (failCount > 0) {
        toast.error(`Failed to forward ${failCount} message${failCount > 1 ? 's' : ''}`);
      }

      onClose();
      setSelectedSessions([]);
    } catch (error) {
      toast.error('Failed to forward messages');
    } finally {
      setIsForwarding(false);
    }
  };

  const handleClose = () => {
    setSelectedSessions([]);
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" />
            Forward {messages.length} message{messages.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No contacts found</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <ContactItem
                key={session.id}
                session={session}
                isSelected={selectedSessions.includes(session.id)}
                onClick={() => toggleSession(session.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-border flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isForwarding}>
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={selectedSessions.length === 0 || isForwarding}
            className="gap-2"
          >
            {isForwarding ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Forwarding...
              </>
            ) : (
              <>
                <Forward className="h-4 w-4" />
                Forward to {selectedSessions.length || ''} {selectedSessions.length === 1 ? 'contact' : selectedSessions.length > 1 ? 'contacts' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ContactItemProps {
  session: ChatSession;
  isSelected: boolean;
  onClick: () => void;
}

const ContactItem = ({ session, isSelected, onClick }: ContactItemProps) => {
  const displayName = session.customer_name || session.customer_phone;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
      )}
    >
      {/* Selection checkbox */}
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0',
          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/50'
        )}
      >
        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
        {displayName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground">{formatPhone(session.customer_phone)}</p>
      </div>
    </button>
  );
};
