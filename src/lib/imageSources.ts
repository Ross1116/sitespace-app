import type { StaticImageData } from "next/image";

export function getLowQualitySrc(src: string | StaticImageData) {
  const imageSrc = typeof src === "string" ? src : src.src;
  const filename = imageSrc.split("/").pop() ?? "";
  const base = filename.replace(/\.[^.]+$/, "");
  return `/static/images/lqip/${base}.webp`;
}
