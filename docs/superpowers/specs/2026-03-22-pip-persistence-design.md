# Persistent Picture-in-Picture Across Navigation

**Issue:** #81

## Problem

When the user activates PiP on an event video and navigates away from EventDetail, React unmounts the VideoPlayer component, which calls `player.dispose()` — destroying the video.js instance, removing the `<video>` element from the DOM, and killing the PiP window.

## Solution

A root-level `PipProvider` context that adopts the raw `<video>` element when PiP is active, keeping it alive outside the React route tree. The video.js `Player` instance is also preserved so playback state, markers, and event handlers survive.

## Architecture

### PipProvider (new: `app/src/contexts/PipContext.tsx`)

- Wraps the app at the root level in `App.tsx`
- Renders a hidden container (`display: none` div) as a **sibling of the router** (not a descendant of any route), so route changes don't affect it
- Manages a single PiP slot: one `<video>` element + its video.js `Player` instance
- Exposes a `usePip` hook with:
  - `adoptForPip(player: Player, videoEl: HTMLVideoElement, eventId: string)` — moves the video element into the portal container and stores the player instance
  - `reclaimFromPip(): { player: Player; videoEl: HTMLVideoElement } | null` — returns both the player and element back to the caller for inline resume
  - `closePip()` — exits PiP, disposes the player, and cleans up the adopted element
  - `activePipEventId: string | null` — the event ID of the currently active PiP video

### VideoPlayer integration (modify: `app/src/components/ui/video-player.tsx`)

**New prop:** Add `eventId?: string` to `VideoPlayerProps`. EventDetail passes the event ID when rendering VideoPlayer.

**PiP enter:** Attach a listener to the raw `<video>` element (obtained via `playerRef.current.tech().el()`) for the `enterpictureinpicture` event. On fire, call `adoptForPip(player, videoEl, eventId)`.

**PiP leave:** Listen for `leavepictureinpicture` on the same element. On fire, notify the provider to clean up.

**Conditional dispose:** The existing cleanup effect calls `player.dispose()` on unmount (line ~206). This must be **skipped** when PiP is active — check `activePipEventId` before disposing. If PiP is active, the provider owns the player lifecycle; the component just detaches its refs.

**Reclaim on mount:** On mount, check if `activePipEventId` matches the incoming `eventId`. If so:
1. Call `reclaimFromPip()` to get the player and video element back
2. Move the video element into the component's container
3. Exit PiP mode (call `document.exitPictureInPicture()`)
4. Resume inline playback — no need to create a new player instance

**New video replaces PiP:** On mount with a different `eventId` (or no matching PiP), call `closePip()` to kill any existing PiP, then create a new player as normal.

### App.tsx integration (modify: `app/src/App.tsx`)

Wrap the app content with `<PipProvider>`. The provider's hidden container div must be rendered as a sibling of `<HashRouter>`, not inside it.

## Lifecycle

1. User plays video on EventDetail, clicks PiP button
2. Browser fires `enterpictureinpicture` on the `<video>` element
3. VideoPlayer calls `adoptForPip(player, videoEl, eventId)` — element moves to portal, player instance stored
4. User navigates away — VideoPlayer unmount skips `dispose()` since PiP is active
5. PiP continues playing in floating window

**Ending PiP:**
- User closes PiP window → `leavepictureinpicture` fires → provider disposes player and cleans up element
- User navigates to the same event → VideoPlayer reclaims player + element, exits PiP, resumes inline
- User navigates to a different event with video → VideoPlayer calls `closePip()`, then creates new player
- Video finishes playing → PiP window closes naturally

## Key Implementation Details

**Obtaining the raw `<video>` element:** video.js wraps video in a `<video-js>` custom element. The actual `<video>` is accessed via `player.tech().el()`. Browser PiP operates on the raw `<video>` element only — the video.js controls wrapper is irrelevant for PiP (the browser renders its own controls in the PiP window).

**What gets adopted:** Both the raw `<video>` element (moved to the hidden portal div) and the video.js `Player` instance (stored in provider state). This preserves playback position, markers, and event handlers.

**`contexts/` directory:** Does not exist yet — create it.

## Platform Support

Browser PiP (`HTMLVideoElement.requestPictureInPicture()`) support:
- **Desktop (Tauri):** Supported in WKWebView (macOS) and WebView2 (Windows)
- **iOS (Capacitor):** WKWebView supports PiP natively on iPad; limited on iPhone
- **Android (Capacitor):** WebView PiP support is limited/unavailable

**Graceful degradation:** If `enterpictureinpicture` never fires (unsupported platform), the provider is never activated — VideoPlayer behaves exactly as before. No feature detection needed; the PiP button visibility is controlled by video.js which already handles this.

## Constraints

- Only one PiP at a time (browser-enforced)
- The adopted element is a raw DOM node moved outside React's tree — the provider owns cleanup
- The video.js Player instance must not be garbage collected while PiP is active — the provider holds a reference
