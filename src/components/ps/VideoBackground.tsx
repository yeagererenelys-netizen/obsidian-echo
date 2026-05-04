import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  src: string;
  opacity?: number;
  className?: string;
}

/**
 * High-performance video background component.
 * Uses IntersectionObserver to play only when visible.
 */
export function VideoBackground({ src, opacity = 0.1, className = "" }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.01 });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return;
    
    if (isVisible) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isVisible, src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.src !== src) {
      el.src = src;
      el.load();
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ${className}`}
      style={{ opacity: isVisible ? opacity : 0, zIndex: 0 }}
    />
  );
}
