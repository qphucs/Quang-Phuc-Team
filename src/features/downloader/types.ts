/** Client-safe shapes shared between server and UI. No server imports here. */
export type MediaPreview = {
  url: string;
  title: string;
  author: string;
  cover: string | null;
  durationSec: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  images: number[];
};

export type DownloadKindLabel = "video" | "audio" | "image";

export const KIND_LABEL: Record<DownloadKindLabel, string> = {
  video: "Video",
  audio: "Nhạc",
  image: "Ảnh",
};
