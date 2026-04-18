import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceRecorder } from './VoiceRecorder';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Send, Image, Video, FileText, X } from 'lucide-react';
import { useSendMessageMutation, useUploadMediaMutation } from '@/store/api/chatApi';
import { toast } from 'sonner';

interface ChatInputProps {
  sessionId: string;
  disabled?: boolean;
}

interface PendingQuoteData {
  quote_id: string;
  quote_price: number;
}

export interface ChatInputHandle {
  setMessage: (message: string, quoteData?: PendingQuoteData) => void;
  focus: () => void;
  clearQuoteData: () => void;
}

type MediaType = 'image' | 'video' | 'document';

interface PendingMedia {
  file: File;
  type: MediaType;
  preview?: string;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({ sessionId, disabled }, ref) => {
  const [message, setMessage] = useState('');
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [pendingQuote, setPendingQuote] = useState<PendingQuoteData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    setMessage: (msg: string, quoteData?: PendingQuoteData) => {
      setMessage(msg);
      if (quoteData) {
        setPendingQuote(quoteData);
      }
      // Focus and scroll to end of textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        if (textareaRef.current) {
          textareaRef.current.selectionStart = msg.length;
          textareaRef.current.selectionEnd = msg.length;
        }
      }, 0);
    },
    focus: () => {
      textareaRef.current?.focus();
    },
    clearQuoteData: () => {
      setPendingQuote(null);
    }
  }));

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [uploadMedia] = useUploadMediaMutation();

  const handleSendText = async () => {
    if (!message?.trim() || isSending) return;

    try {
      await sendMessage({
        sessionId,
        message: {
          type: 'text',
          content: message?.trim() || '',
          // Include quote data if present
          ...(pendingQuote && {
            quote_id: pendingQuote.quote_id,
            quote_price: pendingQuote.quote_price,
          }),
        },
      }).unwrap();
      setMessage('');
      setPendingQuote(null); // Clear quote data after sending
      textareaRef.current?.focus();
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to send message');
    }
  };

  const handleSendMedia = async () => {
    if (!pendingMedia || isUploading) return;

    setIsUploading(true);
    try {
      const uploadResult = await uploadMedia({
        file: pendingMedia.file,
        type: pendingMedia.type === 'document' ? 'document' : pendingMedia.type,
      }).unwrap();

      await sendMessage({
        sessionId,
        message: {
          type: pendingMedia.type,
          media_id: uploadResult.data.media_id,
          caption: message?.trim() || undefined,
          filename: pendingMedia.type === 'document' ? pendingMedia.file.name : undefined,
        },
      }).unwrap();

      setPendingMedia(null);
      setMessage('');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to send media');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendVoice = async (audioBlob: Blob) => {
    setIsUploading(true);
    try {
      const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      const uploadResult = await uploadMedia({
        file,
        type: 'audio',
      }).unwrap();

      await sendMessage({
        sessionId,
        message: {
          type: 'audio',
          media_id: uploadResult.data.media_id,
        },
      }).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = useCallback((type: MediaType) => {
    if (!fileInputRef.current) return;

    const acceptMap: Record<MediaType, string> = {
      image: 'image/jpeg,image/png,image/webp',
      video: 'video/mp4,video/3gpp',
      document: 'application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
    };

    fileInputRef.current.accept = acceptMap[type];
    fileInputRef.current.dataset.type = type;
    fileInputRef.current.click();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = e.target.dataset.type as MediaType;

    if (!file || !type) return;

    const maxSizes: Record<MediaType, number> = {
      image: 5 * 1024 * 1024,
      video: 16 * 1024 * 1024,
      document: 100 * 1024 * 1024,
    };

    if (file.size > maxSizes[type]) {
      toast.error(`File too large. Max size: ${maxSizes[type] / (1024 * 1024)}MB`);
      return;
    }

    let preview: string | undefined;
    if (type === 'image') {
      preview = URL.createObjectURL(file);
    }

    setPendingMedia({ file, type, preview });
    e.target.value = '';
  };

  const cancelMedia = () => {
    if (pendingMedia?.preview) {
      URL.revokeObjectURL(pendingMedia.preview);
    }
    setPendingMedia(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (pendingMedia) {
        handleSendMedia();
      } else {
        handleSendText();
      }
    }
  };

  const isDisabled = disabled || isSending || isUploading;

  return (
    <div className="border-t border-outline-variant/40 bg-white p-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Media Preview */}
      {pendingMedia && (
        <div className="mb-3 relative inline-block">
          {pendingMedia.type === 'image' && pendingMedia.preview && (
            <img
              src={pendingMedia.preview}
              alt="Preview"
              className="max-h-32 rounded-lg"
            />
          )}
          {pendingMedia.type === 'video' && (
            <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
              <Video className="h-5 w-5" />
              <span className="text-sm">{pendingMedia.file.name}</span>
            </div>
          )}
          {pendingMedia.type === 'document' && (
            <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm">{pendingMedia.file.name}</span>
            </div>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={cancelMedia}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full flex-shrink-0"
              disabled={isDisabled}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleFileSelect('image')}>
              <Image className="h-4 w-4 mr-2" />
              Photo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFileSelect('video')}>
              <Video className="h-4 w-4 mr-2" />
              Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFileSelect('document')}>
              <FileText className="h-4 w-4 mr-2" />
              Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text Input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={pendingMedia ? 'Add a caption...' : 'Type a message...'}
          disabled={isDisabled}
          className="flex-1 min-h-[40px] max-h-[72px] resize-none rounded-2xl overflow-y-auto"
          rows={1}
        />

        {/* Send / Voice Button */}
        {message?.trim() || pendingMedia ? (
          <Button
            size="icon"
            className="h-10 w-10 rounded-full flex-shrink-0"
            onClick={pendingMedia ? handleSendMedia : handleSendText}
            disabled={isDisabled}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <VoiceRecorder onSend={handleSendVoice} disabled={isDisabled} />
        )}
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
