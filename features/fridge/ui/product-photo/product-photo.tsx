"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/model/auth-context";
import { useOnlineStatus } from "@/features/fridge/model/use-online-status";
import { downloadPhoto, getCachedPhoto } from "@/features/fridge/model/photo-cache";
import styles from "./product-photo.module.css";

interface ProductPhotoProps {
  imageKey?: string | null;
  url: string | null;
  alt: string;
  className: string;
  fallback: ReactNode;
}

export function ProductPhoto({ imageKey, url, alt, className, fallback }: ProductPhotoProps) {
  const { userId } = useAuth();
  const online = useOnlineStatus();
  const [cached, setCached] = useState<{ key: string; url: string } | null>(null);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const loadedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!imageKey) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const blob = await getCachedPhoto(imageKey);

      if (cancelled) {
        return;
      }

      if (blob) {
        if (loadedKeyRef.current !== imageKey) {
          loadedKeyRef.current = imageKey;
          setCached({ key: imageKey, url: URL.createObjectURL(blob) });
        }

        setResolvedKey(imageKey);
        return;
      }

      if (url && userId && online) {
        const downloaded = await downloadPhoto(url, imageKey, userId);

        if (cancelled) {
          return;
        }

        if (downloaded) {
          loadedKeyRef.current = imageKey;
          setCached({ key: imageKey, url: URL.createObjectURL(downloaded) });
          setFailedSrc(null);
        }
      }

      setResolvedKey(imageKey);
    })();

    return () => {
      cancelled = true;
    };
  }, [imageKey, online, url, userId]);

  useEffect(() => {
    if (!cached) {
      return;
    }

    return () => URL.revokeObjectURL(cached.url);
  }, [cached]);

  const resolved = imageKey ? resolvedKey === imageKey : true;
  const cachedUrl = cached !== null && cached.key === imageKey ? cached.url : null;
  const src = cachedUrl ?? (resolved ? url : null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <div className={className}>
      {showImage && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={styles.image} onError={() => setFailedSrc(src)} />
      ) : (
        fallback
      )}
    </div>
  );
}
