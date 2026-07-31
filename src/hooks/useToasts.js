// React hook over the toast store (src/lib/toast.js). useSyncExternalStore is
// React's built-in way to read from an external store and re-render when it
// changes — same approach as useUserData.js.

import { useSyncExternalStore } from "react";
import { subscribe, getToasts } from "../lib/toast";

export function useToasts() {
  return useSyncExternalStore(subscribe, getToasts, getToasts);
}
