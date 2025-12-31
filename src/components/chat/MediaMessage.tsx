import { useState, useRef } from 'react';
import { ChatMessage } from '@/types';
import { Play, Pause, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaMessageProps {
  message: ChatMessage;
  onImageClick?: (url: string) => void;
}

export const MediaMessage = ({ message, onImageClick }: MediaMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    setProgress((currentTime / duration) * 100);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  switch (message.message_type) {
    case 'image':
      return (
        <div className="space-y-1">
          <img
            src={message.media_url || ''}
            alt={message.media_caption || 'Image'}
            className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => message.media_url && onImageClick?.(message.media_url)}
          />
          {message.media_caption && (
            <p className="text-sm">{message.media_caption}</p>
          )}
        </div>
      );

    case 'video':
      return (
        <div className="space-y-1">
          <div className="relative rounded-lg overflow-hidden max-w-full">
            <video
              ref={videoRef}
              src={message.media_url || ''}
              className="max-w-full max-h-64"
              controls
              preload="metadata"
            />
          </div>
          {message.media_caption && (
            <p className="text-sm">{message.media_caption}</p>
          )}
        </div>
      );

    case 'audio':
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          <audio
            ref={audioRef}
            src={message.media_url || ''}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={handleAudioEnded}
            preload="metadata"
          />
          <button
            onClick={toggleAudioPlay}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>
          <div className="flex-1 space-y-1">
            <div className="h-1 bg-muted-foreground/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDuration(message.media_duration)}
            </span>
          </div>
        </div>
      );

    case 'document':
      return (
        <a
          href={message.media_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {message.media_filename || 'Document'}
            </p>
            <p className="text-xs text-muted-foreground">
              {message.media_mime_type || 'File'}
            </p>
          </div>
          <Download className="h-5 w-5 text-muted-foreground" />
        </a>
      );

    default:
      return null;
  }
};
