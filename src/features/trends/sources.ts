import "server-only";

/** One item returned by an automatic source. */
export type RawTrend = {
  type: "capcut_edit" | "sound";
  url: string;
  title: string;
  author: string;
  coverUrl: string | null;
  soundName: string | null;
  viewCount: number | null;
  useCount: number | null;
};

/**
 * 🔒 Automatic source adapter (docs/04-architecture.md §3.1).
 * No automatic source is enabled yet: the choice depends on the paid/free API decision.
 * Add an adapter here and it will be picked up by the daily scan.
 */
export interface TrendSource {
  readonly name: string;
  fetch(): Promise<RawTrend[]>;
}

export const TREND_SOURCES: TrendSource[] = [];
