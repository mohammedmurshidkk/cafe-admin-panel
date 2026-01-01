import { useState, useEffect } from 'react';

const cache = new Map<string, string>();

export const useReverseGeocode = (lat: string | null | undefined, lng: string | null | undefined) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) {
      setAddress(null);
      return;
    }

    const cacheKey = `${lat},${lng}`;

    if (cache.has(cacheKey)) {
      setAddress(cache.get(cacheKey)!);
      return;
    }

    const fetchAddress = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await response.json();
        const addr = data.display_name || `${lat}, ${lng}`;
        cache.set(cacheKey, addr);
        setAddress(addr);
      } catch {
        setAddress(`${lat}, ${lng}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, [lat, lng]);

  return { address, isLoading };
};

// Standalone function for non-hook usage (with caching)
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const cacheKey = `${lat},${lng}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    const addr = data.display_name || `${lat}, ${lng}`;
    cache.set(cacheKey, addr);
    return addr;
  } catch {
    return `${lat}, ${lng}`;
  }
};
