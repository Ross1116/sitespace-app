import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

type ProgressiveImageProps = ImageProps & {
  lowQualitySrc: string;
  wrapperClassName?: string;
};

export default function ProgressiveImage({
  alt,
  className,
  lowQualitySrc,
  loading,
  priority,
  fetchPriority,
  wrapperClassName,
  ...props
}: ProgressiveImageProps) {
  const placeholderLoading = priority ? undefined : (loading ?? "lazy");

  return (
    <span className={cn("relative block overflow-hidden", wrapperClassName)}>
      <Image
        src={lowQualitySrc}
        alt=""
        aria-hidden="true"
        fill
        unoptimized
        sizes="100vw"
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-sm"
        loading={placeholderLoading}
        priority={priority}
        fetchPriority={fetchPriority}
        decoding="async"
      />
      <Image
        {...props}
        alt={alt}
        loading={loading}
        priority={priority}
        fetchPriority={fetchPriority}
        className={cn("relative z-10", className)}
      />
    </span>
  );
}
