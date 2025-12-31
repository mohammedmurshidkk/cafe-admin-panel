import { Button } from '@/components/ui/button';
import { useToggleChatAiPauseMutation } from '@/store/api/chatApi';
import { Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AiPauseToggleProps {
  sessionId: string;
  isPaused: boolean;
}

export const AiPauseToggle = ({ sessionId, isPaused }: AiPauseToggleProps) => {
  const [toggleAiPause, { isLoading }] = useToggleChatAiPauseMutation();

  const handleToggle = async () => {
    try {
      await toggleAiPause({ sessionId, paused: !isPaused }).unwrap();
      toast.success(isPaused ? 'AI responses enabled' : 'AI responses paused');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to toggle AI');
    }
  };

  const tooltipText = isPaused
    ? 'Human Mode: Click to enable AI'
    : 'AI Active: Click to take over';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isPaused ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
              'gap-1.5',
              isPaused
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20'
            )}
          >
            {isPaused ? (
              <>
                <User className="h-4 w-4" />
                <span className="hidden md:inline text-xs">Human</span>
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                <span className="hidden md:inline text-xs">AI On</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
