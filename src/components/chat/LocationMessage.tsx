import { MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  content?: string; // e.g. "[Location: Pattom, Thiruvananthapuram, Kerala]"
  isOutgoing?: boolean;
}

// Parse location name from content like "[Location: Pattom, Thiruvananthapuram, Kerala]"
const parseLocationName = (content?: string): string | null => {
  if (!content) return null;
  const match = content.match(/\[Location:\s*(.+?)\]/);
  return match ? match[1].trim() : null;
};

export const LocationMessage = ({ latitude, longitude, content, isOutgoing }: LocationMessageProps) => {
  const locationName = parseLocationName(content);
  // Universal Google Maps link - works on iOS, Android, Web
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  // OpenStreetMap iframe embed (reliable, free, no API key)
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.003},${latitude - 0.002},${longitude + 0.003},${latitude + 0.002}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
    >
      {/* Map Preview - using iframe embed */}
      <div className="relative w-[280px] h-[140px] bg-muted overflow-hidden">
        <iframe
          src={osmEmbedUrl}
          className="w-full h-full border-0 pointer-events-none"
          title="Location map"
          loading="lazy"
        />
        {/* Overlay to ensure link works */}
        <div className="absolute inset-0" />
      </div>

      {/* Location info footer */}
      <div
        className={cn(
          'px-3 py-2 flex items-center gap-2',
          isOutgoing
            ? 'bg-black/20'
            : 'bg-muted/50'
        )}
      >
        <MapPin className={cn(
          'h-4 w-4 flex-shrink-0',
          isOutgoing ? 'text-white/80' : 'text-red-500'
        )} />
        <span className={cn(
          'text-sm flex-1 truncate',
          isOutgoing ? 'text-white/90' : 'text-foreground'
        )}>
          {locationName || `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`}
        </span>
        <ExternalLink className={cn(
          'h-4 w-4 flex-shrink-0',
          isOutgoing ? 'text-white/60' : 'text-muted-foreground'
        )} />
      </div>
    </a>
  );
};
