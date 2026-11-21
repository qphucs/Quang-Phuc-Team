"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { EVENT_TYPES } from "@/lib/realtime-events";

/**
 * Opens one SSE connection per tab and refreshes cached data when the server emits an event.
 * Events carry ids only; the client refetches what it needs.
 */
export function RealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = (event) => {
      let type: string;
      try {
        type = (JSON.parse(event.data) as { type: string }).type;
      } catch {
        return;
      }
      if (!(EVENT_TYPES as readonly string[]).includes(type)) return;
      if (type.startsWith("member.")) {
        void queryClient.invalidateQueries({ queryKey: ["members"] });
        void queryClient.invalidateQueries({ queryKey: ["member"] });
      }
      if (type.startsWith("skill.")) {
        void queryClient.invalidateQueries({ queryKey: ["skills"] });
        void queryClient.invalidateQueries({ queryKey: ["skill"] });
        void queryClient.invalidateQueries({ queryKey: ["skills-admin"] });
      }
      if (type.startsWith("learning.")) {
        void queryClient.invalidateQueries({ queryKey: ["my-learning"] });
        void queryClient.invalidateQueries({ queryKey: ["learning-matrix"] });
        void queryClient.invalidateQueries({ queryKey: ["levels-progress"] });
        void queryClient.invalidateQueries({ queryKey: ["levels"] });
      }
    };
    return () => source.close();
  }, [queryClient]);

  return null;
}
