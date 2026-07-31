// App-wide toast notifications.
//
// Mirrors the pub/sub + useSyncExternalStore pattern used for user data
// (src/lib/userData.js): a tiny external store React subscribes to, so any
// module can fire a toast without threading a context through the whole tree.
// The <ToastViewport /> mounted in Layout renders whatever lives here.

const listeners = new Set();

// Current toasts. useSyncExternalStore needs getSnapshot to return a
// referentially STABLE value between changes, so we only build a NEW array when
// something actually changes and hand that same reference out until the next
// change (otherwise React loops / warns).
let toasts = [];

// How long each kind stays before auto-dismissing. Errors linger longest so
// they're not missed.
const DURATIONS = { success: 3500, info: 4000, error: 6000 };

function emit() {
  for (const fn of listeners) fn();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts() {
  return toasts;
}

export function dismiss(id) {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return; // already gone — no-op
  toasts = next;
  emit();
}

// Monotonic id without Date.now collisions across a burst (matches userData.js).
let _seq = 0;
function nextId() {
  _seq += 1;
  return `toast-${_seq}-${Math.floor(performance.now())}`;
}

function show(type, message) {
  if (!message) return;
  const id = nextId();
  toasts = [...toasts, { id, type, message }];
  emit();
  // Auto-dismiss. The viewport also offers manual dismiss, and dismiss() no-ops
  // if the toast is already gone, so the two can't conflict.
  setTimeout(() => dismiss(id), DURATIONS[type] ?? DURATIONS.info);
  return id;
}

export const toast = {
  success: (message) => show("success", message),
  error: (message) => show("error", message),
  info: (message) => show("info", message),
};
