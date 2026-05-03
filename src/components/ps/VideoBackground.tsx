import { useRef, useEffect } from "react";

export function VideoBackground({
  src,
  opacity = 0.1,
  className = "",
}: {
  src: string;
  opacity?: number;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && el) {
          el.src = src;
          el.play().catch(() => {});
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity,
        zIndex: 0,
        pointerEvents: "none",
      }}
      className={className}
    />
  );
}
