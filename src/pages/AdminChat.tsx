import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SessionList } from '@/components/chat/SessionList';
import { ChatView } from '@/components/chat/ChatView';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const LAST_CHAT_SESSION_KEY = 'lastChatSessionId';

const AdminChat = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPeekMode = searchParams.get('peek') === 'true';
  const selectedSessionId = sessionId || null;

  // Persist last active session to localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(LAST_CHAT_SESSION_KEY, sessionId);
    }
  }, [sessionId]);

  const handleSelectSession = (id: string | null) => {
    if (id) {
      // Preserve peek mode if active
      const search = isPeekMode ? '?peek=true' : '';
      navigate(`/chat/${id}${search}`);
    } else {
      localStorage.removeItem(LAST_CHAT_SESSION_KEY);
      navigate('/chat');
    }
  };

  const handlePeekSession = (id: string) => {
    navigate(`/chat/${id}?peek=true`);
  };

  // Real-time updates via WebSocket
  useChatWebSocket({ selectedSessionId });

  return (
    <div className="h-[calc(100vh-4rem)] -m-4 md:-m-6 -mb-20 md:-mb-6 flex overflow-hidden">
      {/* Session List - Left Panel */}
      <SessionList
        selectedSessionId={selectedSessionId}
        onSelectSession={handleSelectSession}
        onPeekSession={handlePeekSession}
        className={cn(
          'w-full md:w-[320px] lg:w-[360px] border-r border-border flex-shrink-0',
          selectedSessionId && 'hidden md:flex md:flex-col'
        )}
      />

      {/* Chat View - Right Panel */}
      {selectedSessionId ? (
        <ChatView
          sessionId={selectedSessionId}
          onBack={() => handleSelectSession(null)}
          isPeekMode={isPeekMode}
          className="flex-1"
        />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
            <p className="text-sm">Choose a session from the left to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChat;
